package com.synking

import android.content.Context
import android.media.AudioAttributes
import android.media.AudioDeviceInfo
import android.media.AudioFocusRequest
import android.media.AudioManager
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.util.Log
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise

class AudioRouteModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    private val audioManager: AudioManager = reactContext.getSystemService(Context.AUDIO_SERVICE) as AudioManager
    private val mainHandler = Handler(Looper.getMainLooper())
    private var audioFocusRequest: AudioFocusRequest? = null

    override fun getName(): String {
        return "AudioRouteModule"
    }

    private fun applyAudioRoute(on: Boolean) {
        try {
            audioManager.mode = AudioManager.MODE_IN_COMMUNICATION
            
            // Request AudioFocus for Voice Communication on Android 8.0+ / Android 14/15
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                if (audioFocusRequest == null) {
                    val playbackAttributes = AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_VOICE_COMMUNICATION)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                        .build()
                    audioFocusRequest = AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT)
                        .setAudioAttributes(playbackAttributes)
                        .setAcceptsDelayedFocusGain(true)
                        .setOnAudioFocusChangeListener { focusChange ->
                            Log.d("SYNKING_AUDIO", "AudioFocus changed: $focusChange")
                        }
                        .build()
                }
                audioFocusRequest?.let { audioManager.requestAudioFocus(it) }
            } else {
                @Suppress("DEPRECATION")
                audioManager.requestAudioFocus(null, AudioManager.STREAM_VOICE_CALL, AudioManager.AUDIOFOCUS_GAIN_TRANSIENT)
            }

            audioManager.isSpeakerphoneOn = on
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                val targetDevice = audioManager.availableCommunicationDevices.find { 
                    if (on) it.type == AudioDeviceInfo.TYPE_BUILTIN_SPEAKER 
                    else it.type == AudioDeviceInfo.TYPE_BUILTIN_EARPIECE 
                }
                if (targetDevice != null) {
                    audioManager.setCommunicationDevice(targetDevice)
                } else {
                    audioManager.clearCommunicationDevice()
                }
            }
            if (on) {
                val maxCallVol = audioManager.getStreamMaxVolume(AudioManager.STREAM_VOICE_CALL)
                audioManager.setStreamVolume(AudioManager.STREAM_VOICE_CALL, maxCallVol, 0)
                val maxMusicVol = audioManager.getStreamMaxVolume(AudioManager.STREAM_MUSIC)
                audioManager.setStreamVolume(AudioManager.STREAM_MUSIC, maxMusicVol, 0)
                val maxSysVol = audioManager.getStreamMaxVolume(AudioManager.STREAM_SYSTEM)
                audioManager.setStreamVolume(AudioManager.STREAM_SYSTEM, maxSysVol, 0)
            }
            audioManager.isMicrophoneMute = false
        } catch (e: Exception) {
            Log.w("SYNKING_AUDIO", "applyAudioRoute notice: ${e.message}")
        }
    }

    @ReactMethod
    fun setSpeakerphoneOn(on: Boolean, promise: Promise) {
        mainHandler.post {
            try {
                // Immediate enforcement
                applyAudioRoute(on)

                // Multi-stage delayed enforcement to prevent WebRTC native C++ layer from overriding to earpiece
                val delays = longArrayOf(150, 400, 800, 1500, 2500)
                for (delay in delays) {
                    mainHandler.postDelayed({ applyAudioRoute(on) }, delay)
                }

                promise.resolve(on)
            } catch (e: Exception) {
                promise.reject("AUDIO_ROUTE_ERROR", e.message)
            }
        }
    }

    @ReactMethod
    fun isSpeakerphoneOn(promise: Promise) {
        mainHandler.post {
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    val currentDevice = audioManager.communicationDevice
                    if (currentDevice != null) {
                        promise.resolve(currentDevice.type == AudioDeviceInfo.TYPE_BUILTIN_SPEAKER)
                        return@post
                    }
                }
                promise.resolve(audioManager.isSpeakerphoneOn)
            } catch (e: Exception) {
                promise.reject("AUDIO_ROUTE_ERROR", e.message)
            }
        }
    }

    @ReactMethod
    fun resetAudioMode(promise: Promise) {
        mainHandler.post {
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    audioFocusRequest?.let { audioManager.abandonAudioFocusRequest(it) }
                } else {
                    @Suppress("DEPRECATION")
                    audioManager.abandonAudioFocus(null)
                }
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    audioManager.clearCommunicationDevice()
                }
                audioManager.isSpeakerphoneOn = false
                audioManager.mode = AudioManager.MODE_NORMAL
                promise.resolve(true)
            } catch (e: Exception) {
                promise.reject("AUDIO_ROUTE_ERROR", e.message)
            }
        }
    }

    private var proximityWakeLock: android.os.PowerManager.WakeLock? = null

    @ReactMethod
    fun setProximitySensorEnabled(enabled: Boolean, promise: Promise) {
        mainHandler.post {
            try {
                val powerManager = reactContext.getSystemService(Context.POWER_SERVICE) as android.os.PowerManager
                if (enabled) {
                    if (proximityWakeLock == null) {
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP && powerManager.isWakeLockLevelSupported(android.os.PowerManager.PROXIMITY_SCREEN_OFF_WAKE_LOCK)) {
                            proximityWakeLock = powerManager.newWakeLock(android.os.PowerManager.PROXIMITY_SCREEN_OFF_WAKE_LOCK, "Synking:ProximityWakeLock")
                        }
                    }
                    if (proximityWakeLock?.isHeld == false) {
                        proximityWakeLock?.acquire()
                    }
                } else {
                    if (proximityWakeLock?.isHeld == true) {
                        proximityWakeLock?.release()
                    }
                }
                promise.resolve(true)
            } catch (e: Exception) {
                promise.reject("PROXIMITY_ERROR", e.message)
            }
        }
    }
}

