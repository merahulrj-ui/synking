package com.synking

import android.content.Intent
import android.util.Log
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule

class TelecomModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    init {
        TelecomModule.reactContext = reactContext
        globalReactContext = reactContext
    }

    override fun getName(): String {
        return "TelecomModule"
    }

    @ReactMethod
    fun notifyVideoCallConnected(promise: Promise) {
        try {
            val intent = Intent("com.synking.VIDEO_CALL_CONNECTED_FROM_JS")
            reactContext?.sendBroadcast(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("TELECOM_ERROR", e.message)
        }
    }

    @ReactMethod
    fun minimizeApp(promise: Promise) {
        try {
            reactApplicationContext.currentActivity?.moveTaskToBack(true)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("MINIMIZE_ERROR", e.message)
        }
    }

    @ReactMethod
    fun attachRemoteVideo(streamUrl: String, promise: Promise) {
        try {
            reactApplicationContext.currentActivity?.runOnUiThread {
                incomingActivityInstance?.attachRemoteVideo(streamUrl)
            }
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERR", e.message)
        }
    }

    @ReactMethod
    fun attachLocalVideo(streamUrl: String, promise: Promise) {
        try {
            reactApplicationContext.currentActivity?.runOnUiThread {
                incomingActivityInstance?.attachLocalVideo(streamUrl)
            }
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERR", e.message)
        }
    }

    @ReactMethod
    fun endCall(promise: Promise) {
        try {
            CallConnectionManager.endCall()
            val intent = Intent("com.synking.CALL_ENDED_FROM_JS")
            reactContext?.sendBroadcast(intent)
            Log.d("SYNKING_TELECOM", "[TELECOM] CALL_ENDED: Connection destroyed from React Native")
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("TELECOM_ERROR", e.message)
        }
    }

    companion object {
        var incomingActivityInstance: IncomingCallActivity? = null
        var globalReactContext: ReactApplicationContext? = null
        private var reactContext: ReactApplicationContext? = null

        fun emitAcceptEvent() {
            reactContext?.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                ?.emit("onTelecomCallAnswered", null)
        }

        fun emitMuteToggled(isMuted: Boolean) {
            reactContext?.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                ?.emit("onTelecomMuteToggled", isMuted)
        }

        fun emitSpeakerToggled(isSpeakerOn: Boolean) {
            reactContext?.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                ?.emit("onTelecomSpeakerToggled", isSpeakerOn)
        }

        fun emitEndCallEvent() {
            reactContext?.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                ?.emit("onTelecomEndCall", null)
        }
    }
}
