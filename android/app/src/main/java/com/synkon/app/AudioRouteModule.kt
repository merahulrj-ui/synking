package com.synking

import android.content.Context
import android.media.AudioDeviceInfo
import android.media.AudioManager
import android.os.Build
import android.os.Handler
import android.os.Looper
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise

class AudioRouteModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    private val audioManager: AudioManager = reactContext.getSystemService(Context.AUDIO_SERVICE) as AudioManager
    private val mainHandler = Handler(Looper.getMainLooper())

    override fun getName(): String {
        return "AudioRouteModule"
    }

    @ReactMethod
    fun setSpeakerphoneOn(on: Boolean, promise: Promise) {
        mainHandler.post {
            try {
                if (on) {
                    // 1. Loudspeaker Mode (Video Call OR Speaker Button ON)
                    audioManager.mode = AudioManager.MODE_IN_COMMUNICATION
                    audioManager.isSpeakerphoneOn = true
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                        val speakerDevice = audioManager.availableCommunicationDevices.find { 
                            it.type == AudioDeviceInfo.TYPE_BUILTIN_SPEAKER 
                        }
                        if (speakerDevice != null) {
                            audioManager.setCommunicationDevice(speakerDevice)
                        } else {
                            audioManager.clearCommunicationDevice()
                        }
                    }
                } else {
                    // 2. Private Earpiece Mode (Voice Call Near Ear)
                    audioManager.mode = AudioManager.MODE_IN_COMMUNICATION
                    audioManager.isSpeakerphoneOn = false
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                        val earpieceDevice = audioManager.availableCommunicationDevices.find { 
                            it.type == AudioDeviceInfo.TYPE_BUILTIN_EARPIECE 
                        }
                        if (earpieceDevice != null) {
                            audioManager.setCommunicationDevice(earpieceDevice)
                        } else {
                            audioManager.clearCommunicationDevice()
                        }
                    }
                }

                audioManager.isMicrophoneMute = false
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
}

