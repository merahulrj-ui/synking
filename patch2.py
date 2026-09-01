import re

with open("src/app/chat/[id].tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Imports
if "expo-av" not in content:
    content = content.replace("import * as Haptics from 'expo-haptics';", "import * as Haptics from 'expo-haptics';\nimport { Audio } from 'expo-av';\nimport * as FileSystem from 'expo-file-system';")

# 2. Refs
ref_regex = r"(const mediaRecorderRef = useRef<any>\(null\);[\s\S]+?const lastSentTimeRef = useRef<number>\(0\);)"
new_refs = """const mediaRecorderRef = useRef<any>(null);
  const mediaStreamRef = useRef<any>(null);
  const audioChunksRef = useRef<any[]>([]);
  const activeAudioRef = useRef<any>(null);
  const audioContextRef = useRef<any>(null);
  const analyserRef = useRef<any>(null);
  const animFrameRef = useRef<any>(null);
  const isSendingRef = useRef<boolean>(false);
  const lastSentTimeRef = useRef<number>(0);
  const nativeRecordingRef = useRef<Audio.Recording | null>(null);
  const nativeSoundRef = useRef<Audio.Sound | null>(null);"""
content = re.sub(ref_regex, new_refs, content)

# 3. KeyboardAvoidingView Fix
content = re.sub(
    r"<KeyboardAvoidingView\s*style=\{\{\s*flex:\s*1\s*\}\}\s*behavior=\{Platform\.OS === 'ios' \? 'padding' : undefined\}\s*>",
    "<KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 80}>",
    content
)

# 4. Replace the 4 audio functions
func_regex = r"(const startRecording = async \(\) => \{[\s\S]+?)(?=\s*// 1\. WebSocket Re-connection)"

new_funcs = """const startRecording = async () => {
    try {
      addAudioLog('??? Requesting microphone access...');
      if (Platform.OS !== 'web') {
        await Audio.requestPermissionsAsync();
        await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
        const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
        nativeRecordingRef.current = recording;
        animFrameRef.current = setInterval(() => setLiveMicLevel(Math.floor(Math.random() * (80 - 20 + 1) + 20)), 150);
        setIsRecording(true);
        setRecordingSeconds(0);
        addAudioLog('??? Native Recording active!');
      } else {
        if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          mediaStreamRef.current = stream;
          audioChunksRef.current = [];
          let mimeType = 'audio/webm';
          if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) mimeType = 'audio/webm;codecs=opus';
          else if (MediaRecorder.isTypeSupported('audio/mp4')) mimeType = 'audio/mp4';
          setSupportedMimes(mimeType);
          const recorder = new MediaRecorder(stream, { mimeType });
          recorder.ondataavailable = (e) => { if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data); };
          recorder.start(250);
          mediaRecorderRef.current = recorder;
          animFrameRef.current = setInterval(() => setLiveMicLevel(Math.floor(Math.random() * (80 - 20 + 1) + 20)), 150);
          setIsRecording(true);
          setRecordingSeconds(0);
        }
      }
    } catch (err: any) {
      addAudioLog(`? Mic permission failed: ${err.message || err}`);
      if (Platform.OS === 'web') window.alert('Microphone Access Required');
      else Alert.alert('Microphone Access Required');
    }
  };

  const cancelRecording = async () => {
    addAudioLog('?? Recording cancelled by user.');
    if (animFrameRef.current) clearInterval(animFrameRef.current);
    if (Platform.OS !== 'web') {
      if (nativeRecordingRef.current) {
        await nativeRecordingRef.current.stopAndUnloadAsync().catch(() => {});
        nativeRecordingRef.current = null;
      }
    } else {
      try {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') mediaRecorderRef.current.stop();
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((t: any) => t.stop());
          mediaStreamRef.current = null;
        }
      } catch (e) {}
    }
    audioChunksRef.current = [];
    setLiveMicLevel(0);
    setIsRecording(false);
    setRecordingSeconds(0);
  };

  const sendVoiceNote = async () => {
    addAudioLog('?? Finishing voice note...');
    if (animFrameRef.current) clearInterval(animFrameRef.current);
    setLiveMicLevel(0);
    const duration = Math.max(1, recordingSeconds);
    const mins = Math.floor(duration / 60);
    const secs = duration % 60;
    const durStr = `${mins}:${secs.toString().padStart(2, '0')}`;
    const textLabel = `?? Voice Note (${durStr})`;
    let audioDataUri = '';

    try {
      if (Platform.OS !== 'web') {
        if (nativeRecordingRef.current) {
          await nativeRecordingRef.current.stopAndUnloadAsync();
          const uri = nativeRecordingRef.current.getURI();
          if (uri) {
            const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
            audioDataUri = `data:audio/m4a;base64,${base64}`;
          }
          nativeRecordingRef.current = null;
        }
      } else {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          await Promise.race([
             new Promise<void>((resolve) => {
               mediaRecorderRef.current.onstop = () => resolve();
               mediaRecorderRef.current.stop();
             }),
             new Promise<void>((resolve) => setTimeout(resolve, 500))
          ]);
        }
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((t: any) => t.stop());
          mediaStreamRef.current = null;
        }
        if (audioChunksRef.current.length > 0) {
          const mime = supportedMimes || 'audio/webm';
          const audioBlob = new Blob(audioChunksRef.current, { type: mime });
          audioDataUri = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = () => resolve('');
            reader.readAsDataURL(audioBlob);
          });
        }
      }
    } catch (e: any) {
      addAudioLog(`? Audio error: ${e.message}`);
    } finally {
      audioChunksRef.current = [];
      setIsRecording(false);
      setRecordingSeconds(0);
    }

    if (id) {
      const fullText = audioDataUri ? `${textLabel}|||AUDIO_DATA::${audioDataUri}` : textLabel;
      sendMessage(id, fullText, 'voice', { audioUrl: audioDataUri, audioDuration: duration });
    }
  };

  const togglePlayVoiceNote = async (messageId: string, audioUrl?: string) => {
    if (playingMessageId === messageId) {
       if (Platform.OS !== 'web') await nativeSoundRef.current?.pauseAsync();
       else activeAudioRef.current?.pause();
       setPlayingMessageId(null);
       return;
    }
    
    if (Platform.OS !== 'web') {
      await nativeSoundRef.current?.stopAsync().catch(()=>{});
      await nativeSoundRef.current?.unloadAsync().catch(()=>{});
      nativeSoundRef.current = null;
    } else {
      activeAudioRef.current?.pause();
      activeAudioRef.current = null;
    }

    if (audioUrl && audioUrl.startsWith('data:audio/')) {
      try {
        if (Platform.OS !== 'web') {
          const { sound } = await Audio.Sound.createAsync({ uri: audioUrl });
          nativeSoundRef.current = sound;
          setPlayingMessageId(messageId);
          await sound.playAsync();
          sound.setOnPlaybackStatusUpdate((status: any) => {
             if (status.didJustFinish) {
               setPlayingMessageId(null);
               sound.unloadAsync();
             }
          });
        } else {
          const audio = new window.Audio(audioUrl);
          activeAudioRef.current = audio;
          setPlayingMessageId(messageId);
          audio.play();
          audio.onended = () => setPlayingMessageId(null);
        }
      } catch (e) {
        setPlayingMessageId(null);
      }
    }
  };"""

content = re.sub(func_regex, new_funcs, content)

with open("src/app/chat/[id].tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Patch applied successfully!")
