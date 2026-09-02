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
    fun launchIncomingCallActivity(callId: String, callerName: String, callType: String, promise: Promise) {
        try {
            val ctx = reactApplicationContext
            val intent = Intent(ctx, IncomingCallActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
                putExtra("callId", callId)
                putExtra("callerName", callerName)
                putExtra("callType", callType)
            }
            ctx.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("LAUNCH_ERR", e.message)
        }
    }

    @ReactMethod
    fun requestVoipPermissions(promise: Promise) {
        try {
            val ctx = reactApplicationContext
            val pkg = ctx.packageName

            // 1. Battery Optimization (Bypass Doze for instant call wakeups)
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
                val pm = ctx.getSystemService(android.content.Context.POWER_SERVICE) as? android.os.PowerManager
                if (pm != null && !pm.isIgnoringBatteryOptimizations(pkg)) {
                    val intent = Intent(android.provider.Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
                        data = android.net.Uri.parse("package:$pkg")
                        flags = Intent.FLAG_ACTIVITY_NEW_TASK
                    }
                    ctx.startActivity(intent)
                }
            }

            // 2. Full Screen Intent (Android 14+ / API 34+ for lock screen calls)
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
                val nm = ctx.getSystemService(android.content.Context.NOTIFICATION_SERVICE) as? android.app.NotificationManager
                if (nm != null && !nm.canUseFullScreenIntent()) {
                    val intent = Intent(android.provider.Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT).apply {
                        data = android.net.Uri.parse("package:$pkg")
                        flags = Intent.FLAG_ACTIVITY_NEW_TASK
                    }
                    ctx.startActivity(intent)
                }
            }

            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("PERM_ERR", e.message)
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
            val activity = incomingActivityInstance
            if (activity != null) {
                activity.runOnUiThread {
                    activity.attachRemoteVideo(streamUrl)
                }
                promise.resolve(true)
            } else {
                Log.w("SYNKING_TELECOM", "[VIDEO] attachRemoteVideo: incomingActivityInstance is null")
                promise.resolve(false)
            }
        } catch (e: Exception) {
            promise.reject("ERR", e.message)
        }
    }

    @ReactMethod
    fun attachLocalVideo(streamUrl: String, promise: Promise) {
        try {
            val activity = incomingActivityInstance
            if (activity != null) {
                activity.runOnUiThread {
                    activity.attachLocalVideo(streamUrl)
                }
                promise.resolve(true)
            } else {
                Log.w("SYNKING_TELECOM", "[VIDEO] attachLocalVideo: incomingActivityInstance is null")
                promise.resolve(false)
            }
        } catch (e: Exception) {
            promise.reject("ERR", e.message)
        }
    }

    @ReactMethod
    fun endCall(promise: Promise) {
        try {
            CallConnectionManager.endCall()
            IncomingCallActivity.stopRingtoneGlobally()
            incomingActivityInstance?.let { activity ->
                activity.runOnUiThread {
                    try {
                        activity.finishAndRemoveTask()
                    } catch (e: Exception) {}
                    activity.finish()
                }
            }
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

        fun emitAcceptEvent(
            callId: String = "",
            callerId: String = "",
            callerName: String = "",
            callType: String = ""
        ) {
            try {
                val finalCallId = if (callId.isNotEmpty()) callId else (incomingActivityInstance?.callId ?: "")
                val finalCallerId = if (callerId.isNotEmpty()) callerId else (incomingActivityInstance?.callerId ?: "")
                val finalCallerName = if (callerName.isNotEmpty()) callerName else (incomingActivityInstance?.callerName ?: "")
                val finalCallType = if (callType.isNotEmpty()) callType else (incomingActivityInstance?.callType ?: "audio")

                val map = com.facebook.react.bridge.Arguments.createMap().apply {
                    putString("callId", finalCallId)
                    putString("callerId", finalCallerId)
                    putString("callerName", finalCallerName)
                    putString("callType", finalCallType)
                }
                Log.d("SYNKING_DEBUG", "[BRIDGE] emitAcceptEvent -> onTelecomCallAnswered: callId=$finalCallId, caller=$finalCallerName, type=$finalCallType")
                reactContext?.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                    ?.emit("onTelecomCallAnswered", map)
            } catch (e: Exception) {
                Log.e("SYNKING_DEBUG", "[BRIDGE] emitAcceptEvent_ERROR: ${e.message}")
            }
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
