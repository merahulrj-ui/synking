package com.synkon.app

import android.content.Context
import android.media.AudioManager
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
            audioManager.isSpeakerphoneOn = on
            promise.resolve(on)
        } catch (e: Exception) {
            promise.reject("AUDIO_ROUTE_ERROR", e.message)
        }
    }

    @ReactMethod
    fun isSpeakerphoneOn(promise: Promise) {
        try {
            promise.resolve(audioManager.isSpeakerphoneOn)
        } catch (e: Exception) {
            promise.reject("AUDIO_ROUTE_ERROR", e.message)
        }
    }

    @ReactMethod
    fun resetAudioMode(promise: Promise) {
        try {
            audioManager.isSpeakerphoneOn = false
            audioManager.mode = AudioManager.MODE_NORMAL
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("AUDIO_ROUTE_ERROR", e.message)
        }
    }
}
