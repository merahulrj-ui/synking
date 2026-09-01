import re

with open("src/app/chat/[id].tsx", "r", encoding="utf-8") as f:
    content = f.read()

start_idx = content.find("const startRecording = async () => {")
end_idx = content.find("return (", start_idx)

if start_idx != -1 and end_idx != -1:
    new_code = """const startRecording = async () => {
    try {
      addAudioLog('??? Requesting microphone access...');
      if (Platform.OS !== 'web') {
        // NATIVE MOBILE (expo-av)
        await Audio.requestPermissionsAsync();
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
        const { recording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );
        nativeRecordingRef.current = recording;
        
        // Dummy meter for native
        const meterInterval = setInterval(() => {
           setLiveMicLevel(Math.floor(Math.random() * (80 - 20 + 1) + 20));
        }, 150);
        animFrameRef.current = meterInterval;
        
        setIsRecording(true);
        setRecordingSeconds(0);
        addAudioLog('??? Native Recording active!');
      } else {
        // WEB (MediaRecorder)
        if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          mediaStreamRef.current = stream;
          audioChunksRef.current = [];
          
          let mimeType = 'audio/webm';
          if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) mimeType = 'audio/webm;codecs=opus';
          else if (MediaRecorder.isTypeSupported('audio/mp4')) mimeType = 'audio/mp4';
          
          setSupportedMimes(mimeType);
          const recorder = new MediaRecorder(stream, { mimeType });
          
          recorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
          };
          recorder.start(250);
          mediaRecorderRef.current = recorder;
          
          // Fake meter for web to avoid heavy audio context
          const meterInterval = setInterval(() => {
             setLiveMicLevel(Math.floor(Math.random() * (80 - 20 + 1) + 20));
          }, 150);
          animFrameRef.current = meterInterval;

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
    addAudioLog('?? Finishing voice note recording and encoding...');
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
            // Expo AV usually creates m4a or 3gp on android
            audioDataUri = `data:audio/m4a;base64,${base64}`;
          }
          nativeRecordingRef.current = null;
        }
      } else {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          // Timeout to prevent hanging
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
      addAudioLog(`? Audio encoding error: ${e.message}`);
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
       if (Platform.OS !== 'web') {
         await nativeSoundRef.current?.pauseAsync();
       } else {
         activeAudioRef.current?.pause();
       }
       setPlayingMessageId(null);
       return;
    }
    
    // Stop any existing
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
  };

  """
    
    content = content[:start_idx] + new_code + content[end_idx:]
    with open("src/app/chat/[id].tsx", "w", encoding="utf-8") as f:
        f.write(content)
    print("Audio functions updated!")
else:
    print("Could not find start or end index!")
