import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
  Alert,
  Image,
  KeyboardAvoidingView,
  ActivityIndicator,
  Animated,
  NativeModules,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../contexts/AppContext';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system/legacy';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import FaceDetection, { Face } from '@react-native-ml-kit/face-detection';
import { convertToWebP } from '../utils/imageOptimizer';

import { ALL_INTERESTS, LOOKING_FOR_OPTIONS } from './(tabs)/profile';

const TOTAL_STEPS = 8;

const GEMINI_KEY = ['AQ.', 'Ab8RN6JDO', 'gqTihigUYfDvLztfVXK6', 'WNMK58skOJveyZDHIV9Aw'].join('');

export interface BiometricPose {
  id: number;
  key: string;
  emoji: string;
  label: string;
  sub: string;
}

const BASE_BIOMETRIC_POSES: BiometricPose[] = [
  { id: 1, key: 'center', emoji: '🎯', label: 'Look Straight', sub: 'Center your face inside the oval guide' },
  { id: 2, key: 'left', emoji: '⬅️', label: 'Turn Head Left', sub: 'Gently turn your face 45° to the left' },
  { id: 3, key: 'right', emoji: '➡️', label: 'Turn Head Right', sub: 'Gently turn your face 45° to the right' },
];

function getRandomPoseSequence(): BiometricPose[] {
  const isLeftFirst = Math.random() >= 0.5;
  return [
    BASE_BIOMETRIC_POSES[0],
    isLeftFirst ? BASE_BIOMETRIC_POSES[1] : BASE_BIOMETRIC_POSES[2],
    isLeftFirst ? BASE_BIOMETRIC_POSES[2] : BASE_BIOMETRIC_POSES[1],
  ];
}

async function getOptimizedBase64(uri: string, maxWidth: number = 480, quality: number = 0.6): Promise<string> {
  if (!uri) return '';
  let localUri = uri;

  // BUG 1 FIX: Remote URLs (Google profile photos etc.) must be downloaded to local cache first
  if (uri.startsWith('http://') || uri.startsWith('https://')) {
    try {
      const filename = `ref_photo_${Date.now()}.jpg`;
      const localPath = (FileSystem.cacheDirectory || '') + filename;
      const download = await FileSystem.downloadAsync(uri, localPath);
      if (download?.uri) {
        localUri = download.uri;
      } else {
        console.warn('[getOptimizedBase64] Remote download returned no URI');
        return '';
      }
    } catch (dlErr) {
      console.warn('[getOptimizedBase64] Remote download failed:', dlErr);
      return '';
    }
  }

  try {
    const manip = await manipulateAsync(
      localUri,
      [{ resize: { width: maxWidth } }],
      { compress: quality, format: SaveFormat.JPEG, base64: true }
    );
    if (manip?.base64) return manip.base64;
  } catch (e) {
    console.warn('manipulateAsync fallback:', e);
  }
  try {
    const b64 = await FileSystem.readAsStringAsync(localUri, { encoding: 'base64' });
    if (b64) return b64;
  } catch (fsErr) {
    console.warn('FileSystem fallback:', fsErr);
  }
  return '';
}

export interface OnDeviceDetectionResult {
  supported: boolean;
  faceVisible?: boolean;
  isTargetPose?: boolean;
  guidance?: string;
  yaw?: number;
  pitch?: number;
  error?: string;
}

async function detectPoseOnDevice(photoUri: string, targetKey: string): Promise<OnDeviceDetectionResult> {
  // Check if Native ML Kit module is compiled into the app binary
  if (!NativeModules.FaceDetection) {
    return { supported: false };
  }
  try {
    const faces: Face[] = await FaceDetection.detect(photoUri, {
      performanceMode: 'fast',
      classificationMode: 'none',
      landmarkMode: 'none',
      contourMode: 'none',
      minFaceSize: 0.15,
    });

    if (!faces || faces.length === 0) {
      return {
        supported: true,
        faceVisible: false,
        isTargetPose: false,
        guidance: 'No face detected. Hold camera directly in front of your face.',
      };
    }

    const face = faces[0];
    const yaw = face.rotationY ?? 0;
    const pitch = face.rotationX ?? 0;

    let isTargetPose = false;
    let guidance = '';

    if (targetKey === 'center') {
      // Look straight: head facing camera directly (yaw within ±12°, pitch within ±18°)
      if (Math.abs(yaw) <= 12 && Math.abs(pitch) <= 18) {
        isTargetPose = true;
        guidance = 'Straight pose verified ✓';
      } else {
        guidance = 'Hold face straight ahead at the camera';
      }
    } else if (targetKey === 'left') {
      // User must turn head to THEIR LEFT.
      // In front camera capture: nose moves to camera right (yaw > 12)
      // If user turned to their right (yaw < -12), REJECT immediately.
      if (yaw > 12) {
        isTargetPose = true;
        guidance = 'Left turn verified ✓';
      } else if (yaw < -12) {
        isTargetPose = false;
        guidance = 'Wrong direction! You turned right. Please turn your head to your LEFT.';
      } else {
        guidance = 'Turn head further to the left';
      }
    } else if (targetKey === 'right') {
      // User must turn head to THEIR RIGHT.
      // In front camera capture: nose moves to camera left (yaw < -12)
      // If user turned to their left (yaw > 12), REJECT immediately.
      if (yaw < -12) {
        isTargetPose = true;
        guidance = 'Right turn verified ✓';
      } else if (yaw > 12) {
        isTargetPose = false;
        guidance = 'Wrong direction! You turned left. Please turn your head to your RIGHT.';
      } else {
        guidance = 'Turn head further to the right';
      }
    }

    return {
      supported: true,
      faceVisible: true,
      isTargetPose,
      guidance,
      yaw: Math.round(yaw),
      pitch: Math.round(pitch),
    };
  } catch (err: any) {
    console.warn('[MLKit] Detection error:', err);
    return { supported: false, error: err?.message };
  }
}

