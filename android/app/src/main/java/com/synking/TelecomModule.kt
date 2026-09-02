package com.synking

import android.content.Intent
import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableNativeMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.util.concurrent.ConcurrentLinkedQueue

class TelecomModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    init {
        TelecomModule.reactContext = reactContext
        globalReactContext = reactContext
        onReactContextReady(reactContext)
    }

    override fun getName(): String {
        return "TelecomModule"
    }

    @ReactMethod
    fun getPendingIncomingCall(promise: Promise) {
        try {
            val call = PendingCallStore.get(reactApplicationContext)
            if (call != null) {
                val map = WritableNativeMap().apply {
                    putString("callId", call.callId)
                    putString("callerId", call.callerId)
                    putString("callerName", call.callerName)
                    putString("callerPhoto", call.callerPhoto ?: "")
                    putString("callType", call.callType)
                }
                promise.resolve(map)
            } else {
                promise.resolve(null)
            }
        } catch (e: Exception) {
            promise.resolve(null)
        }
    }

    @ReactMethod
    fun notifyBridgedToJs(callId: String, promise: Promise) {
        try {
            Log.d("SYNKING_DEBUG", "[BRIDGE] notifyBridgedToJs confirmed for callId=")
            incomingActivityInstance?.onJsBridgeConfirmed()
            PendingCallStore.clear(reactApplicationContext)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.resolve(false)
        }
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
            CallReliabilityHelper.runOnboardingReliabilityCheck(reactApplicationContext)
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
        var reactContext: ReactContext? = null
        private val pendingEvents = ConcurrentLinkedQueue<PendingCall>()

        fun emitAcceptEvent(call: PendingCall) {
            val ctx = reactContext
            if (ctx == null || !ctx.hasActiveCatalystInstance()) {
                Log.d("SYNKING_DEBUG", "[BRIDGE] reactContext inactive, queuing pending call: ")
                pendingEvents.add(call)
                return
            }
            val params = Arguments.createMap().apply {
                putString("callId", call.callId)
                putString("callerId", call.callerId)
                putString("callerName", call.callerName)
                putString("callerPhoto", call.callerPhoto ?: "")
                putString("callType", call.callType)
            }
            Log.d("SYNKING_DEBUG", "[BRIDGE] emitAcceptEvent -> onTelecomCallAnswered: callId=, caller=, type=")
            ctx.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit("onTelecomCallAnswered", params)
        }

        fun emitAcceptEvent(
            callId: String = "",
            callerId: String = "",
            callerName: String = "",
            callType: String = ""
        ) {
            val finalCallId = if (callId.isNotEmpty()) callId else (incomingActivityInstance?.callId ?: "")
            val finalCallerId = if (callerId.isNotEmpty()) callerId else (incomingActivityInstance?.callerId ?: "")
            val finalCallerName = if (callerName.isNotEmpty()) callerName else (incomingActivityInstance?.callerName ?: "")
            val finalCallType = if (callType.isNotEmpty()) callType else (incomingActivityInstance?.callType ?: "audio")

            val call = PendingCall(finalCallId, finalCallerId, finalCallerName, null, finalCallType)
            emitAcceptEvent(call)
        }

        fun emitDeclineEvent(callId: String) {
            val ctx = reactContext ?: return
            val params = Arguments.createMap().apply { putString("callId", callId) }
            ctx.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit("onTelecomCallDeclined", params)
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

        fun onReactContextReady(ctx: ReactContext) {
            reactContext = ctx
            Log.d("SYNKING_DEBUG", "[BRIDGE] onReactContextReady: Flushing  pending call events")
            while (true) {
                val call = pendingEvents.poll() ?: break
                emitAcceptEvent(call)
            }
        }
    }
}
