import { Platform } from 'react-native';

// Professional Ringtone Engine for SYNKING
// Safely checks for Native expo-av or falls back seamlessly to Web Audio API

let ExpoAudio: any = null;
try {
  const av = require('expo-av');
  if (av && av.Audio) {
    ExpoAudio = av.Audio;
  }
} catch (e) {
  // Graceful fallback if native module is not in older binary
}

const INCOMING_RINGTONE_URL = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';
const OUTGOING_RINGTONE_URL = 'https://assets.mixkit.co/active_storage/sfx/1360/1360-preview.mp3';

class RingtoneServiceClass {
  private audioCtx: any = null;
  private ringInterval: any = null;
  private isPlaying: boolean = false;
  private currentMode: 'incoming' | 'outgoing' | null = null;
  private soundInstance: any = null;

  private async configureAudioMode() {
    try {
      if (Platform.OS !== 'web' && ExpoAudio && typeof ExpoAudio.setAudioModeAsync === 'function') {
        await ExpoAudio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      }
    } catch (e) {}
  }

  private getAudioContext(): any {
    if (typeof window === 'undefined') return null;
    try {
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        if (!this.audioCtx || this.audioCtx.state === 'closed') {
          this.audioCtx = new AudioContextClass();
        }
        if (this.audioCtx.state === 'suspended') {
          this.audioCtx.resume().catch(() => {});
        }
        return this.audioCtx;
      }
    } catch (e) {
      console.warn('[RINGTONE_CTX_WARN]', e);
    }
    return null;
  }

  // 1. OUTGOING CALL: Modern Dial Tone ("Tring... Tring...")
  public async playOutgoingRing() {
    if (this.isPlaying && this.currentMode === 'outgoing') return;
    this.stop();
    this.isPlaying = true;
    this.currentMode = 'outgoing';

    if (Platform.OS !== 'web' && ExpoAudio && ExpoAudio.Sound) {
      try {
        await this.configureAudioMode();
        const { sound } = await ExpoAudio.Sound.createAsync(
          { uri: OUTGOING_RINGTONE_URL },
          { shouldPlay: true, isLooping: true, volume: 0.8 }
        );
        this.soundInstance = sound;
        return;
      } catch (e) {
        console.warn('[NATIVE_OUTGOING_RING_ERROR]', e);
      }
    }

    // Web Audio Fallback
    const playPulse = () => {
      if (!this.isPlaying || this.currentMode !== 'outgoing') return;
      const ctx = this.getAudioContext();
      if (!ctx) return;

      try {
        const now = ctx.currentTime;
        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.12, now + 0.05);
        gainNode.gain.setValueAtTime(0.12, now + 0.9);
        gainNode.gain.linearRampToValueAtTime(0.001, now + 1.1);
        gainNode.connect(ctx.destination);

        const osc1 = ctx.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(425, now);
        osc1.connect(gainNode);

        const osc2 = ctx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(450, now);
        osc2.connect(gainNode);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 1.1);
        osc2.stop(now + 1.1);
      } catch (e) {}
    };

    playPulse();
    this.ringInterval = setInterval(playPulse, 3200);
  }

  // 2. INCOMING CALL: Melodic Marimba Ringtone
  public async playIncomingRing() {
    if (this.isPlaying && this.currentMode === 'incoming') return;
    this.stop();
    this.isPlaying = true;
    this.currentMode = 'incoming';

    if (Platform.OS !== 'web' && ExpoAudio && ExpoAudio.Sound) {
      try {
        await this.configureAudioMode();
        const { sound } = await ExpoAudio.Sound.createAsync(
          { uri: INCOMING_RINGTONE_URL },
          { shouldPlay: true, isLooping: true, volume: 1.0 }
        );
        this.soundInstance = sound;
        return;
      } catch (e) {
        console.warn('[NATIVE_INCOMING_RING_ERROR]', e);
      }
    }

    // Web Audio Fallback
    const playMelody = () => {
      if (!this.isPlaying || this.currentMode !== 'incoming') return;
      const ctx = this.getAudioContext();
      if (!ctx) return;

      try {
        const now = ctx.currentTime;
        const notes = [
          { freq: 659.25, time: 0.00, dur: 0.22 },
          { freq: 830.61, time: 0.16, dur: 0.22 },
          { freq: 987.77, time: 0.32, dur: 0.22 },
          { freq: 1318.51, time: 0.48, dur: 0.35 },
          { freq: 987.77, time: 0.72, dur: 0.22 },
          { freq: 1318.51, time: 0.88, dur: 0.45 },
        ];

        notes.forEach(({ freq, time, dur }) => {
          const noteStart = now + time;
          const noteEnd = noteStart + dur;
          const gain = ctx.createGain();
          gain.gain.setValueAtTime(0, noteStart);
          gain.gain.linearRampToValueAtTime(0.22, noteStart + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, noteEnd);
          gain.connect(ctx.destination);

          const osc = ctx.createOscillator();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, noteStart);
          osc.connect(gain);

          osc.start(noteStart);
          osc.stop(noteEnd);
        });
      } catch (e) {}
    };

    playMelody();
    this.ringInterval = setInterval(playMelody, 2200);
  }

  // 3. STOP RINGTONE INSTANTLY
  public async stop() {
    this.isPlaying = false;
    this.currentMode = null;
    if (this.ringInterval) {
      clearInterval(this.ringInterval);
      this.ringInterval = null;
    }
    if (this.soundInstance) {
      try {
        const sound = this.soundInstance;
        this.soundInstance = null;
        await sound.stopAsync();
        await sound.unloadAsync();
      } catch (e) {}
    }
  }
}

export const RingtoneService = new RingtoneServiceClass();

