package com.synkon.app

import android.content.Context
import android.media.AudioDeviceInfo
import android.media.AudioManager
import android.os.Build
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise

class AudioRouteModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    private val audioManager: AudioManager = reactContext.getSystemService(Context.AUDIO_SERVICE) as AudioManager

    override fun getName(): String {
        return "AudioRouteModule"
    }

    @ReactMethod
    fun setSpeakerphoneOn(on: Boolean, promise: Promise) {
        try {
            audioManager.mode = AudioManager.MODE_IN_COMMUNICATION

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                // Modern Android 12, 13, 14, 15 Communication Device Routing
                if (on) {
                    val speakerDevice = audioManager.availableCommunicationDevices.find { 
                        it.type == AudioDeviceInfo.TYPE_BUILTIN_SPEAKER 
                    }
                    if (speakerDevice != null) {
                        audioManager.setCommunicationDevice(speakerDevice)
                    }
                } else {
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

            // Universal fallback
            audioManager.isSpeakerphoneOn = on
            promise.resolve(on)
        } catch (e: Exception) {
            promise.reject("AUDIO_ROUTE_ERROR", e.message)
        }
    }

    @ReactMethod
    fun isSpeakerphoneOn(promise: Promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                val currentDevice = audioManager.communicationDevice
                if (currentDevice != null) {
                    promise.resolve(currentDevice.type == AudioDeviceInfo.TYPE_BUILTIN_SPEAKER)
                    return
                }
            }
            promise.resolve(audioManager.isSpeakerphoneOn)
        } catch (e: Exception) {
            promise.reject("AUDIO_ROUTE_ERROR", e.message)
        }
    }

    @ReactMethod
    fun resetAudioMode(promise: Promise) {
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