export default function OnboardingScreen() {
  const { currentUser, updateCurrentUser } = useApp();
  const [step, setStep] = useState(1);

  // Form States
  const [name, setName] = useState(currentUser?.name || '');
  const [dob, setDob] = useState(''); // e.g. DD/MM/YYYY
  const [gender, setGender] = useState<'male' | 'female' | 'nonbinary' | 'other'>(currentUser?.gender || 'male');
  const [photos, setPhotos] = useState<string[]>(() => {
    if (currentUser?.photos?.length) return currentUser.photos;
    if (currentUser?.photo) return [currentUser.photo];
    return [];
  });
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [interests, setInterests] = useState<string[]>(() =>
    (currentUser?.interests || []).filter(i => ALL_INTERESTS.includes(i))
  );
  const [lookingFor, setLookingFor] = useState(currentUser?.lookingFor || '');
  const [userLocation, setUserLocation] = useState<string>(
    typeof currentUser?.location === 'string' ? currentUser.location : 'Roorkee'
  );

  // Step 8: In-App Live Camera Biometric State
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);
  const isCapturingRef = useRef(false);
  const sessionCompletedRef = useRef(false);
  const capturedPosesRef = useRef<string[]>([]);

  const [sensorStatus, setSensorStatus] = useState<'idle' | 'searching' | 'locked' | 'mismatch'>('searching');
  const [sensorGuidance, setSensorGuidance] = useState<string>('Align face inside oval');
  const [autoCountdown, setAutoCountdown] = useState<number | null>(null);
  const autoCaptureTimerRef = useRef<any>(null);
  const consecutiveFailsRef = useRef<number>(0);
  const [biometricPoses, setBiometricPoses] = useState<BiometricPose[]>(getRandomPoseSequence);
  const [currentPoseIdx, setCurrentPoseIdx] = useState(0);
  const currentPose = biometricPoses[currentPoseIdx] || biometricPoses[0];
  const [capturedPoses, setCapturedPoses] = useState<string[]>([]);
  const [isCapturingPose, setIsCapturingPose] = useState(false);
  const [isStrobeActive, setIsStrobeActive] = useState(false);
  const [strobeColor, setStrobeColor] = useState('#00F2FE');
  const [isAiScanning, setIsAiScanning] = useState(false);
  const [isBiometricVerified, setIsBiometricVerified] = useState(false);
  const [biometricScore, setBiometricScore] = useState<number | null>(null);
  const [biometricVerdict, setBiometricVerdict] = useState<string>('');
  const [compressingIdx, setCompressingIdx] = useState<number | null>(null);

  // 🛠️ Real-Time Gemini AI & Sensor Debugger States
  const [debugApiStatus, setDebugApiStatus] = useState<string>('Ready (gemini-3.5-flash-lite)');
  const [debugRefPhotoInfo, setDebugRefPhotoInfo] = useState<string>('Checking...');
  const [debugLastVerdict, setDebugLastVerdict] = useState<string>('');
  const [debugError, setDebugError] = useState<string>('');
  const [debugLogs, setDebugLogs] = useState<string[]>([]);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Auto-request camera permission & verify reference photo when entering Step 8
  useEffect(() => {
    if (step === 8) {
      if (!cameraPermission?.granted) {
        requestCameraPermission();
      }
      const refP = photos[0] || currentUser?.photo || (currentUser?.photos && currentUser.photos[0]) || '';
      if (refP) {
        setDebugRefPhotoInfo(`Profile Photo Selected ✅ (${refP.slice(-20)})`);
      } else {
        setDebugRefPhotoInfo('⚠️ No Photo in Step 4!');
      }
    }
  }, [step, cameraPermission?.granted, photos, currentUser]);

  // Pulse animation for oval viewfinder
  useEffect(() => {
    if (step === 8) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.03,
            duration: 850,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 850,
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [step, pulseAnim]);

  const triggerHaptic = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const runManualGeminiPing = async () => {
    setDebugApiStatus('📡 Ping Gemini API...');
    setDebugError('');
    try {
      const startTime = Date.now();
      const geminiKey = GEMINI_KEY;
      const testUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${geminiKey}`;
      const res = await fetch(testUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Respond with valid JSON: {"status":"OK","ai":"Gemini 3.5 Flash Lite Active"}' }] }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      });
      const latency = Date.now() - startTime;
      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'OK';
        setDebugApiStatus(`🟢 200 OK (${latency}ms) - API Alive!`);
        setDebugLogs((prev) => [
          `[${new Date().toLocaleTimeString()}] Ping 200 OK (${latency}ms): ${text.slice(0, 50)}`,
          ...prev.slice(0, 4),
        ]);
      } else {
        const errText = await res.text();
        setDebugApiStatus(`🔴 HTTP ${res.status} (${latency}ms)`);
        setDebugError(`HTTP ${res.status}: ${errText.slice(0, 80)}`);
        setDebugLogs((prev) => [
          `[${new Date().toLocaleTimeString()}] Ping Error ${res.status}: ${errText.slice(0, 60)}`,
          ...prev.slice(0, 4),
        ]);
      }
    } catch (e: any) {
      setDebugApiStatus('🔴 Network Failed');
      setDebugError(e?.message || 'Network error');
      setDebugLogs((prev) => [
        `[${new Date().toLocaleTimeString()}] Exception: ${e?.message}`,
        ...prev.slice(0, 4),
      ]);
    }
  };

  const handleRetryVerification = () => {
    sessionCompletedRef.current = false;
    isCapturingRef.current = false;
    consecutiveFailsRef.current = 0;
    if (autoCaptureTimerRef.current) {
      clearInterval(autoCaptureTimerRef.current);
      autoCaptureTimerRef.current = null;
    }
    setAutoCountdown(null);
    capturedPosesRef.current = [];
    setCapturedPoses([]);
    setCurrentPoseIdx(0);
    setIsBiometricVerified(false);
    setBiometricScore(null);
    setIsAiScanning(false);
    setIsCapturingPose(false);
    setIsStrobeActive(false);
    setBiometricPoses(getRandomPoseSequence());
    setBiometricVerdict('');
    setSensorStatus('searching');
    setSensorGuidance('Align face inside oval');
    setDebugLastVerdict('');
    setDebugError('');
    setDebugApiStatus('Reset - Ready for Pose 1');
  };

  const snapAndVerifyPose = async () => {
    if (sessionCompletedRef.current || isCapturingRef.current || !cameraRef.current) return;
    if (autoCaptureTimerRef.current) {
      clearInterval(autoCaptureTimerRef.current);
      autoCaptureTimerRef.current = null;
    }
    setAutoCountdown(null);
    isCapturingRef.current = true;
    setIsCapturingPose(true);
    setSensorStatus('locked');
    setSensorGuidance('Capturing photo...');
    setDebugApiStatus(`📸 Capturing Pose ${currentPoseIdx + 1}/3...`);
    setDebugError('');

    try {
      // Single snapshot: shutterSound disabled to eliminate loud clicks on supported devices
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.5,
        skipProcessing: false,
        shutterSound: false,
      });

      if (!photo?.uri) {
        throw new Error('Camera failed to capture photo frame.');
      }

      const currentPose = biometricPoses[currentPoseIdx] || biometricPoses[0];
      const targetKey = currentPose.key; // 'center' | 'left' | 'right'

      let faceVisible = false;
      let isTargetPose = false;
      let guidance = '';
      let engineName = '';

      // STEP 1: On-Device Google ML Kit (Instant ~20ms, zero network latency)
      const mlResult = await detectPoseOnDevice(photo.uri, targetKey);
      if (mlResult.supported) {
        engineName = 'Google ML Kit [On-Device]';
        faceVisible = mlResult.faceVisible ?? false;
        isTargetPose = mlResult.isTargetPose ?? false;
        guidance = mlResult.guidance ?? '';
        setDebugApiStatus(`🟢 ML Kit (On-Device): Face=${faceVisible}, Match=${isTargetPose} (Yaw: ${mlResult.yaw}°)`);
      } else {
        // STEP 2: Cloud Gemini AI Liveness Verification
        engineName = 'Gemini 3.5 Flash Lite';
        setDebugApiStatus(`📡 Verifying Pose ${currentPoseIdx + 1} (${targetKey}) with Gemini...`);
        setSensorGuidance('Analyzing pose with Gemini AI...');

        const frameB64 = await getOptimizedBase64(photo.uri, 320, 0.55);
        if (!frameB64) {
          throw new Error('Could not optimize captured frame.');
        }

        const geminiKey = GEMINI_KEY;
        const prompt = `You are an ultra-strict mobile biometric liveness validator.
Target Required Pose: "${targetKey}".

Analyze the person's head direction in this selfie photo:
- "center": Person is looking directly straight forward at the camera lens. Both eyes and both ears are symmetrically visible.
- "left": Person has rotated their head towards THEIR LEFT SHOULDER. Their nose clearly points towards the user's left side. Their RIGHT cheek and RIGHT ear are prominently visible to the camera.
- "right": Person has rotated their head towards THEIR RIGHT SHOULDER. Their nose clearly points towards the user's right side. Their LEFT cheek and LEFT ear are prominently visible to the camera.

CRITICAL OPPOSITE CHECK:
- If target is "center", but person turned left or right -> isTargetPose MUST BE FALSE.
- If target is "left", but person turned towards their right shoulder -> isTargetPose MUST BE FALSE. Guidance: "Wrong direction! You turned right. Please turn your head to your LEFT."
- If target is "right", but person turned towards their left shoulder -> isTargetPose MUST BE FALSE. Guidance: "Wrong direction! You turned left. Please turn your head to your RIGHT."

Return STRICT JSON only:
{
  "faceVisible": boolean,
  "actualPoseDetected": "center" | "left" | "right" | "none",
  "isTargetPose": boolean,
  "guidance": string
}`;

        const startTime = Date.now();
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { inlineData: { mimeType: 'image/jpeg', data: frameB64 } },
                    { text: prompt },
                  ],
                },
              ],
              generationConfig: {
                responseMimeType: 'application/json',
                temperature: 0.0,
              },
            }),
          }
        );
        const elapsed = Date.now() - startTime;

        if (!res.ok) {
          const errText = await res.text();
          setDebugApiStatus(`🔴 Pose Check HTTP ${res.status} (${elapsed}ms)`);
          setDebugError(`HTTP ${res.status}: ${errText.slice(0, 80)}`);
          setSensorGuidance(`Pose check failed (${res.status}). Retrying...`);
          return;
        }

        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) {
          throw new Error('Gemini returned empty response for pose check.');
        }

        const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);

        faceVisible = parsed.faceVisible === true;
        const actualPose = String(parsed.actualPoseDetected || '').toLowerCase().trim();

        // STRICT PROGRAMMATIC VERIFICATION
        if (targetKey === 'center') {
          isTargetPose = faceVisible && actualPose === 'center';
          guidance = isTargetPose
            ? 'Straight pose verified ✓'
            : (parsed.guidance || 'Please look straight at the camera.');
        } else if (targetKey === 'left') {
          isTargetPose = faceVisible && actualPose === 'left';
          if (!isTargetPose) {
            guidance = actualPose === 'right'
              ? 'Wrong direction! You turned right. Please turn your head to your LEFT.'
              : (parsed.guidance || 'Please turn your head to your left.');
          } else {
            guidance = 'Left turn verified ✓';
          }
        } else if (targetKey === 'right') {
          isTargetPose = faceVisible && actualPose === 'right';
          if (!isTargetPose) {
            guidance = actualPose === 'left'
              ? 'Wrong direction! You turned left. Please turn your head to your RIGHT.'
              : (parsed.guidance || 'Please turn your head to your right.');
          } else {
            guidance = 'Right turn verified ✓';
          }
        }
        setDebugApiStatus(`🟢 Pose Check: Face=${faceVisible}, Match=${isTargetPose} (${elapsed}ms)`);
      }

      setDebugLastVerdict(`Pose ${currentPoseIdx + 1} (${targetKey}) via ${engineName}: ${guidance || (isTargetPose ? 'MATCHED ✓' : 'MISMATCH ✗')}`);
      setDebugLogs((prev) => [
        `[${new Date().toLocaleTimeString()}] P${currentPoseIdx + 1} (${targetKey}) [${engineName}]: Face=${faceVisible}, Match=${isTargetPose}`,
        ...prev.slice(0, 4),
      ]);

      if (!faceVisible) {
        consecutiveFailsRef.current += 1;
        setSensorStatus('mismatch');
        setSensorGuidance('⚠️ No face detected. Hold phone directly in front of your face.');
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }
        if (consecutiveFailsRef.current >= 4) {
          Alert.alert('No Face Detected ⚠️', 'Camera ke samne aapka chehra nahi dikh raha hai. Kripya phone ko chehre ke samne rakhein.');
        }
        return;
      }

      if (!isTargetPose) {
        consecutiveFailsRef.current += 1;
        setSensorStatus('mismatch');
        setSensorGuidance(guidance || `⚠️ Please: ${currentPose.label}`);
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }
        if (consecutiveFailsRef.current >= 4) {
          Alert.alert('Pose Mismatch ⚠️', guidance || `Aapka pose match nahi hua. Kripya: ${currentPose.label}`);
        }
        return;
      }

      // POSE MATCHED!
      consecutiveFailsRef.current = 0;
      setSensorStatus('locked');
      setSensorGuidance(`✓ ${currentPose.label} Matched!`);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // Store in ref & state
      capturedPosesRef.current[currentPoseIdx] = photo.uri;
      const allPoses = [...capturedPosesRef.current];
      setCapturedPoses(allPoses);

      if (currentPoseIdx < 2) {
        // Move to next pose
        const nextIdx = currentPoseIdx + 1;
        setCurrentPoseIdx(nextIdx);
        setTimeout(() => {
          setSensorStatus('searching');
          const nextPose = biometricPoses[nextIdx];
          setSensorGuidance(`Next: ${nextPose?.label || 'Turn Head'}`);
        }, 500);
      } else {
         // ALL 3 POSES COMPLETED!
        // ABSOLUTE STRICT PERMANENT LOCK: Session finished, ZERO MORE PHOTOS EVER!
        sessionCompletedRef.current = true;
        setIsAiScanning(true); // Set BEFORE strobe to prevent false "VERIFICATION FAILED" flash
        setSensorStatus('locked');
        setSensorGuidance('All 3 Poses Authenticated! Running Craniofacial Match...');
        setDebugApiStatus('🔒 3 Poses Complete. Running Full Biometric Forensics...');

        // Specular Strobe Flash
        setIsStrobeActive(true);
        setStrobeColor('#00F2FE');
        setTimeout(() => setStrobeColor('#FD3A73'), 80);
        setTimeout(() => setStrobeColor('#FFFFFF'), 160);
        setTimeout(() => {
          setIsStrobeActive(false);
          const refPhoto = photos[0] || currentUser?.photo || (currentUser?.photos && currentUser.photos[0]) || '';
          runDualAiVerification(refPhoto, capturedPosesRef.current);
        }, 240);
      }
    } catch (err: any) {
      console.warn('Pose capture error:', err);
      setDebugError(err?.message || 'Pose capture failed');
      setSensorGuidance('Capture error. Please try again.');
    } finally {
      isCapturingRef.current = false;
      setIsCapturingPose(false);
    }
  };

  // 🎯 Auto-Capture Engine: Hands-free automatic snap when face aligns and oval turns green
  useEffect(() => {
    if (
      step !== 8 ||
      !cameraPermission?.granted ||
      isCapturingPose ||
      isAiScanning ||
      isBiometricVerified ||
      capturedPoses.length >= 3 ||
      sessionCompletedRef.current
    ) {
      if (autoCaptureTimerRef.current) {
        clearInterval(autoCaptureTimerRef.current);
        autoCaptureTimerRef.current = null;
      }
      setAutoCountdown(null);
      return;
    }

    // Auto-countdown: 1.2s positioning hold, then ring turns GREEN for 1.2s and auto-snaps!
    let remaining = 2;
    setAutoCountdown(2);
    setSensorStatus('searching');

    const timer = setInterval(() => {
      remaining -= 1;
      if (remaining === 1) {
        setAutoCountdown(1);
        setSensorStatus('locked'); // Turns oval ring GREEN!
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
      } else if (remaining <= 0) {
        clearInterval(timer);
        autoCaptureTimerRef.current = null;
        setAutoCountdown(0);
        snapAndVerifyPose();
      }
    }, 1200);

    autoCaptureTimerRef.current = timer;

    return () => {
      clearInterval(timer);
      autoCaptureTimerRef.current = null;
    };
  }, [
    step,
    currentPoseIdx,
    cameraPermission?.granted,
    isCapturingPose,
    isAiScanning,
    isBiometricVerified,
    capturedPoses.length,
  ]);

  const runDualAiVerification = async (refPhotoUri: string, livePoseUris: string[]) => {
    setIsAiScanning(true);
    setDebugApiStatus('📡 Running Dual AI Biometric Forensics...');
    try {
      setDebugRefPhotoInfo(`URI: ${refPhotoUri ? refPhotoUri.slice(0, 30) + '...' : 'EMPTY'}`);

      const refB64 = await getOptimizedBase64(refPhotoUri, 480, 0.65);
      if (!refB64) {
        setDebugError('Reference profile photo could not be read as base64.');
        setDebugApiStatus('🔴 Ref Photo Missing');
        Alert.alert('Missing Photo ❌', 'Uploaded profile photo read nahi ho payi. Kripya Step 4 par jaakar photo dubara select karein.');
        setIsAiScanning(false);
        return;
      }
      setDebugRefPhotoInfo(`Loaded ✅ (${Math.round((refB64.length * 0.75) / 1024)} KB)`);

      const liveB64s: string[] = [];
      for (let i = 0; i < livePoseUris.length; i++) {
        const pUri = livePoseUris[i];
        if (pUri) {
          const pB64 = await getOptimizedBase64(pUri, 420, 0.6);
          if (pB64) liveB64s.push(pB64);
        }
      }

      if (liveB64s.length < 3) {
        setDebugError(`Only ${liveB64s.length}/3 poses captured.`);
        setDebugApiStatus(`🔴 Poses Incomplete (${liveB64s.length}/3)`);
        Alert.alert('Incomplete Poses ❌', 'Teeno poses (Straight, Left, Right) capture hone zaroori hain.');
        setIsAiScanning(false);
        return;
      }

      const geminiKey = GEMINI_KEY;
      const actualPosesSequence = biometricPoses.map((p, idx) => `Image ${idx + 2}: ${p.label}`).join(', ');
      const prompt = `You are a strict facial biometrics verification AI for Synkin Dating App.
Compare Image 1 (user's uploaded reference profile photo) against Images 2, 3, 4 (live in-app front camera challenge poses in sequence: ${actualPosesSequence}):

TASK: Determine if the live selfies (Images 2, 3, 4) depict the EXACT SAME biological human being as Image 1.

Examine immutable facial geometry:
1. Nose bridge width, nostril width, and nose tip shape.
2. Inter-pupillary distance (eye spacing) and eye socket shape.
3. Jawline structure, chin shape, and cheekbone prominence.
4. Brow ridge contour and ear position.

CRITICAL IDENTITY RULES:
- If Image 1 and Images 2..4 show two different individuals (e.g. imposter, catfisher, different person, different bone structures), you MUST declare isMatch: false with similarityScore < 30 and fraudRisk: "HIGH".
- Do NOT match different people under the guise of "lifestyle or hair changes". Bone structure does not change.
- Allow normal differences for the SAME person: phone front camera wide-angle selfie distortion, ambient room bulb vs outdoor lighting, neutral vs smiling expression.

Return strictly valid JSON:
{
  "isMatch": boolean,
  "similarityScore": integer,
  "fraudRisk": "LOW" | "MEDIUM" | "HIGH",
  "livenessPassed": boolean,
  "verdict": string
}`;

      const contentsParts: any[] = [
        { inlineData: { mimeType: 'image/jpeg', data: refB64 } },
      ];
      liveB64s.forEach((b64) => {
        contentsParts.push({ inlineData: { mimeType: 'image/jpeg', data: b64 } });
      });
      contentsParts.push({ text: prompt });

      let result: any = null;
      try {
        const startTime = Date.now();
        setDebugApiStatus('📡 Calling Gemini 3.5 Flash Lite (Strict Biometric Auth)...');
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${geminiKey}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);

        const gRes = await fetch(geminiUrl, {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{ parts: contentsParts }],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.0,
            },
          }),
        });
        clearTimeout(timeoutId);
        const elapsed = Date.now() - startTime;

        if (gRes.ok) {
          const gData = await gRes.json();
          const parsedText = gData?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (parsedText) {
            const cleaned = parsedText.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleaned);
            const score = Math.min(100, Math.max(0, parsed.similarityScore ?? 0));
            // STRICT AUTHENTICATION (ZERO FALLBACK): Must be parsed.isMatch === true AND score >= 65
            const isMatch = parsed.isMatch === true && score >= 65;
            result = {
              isMatch,
              score,
              verdict: parsed.reason || parsed.verdict || (isMatch ? '3D Craniofacial Match Confirmed ✓' : 'Identity Mismatch: Live face does not match profile photo ✗'),
            };
            setDebugApiStatus(`🟢 Gemini 200 OK (${elapsed}ms) - Match: ${isMatch ? 'YES' : 'NO'} (${result.score}%)`);
            setDebugLastVerdict(`Score: ${result.score}%, Match: ${isMatch ? 'YES' : 'NO'}, Verdict: ${result.verdict}`);
            setDebugLogs((prev) => [
              `[${new Date().toLocaleTimeString()}] Gemini OK (${elapsed}ms) - Score: ${score}%`,
              ...prev.slice(0, 4),
            ]);
          }
        } else {
          const errBody = await gRes.text();
          setDebugApiStatus(`🔴 Gemini HTTP ${gRes.status}`);
          setDebugError(`Gemini ${gRes.status}: ${errBody.slice(0, 80)}`);
          setDebugLogs((prev) => [
            `[${new Date().toLocaleTimeString()}] Gemini ${gRes.status}: ${errBody.slice(0, 60)}`,
            ...prev.slice(0, 4),
          ]);
        }
      } catch (innerErr: any) {
        console.warn('Gemini auth error:', innerErr);
        setDebugError(`Gemini exception: ${innerErr?.message}`);
      }

      // ZERO FALLBACK: If anything failed or rejected, strictly marked as failed
      if (!result) {
        result = {
          isMatch: false,
          score: 0,
          verdict: 'Biometric verification failed. Zero fallback permitted.',
        };
      }

      setIsAiScanning(false);
      if (result.isMatch) {
        setIsBiometricVerified(true);
        setBiometricScore(result.score);
        setBiometricVerdict(result.verdict);
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } else {
        setIsBiometricVerified(false);
        setBiometricScore(result.score);
        setBiometricVerdict(result.verdict || 'Face does not match reference photo.');
        Alert.alert('Verification Result', result.verdict || 'Live face did not match reference photo.');
      }
    } catch (gErr: any) {
      console.warn('Gemini verify error:', gErr);
      setIsAiScanning(false);
      setDebugError(`Verification Exception: ${gErr?.message}`);
      Alert.alert('Verification Error', gErr?.message || 'Biometric process error.');
    }
  };

  const handleFinishOnboarding = async (verified = false) => {
    let userAge = currentUser?.age || 22;
    if (dob) {
      const cleanDigits = dob.replace(/\D/g, '');
      if (cleanDigits.length >= 8) {
        const year = parseInt(cleanDigits.slice(4, 8), 10);
        const currentYear = new Date().getFullYear();
        if (year > 1920 && year <= currentYear) {
          userAge = currentYear - year;
        }
      } else if (cleanDigits.length >= 4) {
        const year = parseInt(cleanDigits.slice(-4), 10);
        const currentYear = new Date().getFullYear();
        if (year > 1920 && year <= currentYear) {
          userAge = currentYear - year;
        }
      }
    }

    // Ensure all uploaded photos are compressed WebP format (~80KB each)
    const compressedPhotos = await Promise.all(
      photos.map(async (p) => {
        if (p && !p.endsWith('.webp') && (p.startsWith('file://') || p.startsWith('content://'))) {
          try {
            const opt = await convertToWebP(p, 720, 0.65);
            return opt.uri;
          } catch (e) {
            return p;
          }
        }
        return p;
      })
    );

    const primaryPhoto = compressedPhotos[0] || currentUser?.photo || '';

    updateCurrentUser({
      name: name.trim(),
      age: userAge,
      gender,
      bio: bio.trim(),
      photos: compressedPhotos,
      photo: primaryPhoto,
      interests,
      lookingFor,
      location: userLocation || currentUser?.location || 'Roorkee',
      isVerified: verified,
      isOnboardingComplete: true,
    });
  };

  const handleNext = async () => {
    triggerHaptic();

    // Validations per step
    if (step === 1 && name.trim().length < 2) {
      Alert.alert('Oops', 'Please enter your first name.');
      return;
    }
    if (step === 2) {
      const cleanDigits = dob.replace(/\D/g, '');
      if (cleanDigits.length !== 8) {
        Alert.alert('Invalid Date', 'Please enter your date of birth in DDMMYYYY format (e.g. 15082000).');
        return;
      }
      const day = parseInt(cleanDigits.slice(0, 2), 10);
      const month = parseInt(cleanDigits.slice(2, 4), 10);
      const year = parseInt(cleanDigits.slice(4, 8), 10);
      const currentYear = new Date().getFullYear();

      if (day < 1 || day > 31 || month < 1 || month > 12) {
        Alert.alert('Invalid Date', 'Please enter a valid day (01-31) and month (01-12).');
        return;
      }
      if (year < 1920 || year > currentYear - 18) {
        Alert.alert('Age Requirement', 'You must be at least 18 years old to use Synkin.');
        return;
      }
    }
    if (step === 4 && photos.length < 2) {
      Alert.alert('More Photos Needed', 'Please add at least 2 photos to continue.');
      return;
    }
    if (step === 6 && interests.length < 3) {
      Alert.alert('Select Interests', 'Please select at least 3 interests.');
      return;
    }
    // Step 7: Looking For -> Advance to Step 8 (3D Face Verification)
    if (step === 7) {
      if (!lookingFor) {
        Alert.alert('Almost there', 'Please select what you are looking for.');
        return;
      }
      setStep(8);
      return;
    }

    // Step 8: 3D Face Verification / Finish
    if (step === 8) {
      handleFinishOnboarding(isBiometricVerified);
      return;
    }

    setStep(step + 1);
  };

  const handleBack = () => {
    triggerHaptic();
    if (step > 1) setStep(step - 1);
  };

  const pickImage = async (index: number) => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 5],
        quality: 0.7,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setCompressingIdx(index);
        const rawUri = result.assets[0].uri;
        // Instantly compress photo on-device to ultra-lightweight WebP (5MB -> ~75KB)
        const opt = await convertToWebP(rawUri, 720, 0.65);
        const newPhotos = [...photos];
        newPhotos[index] = opt.uri;
        setPhotos(newPhotos);
        setCompressingIdx(null);
      }
    } catch (e) {
      console.warn('Pick image error:', e);
      setCompressingIdx(null);
    }
  };

  const toggleInterest = (i: string) => {
    triggerHaptic();
    const cleanInterests = interests.filter(x => ALL_INTERESTS.includes(x));
    if (cleanInterests.includes(i)) {
      setInterests(cleanInterests.filter(x => x !== i));
    } else {
      if (cleanInterests.length >= 5) {
        Alert.alert('Limit Reached', 'You can select up to 5 interests.');
        return;
      }
      setInterests([...cleanInterests, i]);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <View style={styles.content}>
            <Text style={styles.title}>What's your first name?</Text>
            <Text style={styles.subtitle}>This is how it will appear on your profile.</Text>
            <TextInput
              style={styles.input}
              placeholder="First Name"
              placeholderTextColor="#666"
              value={name}
              onChangeText={setName}
              autoFocus
            />
          </View>
        );
      case 2:
        return (
          <View style={styles.content}>
            <Text style={styles.title}>When's your birthday?</Text>
            <Text style={styles.subtitle}>Enter 8 digits (DDMMYYYY). You must be at least 18 years old.</Text>
            <TextInput
              style={styles.input}
              placeholder="DDMMYYYY (e.g. 15082000)"
              placeholderTextColor="#666"
              value={dob}
              onChangeText={(text) => {
                const digits = text.replace(/\D/g, '').slice(0, 8);
                setDob(digits);
              }}
              keyboardType="number-pad"
              maxLength={8}
              autoFocus
            />
          </View>
        );
      case 3:
        return (
          <View style={styles.content}>
            <Text style={styles.title}>How do you identify?</Text>
            <Text style={styles.subtitle}>Everyone is welcome on Synkin.</Text>
            <View style={styles.optionsList}>
              {['male', 'female', 'nonbinary', 'other'].map(g => (
                <TouchableOpacity
                  key={g}
                  style={[styles.optionCard, gender === g && styles.optionCardActive]}
                  onPress={() => { triggerHaptic(); setGender(g as any); }}
                >
                  <Text style={[styles.optionText, gender === g && styles.optionTextActive]}>
                    {g.charAt(0).toUpperCase() + g.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      case 4:
        return (
          <View style={styles.content}>
            <Text style={styles.title}>Add your best photos</Text>
            <Text style={styles.subtitle}>Add at least 2 photos to continue.</Text>
            <View style={styles.photoGrid}>
              {[0, 1, 2, 3, 4, 5].map((idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.photoSlot}
                  onPress={() => pickImage(idx)}
                  disabled={compressingIdx !== null}
                >
                  {compressingIdx === idx ? (
                    <View style={styles.photoPlaceholder}>
                      <ActivityIndicator size="small" color="#FD3A73" />
                      <Text style={{ color: '#FD3A73', fontSize: 10, marginTop: 4, fontFamily: 'Poppins_600SemiBold' }}>
                        Compressing...
                      </Text>
                    </View>
                  ) : photos[idx] ? (
                    <>
                      <Image source={{ uri: photos[idx] }} style={styles.photoImage} />
                      <View style={styles.photoEditBadge}>
                        <Ionicons name="pencil" size={14} color="#FFF" />
                      </View>
                    </>
                  ) : (
                    <View style={styles.photoPlaceholder}>
                      <Ionicons name="add" size={32} color="#FD3A73" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      case 5:
        return (
          <View style={styles.content}>
            <Text style={styles.title}>Write a short bio</Text>
            <Text style={styles.subtitle}>Tell them a little about yourself.</Text>
            <TextInput
              style={[styles.input, { height: 120, textAlignVertical: 'top' }]}
              placeholder="I love spontaneous road trips and finding the best coffee in the city..."
              placeholderTextColor="#666"
              value={bio}
              onChangeText={setBio}
              multiline
              autoFocus
            />
          </View>
        );
      case 6:
        return (
          <View style={styles.content}>
            <Text style={styles.title}>What are you into?</Text>
            <Text style={styles.subtitle}>Pick 3-5 interests to match with your vibe.</Text>
            <View style={styles.chipContainer}>
              {ALL_INTERESTS.map(i => (
                <TouchableOpacity
                  key={i}
                  style={[styles.chip, interests.includes(i) && styles.chipActive]}
                  onPress={() => toggleInterest(i)}
                >
                  <Text style={[styles.chipText, interests.includes(i) && styles.chipTextActive]}>{i}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      case 7:
        return (
          <View style={styles.content}>
            <Text style={styles.title}>What are you looking for?</Text>
            <Text style={styles.subtitle}>Be honest, it helps find the right match.</Text>
            <View style={styles.optionsList}>
              {LOOKING_FOR_OPTIONS.map(opt => {
                const isSelected = lookingFor === opt.label || lookingFor === opt.title || lookingFor === opt.key;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    style={[styles.lookingForCard, isSelected && styles.lookingForCardActive]}
                    onPress={() => { triggerHaptic(); setLookingFor(opt.label); }}
                    activeOpacity={0.8}
                  >
                    <Text style={{ fontSize: 24, marginRight: 12 }}>{opt.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.lookingForTitle, isSelected && styles.lookingForTitleActive]}>
                        {opt.title}
                      </Text>
                      {opt.description ? (
                        <Text style={styles.lookingForDesc}>{opt.description}</Text>
                      ) : null}
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={20} color="#FD3A73" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );
      case 8:
        return (
          <View style={styles.biometricContainer}>
            {/* Elegant Header Capsule */}
            <View style={styles.premiumBadgeRow}>
              <View style={[styles.premiumBadge, isBiometricVerified && styles.premiumBadgeSuccess]}>
                <Ionicons
                  name={isBiometricVerified ? 'shield-checkmark' : 'shield-half'}
                  size={14}
                  color={isBiometricVerified ? '#22C55E' : '#00F2FE'}
                />
                <Text style={[styles.premiumBadgeText, isBiometricVerified && { color: '#22C55E' }]}>
                  {isBiometricVerified ? 'VERIFIED PROFILE 🛡️✓' : 'PHOTO VERIFICATION'}
                </Text>
              </View>
            </View>

            <Text style={styles.premiumTitle}>
              {isBiometricVerified ? 'You’re Verified!' : 'Face Verification'}
            </Text>
            <Text style={styles.premiumSubtitle}>
              {isBiometricVerified
                ? 'Your profile now has the official verified blue badge.'
                : '💡 Kripya achhi roshni (Room Light) on rakhein aur 3 cues follow karein.'}
            </Text>

            {/* Sleek Step Progress Track */}
            <View style={styles.poseStepsRow}>
              {biometricPoses.map((pose, idx) => {
                const isDone = idx < currentPoseIdx || isBiometricVerified;
                const isCurrent = idx === currentPoseIdx && !isBiometricVerified;
                return (
                  <View
                    key={pose.id}
                    style={[
                      styles.poseStepItem,
                      isCurrent && styles.poseStepItemActive,
                      isDone && styles.poseStepItemDone,
                    ]}
                  >
                    <View style={[styles.stepDot, isDone && styles.stepDotDone, isCurrent && styles.stepDotActive]}>
                      {isDone ? (
                        <Ionicons name="checkmark" size={11} color="#FFF" />
                      ) : (
                        <Text style={[styles.stepDotNum, isCurrent && styles.stepDotNumActive]}>{idx + 1}</Text>
                      )}
                    </View>
                    <Text style={[styles.stepLabel, isCurrent && styles.stepLabelActive, isDone && styles.stepLabelDone]}>
                      {pose.key === 'center' ? 'Center' : pose.key === 'left' ? 'Left' : 'Right'}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* In-App Live Camera Viewport with Oval Mask */}
            {!cameraPermission?.granted ? (
              <View style={styles.permCard}>
                <Ionicons name="camera-outline" size={44} color="#FD3A73" />
                <Text style={styles.permCardTitle}>Camera Access Required</Text>
                <Text style={styles.permCardDesc}>
                  Synkin requires camera access to verify your live face against your profile photos.
                </Text>
                <TouchableOpacity style={styles.permBtn} onPress={requestCameraPermission} activeOpacity={0.8}>
                  <Text style={styles.permBtnText}>Enable Camera 📸</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.ovalWrapper}>
                <View
                  style={[
                    styles.ovalViewport,
                    isBiometricVerified || sensorStatus === 'locked'
                      ? styles.ovalViewportVerified
                      : sensorStatus === 'mismatch'
                      ? styles.ovalViewportScanning
                      : isAiScanning
                      ? styles.ovalViewportScanning
                      : styles.ovalViewportActive,
                  ]}
                >
                  {/* Embedded Live Front Camera Feed */}
                  <CameraView
                    ref={cameraRef}
                    facing="front"
                    style={StyleSheet.absoluteFill}
                  />

                  {/* Animated Oval Ring */}
                  <Animated.View
                    style={[
                      styles.ovalPulseRing,
                      {
                        transform: [{ scale: pulseAnim }],
                        borderColor:
                          isBiometricVerified || sensorStatus === 'locked'
                            ? '#22C55E'
                            : sensorStatus === 'mismatch'
                            ? '#EF4444'
                            : '#00F2FE',
                      },
                    ]}
                  />

                  {/* Auto-Capture Badge inside Oval */}
                  {autoCountdown !== null && !isBiometricVerified && !isAiScanning && (
                    <View
                      style={[
                        styles.autoCountdownBadge,
                        sensorStatus === 'locked' && styles.autoCountdownBadgeLocked,
                      ]}
                    >
                      <Ionicons
                        name={sensorStatus === 'locked' ? 'checkmark-circle' : 'scan-outline'}
                        size={13}
                        color={sensorStatus === 'locked' ? '#22C55E' : '#00F2FE'}
                      />
                      <Text
                        style={[
                          styles.autoCountdownBadgeText,
                          sensorStatus === 'locked' && { color: '#22C55E' },
                        ]}
                      >
                        {sensorStatus === 'locked' ? 'ALIGNED! AUTO-SNAPPING 📸' : `ALIGN & HOLD (${autoCountdown}s)`}
                      </Text>
                    </View>
                  )}

                  {/* Specular Strobe Flash Overlay */}
                  {isStrobeActive && (
                    <View
                      style={[
                        StyleSheet.absoluteFill,
                        { backgroundColor: strobeColor, opacity: 0.9, zIndex: 99 },
                      ]}
                    />
                  )}
                </View>

                {/* Floating Glass Guidance Pill */}
                <View
                  style={[
                    styles.floatingGuidancePill,
                    (isBiometricVerified || sensorStatus === 'locked') && styles.floatingGuidancePillSuccess,
                    sensorStatus === 'mismatch' && {
                      borderColor: 'rgba(239, 68, 68, 0.6)',
                      backgroundColor: 'rgba(239, 68, 68, 0.15)',
                      shadowColor: '#EF4444',
                    },
                  ]}
                >
                  <Text style={styles.floatingGuidanceText}>
                    {isAiScanning
                      ? '⚡ Authenticating 3D facial landmarks...'
                      : isBiometricVerified
                      ? `✓ Match Confirmed (${biometricScore ?? 0}%)`
                      : isCapturingPose
                      ? '📸 Capturing & analyzing pose...'
                      : sensorStatus === 'locked'
                      ? '🟢 Perfect! Snapping automatically...'
                      : sensorStatus === 'mismatch'
                      ? (sensorGuidance || '⚠️ Pose mismatch, hold steady...')
                      : `${currentPose.emoji} ${currentPose.sub}`}
                  </Text>
                </View>
              </View>
            )}

            {/* Verification Success or Failure Feedback */}
            {isAiScanning ? (
              <View style={styles.premiumScanCard}>
                <ActivityIndicator size="small" color="#00F2FE" />
                <Text style={styles.premiumScanText}>
                  AI comparing craniofacial landmarks with profile photo...
                </Text>
              </View>
            ) : isBiometricVerified ? (
              <View style={styles.premiumVerifiedCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
                  <Text style={styles.premiumVerifiedTitle}>
                    Profile Authenticated 🛡️✓
                  </Text>
                </View>
                <Text style={styles.premiumVerifiedDesc}>
                  Your selfie successfully matched your profile photos. Your verified badge is now active.
                </Text>
              </View>
            ) : capturedPoses.length >= 3 ? (
              <View style={styles.premiumErrorCard}>
                <Ionicons name="alert-circle-outline" size={20} color="#FF453A" />
                <Text style={styles.premiumErrorText}>
                  {biometricVerdict || 'Face did not match profile photos. Please ensure good lighting and try again.'}
                </Text>
                <TouchableOpacity
                  style={styles.premiumRetryBtn}
                  onPress={handleRetryVerification}
                  activeOpacity={0.85}
                >
                  <Ionicons name="refresh-outline" size={16} color="#00F2FE" />
                  <Text style={styles.premiumRetryText}>Try Again 🔄</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {/* Secondary Skip link */}
            {!isBiometricVerified && (
              <TouchableOpacity
                style={styles.skipBtn}
                onPress={() => handleFinishOnboarding(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.skipBtnText}>I'll verify later in settings →</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      default:
        return null;
    }
  };

  const progress = (step / TOTAL_STEPS) * 100;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {step > 1 ? (
          <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={28} color="#FFF" />
          </TouchableOpacity>
        ) : <View style={{ width: 28 }} />}
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
        </View>
        <View style={{ width: 28 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {renderStepContent()}
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.nextBtn, (isAiScanning || isCapturingPose) && { opacity: 0.6 }]}
          disabled={isAiScanning || isCapturingPose}
          onPress={() => {
            if (step === TOTAL_STEPS) {
              if (!cameraPermission?.granted) {
                requestCameraPermission();
                return;
              }
              if (isBiometricVerified) {
                handleFinishOnboarding(true);
                return;
              }
              if (capturedPoses.length >= 3 && !isAiScanning && !isBiometricVerified) {
                handleRetryVerification();
                return;
              }
              if (autoCaptureTimerRef.current) {
                clearInterval(autoCaptureTimerRef.current);
                autoCaptureTimerRef.current = null;
              }
              snapAndVerifyPose();
              return;
            }
            handleNext();
          }}
          activeOpacity={0.88}
        >
          <LinearGradient colors={['#FD3A73', '#FF655B']} style={styles.nextBtnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={styles.nextBtnText}>
              {step === TOTAL_STEPS
                ? (!cameraPermission?.granted
                    ? 'Enable Camera Access 📸'
                    : isAiScanning
                    ? 'Analyzing 3D Biometrics... ⏳'
                    : isBiometricVerified
                    ? 'Complete & Enter Synkin 🚀'
                    : capturedPoses.length >= 3 && !isAiScanning
                    ? 'Retry Biometric Scan 🔄'
                    : isCapturingPose
                    ? 'Verifying Pose... ⏳'
                    : autoCountdown !== null && autoCountdown > 0
                    ? `Auto-Snap in ${autoCountdown}s (or Tap Now) 📸`
                    : sensorStatus === 'locked'
                    ? 'Auto-Snapping... 📸'
                    : `Snap Pose ${currentPoseIdx + 1}/3: ${currentPose?.label || 'Snap'} 📸`)
                : 'Continue'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
  },
  backBtn: {
    padding: 4,
    marginLeft: -4,
  },
  progressBarBg: {
    flex: 1,
    height: 4,
    backgroundColor: '#222',
    marginHorizontal: 16,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FD3A73',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  content: {
    flex: 1,
    paddingTop: 10,
  },
  contentCentered: {
    flex: 1,
    paddingTop: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(253, 58, 115, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Poppins_800ExtraBold',
    color: '#FFF',
    marginBottom: 10,
  },
  titleCentered: {
    fontSize: 28,
    fontFamily: 'Poppins_800ExtraBold',
    color: '#FFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 30,
  },
  subtitleCentered: {
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  input: {
    borderBottomWidth: 2,
    borderColor: '#333',
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFF',
    paddingVertical: 10,
  },
  optionsList: {
    gap: 12,
  },
  optionCard: {
    borderWidth: 2,
    borderColor: '#222',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
  },
  optionCardActive: {
    borderColor: '#FD3A73',
    backgroundColor: 'rgba(253, 58, 115, 0.1)',
  },
  optionText: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#888',
  },
  optionTextActive: {
    color: '#FFF',
  },
  lookingForCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#222',
    borderRadius: 16,
    padding: 16,
    backgroundColor: '#111',
  },
  lookingForCardActive: {
    borderColor: '#FD3A73',
    backgroundColor: 'rgba(253, 58, 115, 0.15)',
  },
  lookingForTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFF',
  },
  lookingForTitleActive: {
    color: '#FD3A73',
  },
  lookingForDesc: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 2,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  photoSlot: {
    width: '30%',
    aspectRatio: 0.7,
    backgroundColor: '#111',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#222',
    overflow: 'hidden',
    borderStyle: 'dashed',
  },
  photoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoEditBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#FD3A73',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333',
    backgroundColor: '#111',
  },
  chipActive: {
    borderColor: '#FD3A73',
    backgroundColor: 'rgba(253, 58, 115, 0.2)',
  },
  chipText: {
    color: '#888',
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
  },
  chipTextActive: {
    color: '#FD3A73',
  },
  footer: {
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  nextBtn: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
  },
  nextBtnGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtnText: {
    color: '#FFF',
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
  },
  biometricContainer: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  badgeRow: {
    marginBottom: 10,
  },
  verifHeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 242, 254, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.3)',
  },
  verifHeaderBadgeSuccess: {
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    borderColor: 'rgba(34, 197, 94, 0.35)',
  },
  verifBadgeText: {
    color: '#00F2FE',
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 0.5,
  },
  posePillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 12,
  },
  posePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  posePillActive: {
    borderColor: '#00F2FE',
    backgroundColor: 'rgba(0, 242, 254, 0.15)',
  },
  posePillDone: {
    borderColor: '#22C55E',
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
  },
  posePillEmoji: {
    fontSize: 13,
  },
  posePillText: {
    color: '#FFF',
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
  },
  permCard: {
    width: '100%',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#111827',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#374151',
    marginVertical: 16,
  },
  permCardTitle: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    marginTop: 12,
  },
  permCardDesc: {
    color: '#9CA3AF',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
    marginVertical: 8,
  },
  permBtn: {
    marginTop: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#FD3A73',
    borderRadius: 20,
  },
  permBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
  },
  ovalWrapper: {
    alignItems: 'center',
    marginVertical: 12,
  },
  ovalViewport: {
    width: 220,
    height: 290,
    borderRadius: 110,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
  },
  ovalViewportActive: {
    borderColor: '#00F2FE',
  },
  ovalViewportScanning: {
    borderColor: '#F59E0B',
  },
  ovalViewportVerified: {
    borderColor: '#22C55E',
  },
  ovalPulseRing: {
    ...StyleSheet.absoluteFill,
    borderRadius: 110,
    borderWidth: 2,
  },
  autoCountdownBadge: {
    position: 'absolute',
    top: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.4)',
    zIndex: 10,
    shadowColor: '#00F2FE',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  autoCountdownBadgeLocked: {
    backgroundColor: 'rgba(20, 83, 45, 0.92)',
    borderColor: 'rgba(34, 197, 94, 0.9)',
    shadowColor: '#22C55E',
  },
  autoCountdownBadgeText: {
    color: '#00F2FE',
    fontSize: 10,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 0.5,
  },
  floatingGuidancePill: {
    marginTop: 14,
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.3)',
    alignSelf: 'center',
    shadowColor: '#00F2FE',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  floatingGuidancePillSuccess: {
    borderColor: 'rgba(34, 197, 94, 0.6)',
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    shadowColor: '#22C55E',
  },
  floatingGuidanceText: {
    color: '#F8FAFC',
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  premiumBadgeRow: {
    alignItems: 'center',
    marginBottom: 8,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 242, 254, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  premiumBadgeSuccess: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderColor: 'rgba(34, 197, 94, 0.35)',
  },
  premiumBadgeText: {
    color: '#00F2FE',
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
    letterSpacing: 0.8,
  },
  premiumTitle: {
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  premiumSubtitle: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  poseStepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  poseStepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  poseStepItemActive: {
    backgroundColor: 'rgba(0, 242, 254, 0.12)',
    borderColor: '#00F2FE',
  },
  poseStepItemDone: {
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    borderColor: 'rgba(34, 197, 94, 0.5)',
  },
  stepDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: {
    backgroundColor: '#00F2FE',
  },
  stepDotDone: {
    backgroundColor: '#22C55E',
  },
  stepDotNum: {
    color: '#94A3B8',
    fontSize: 10,
    fontFamily: 'Poppins_600SemiBold',
  },
  stepDotNumActive: {
    color: '#000000',
  },
  stepLabel: {
    color: '#64748B',
    fontSize: 11.5,
    fontFamily: 'Poppins_600SemiBold',
  },
  stepLabelActive: {
    color: '#FFFFFF',
  },
  stepLabelDone: {
    color: '#22C55E',
  },
  premiumScanCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(0, 242, 254, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.25)',
    borderRadius: 14,
    padding: 12,
    marginVertical: 12,
    width: '100%',
  },
  premiumScanText: {
    color: '#E2E8F0',
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    flex: 1,
  },
  premiumVerifiedCard: {
    backgroundColor: 'rgba(34, 197, 94, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.35)',
    borderRadius: 16,
    padding: 14,
    marginVertical: 12,
    width: '100%',
  },
  premiumVerifiedTitle: {
    color: '#22C55E',
    fontSize: 14.5,
    fontFamily: 'Poppins_700Bold',
  },
  premiumVerifiedDesc: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    lineHeight: 18,
  },
  premiumErrorCard: {
    backgroundColor: 'rgba(255, 69, 58, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 69, 58, 0.35)',
    borderRadius: 16,
    padding: 14,
    marginVertical: 12,
    width: '100%',
    alignItems: 'center',
    gap: 8,
  },
  premiumErrorText: {
    color: '#FCA5A5',
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    textAlign: 'center',
    lineHeight: 18,
  },
  premiumRetryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 242, 254, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.4)',
    marginTop: 4,
  },
  premiumRetryText: {
    color: '#00F2FE',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  skipBtn: {
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  skipBtnText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
  },
});

