package com.synking

import android.content.ComponentName
import android.content.Context
import android.telecom.PhoneAccount
import android.telecom.PhoneAccountHandle
import android.telecom.TelecomManager
import android.util.Log
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise

class TelecomModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "TelecomModule"
    }

    @ReactMethod
    fun registerPhoneAccount(promise: Promise) {
        try {
            val telecomManager = reactApplicationContext.getSystemService(Context.TELECOM_SERVICE) as TelecomManager
            val componentName = ComponentName(reactApplicationContext, SynkingConnectionService::class.java)
            val phoneAccountHandle = PhoneAccountHandle(componentName, "SynkingPhoneAccount")

            val phoneAccount = PhoneAccount.builder(phoneAccountHandle, "SYNKING Direct")
                .setCapabilities(PhoneAccount.CAPABILITY_SELF_MANAGED)
                .build()

            telecomManager.registerPhoneAccount(phoneAccount)
            Log.d("SYNKING_TELECOM", "[TELECOM] PHONE_ACCOUNT_READY: Successfully registered SynkingPhoneAccount")
            promise.resolve(true)
        } catch (e: Exception) {
            Log.e("SYNKING_TELECOM", "[TELECOM] ERROR: Failed to register PhoneAccount", e)
            promise.reject("TELECOM_ERROR", e.message)
        }
    }

    @ReactMethod
    fun setSpeakerOn(isOn: Boolean, promise: Promise) {
        try {
            val connection = CallConnectionManager.currentConnection
            if (connection != null) {
                val route = if (isOn) android.telecom.CallAudioState.ROUTE_SPEAKER else android.telecom.CallAudioState.ROUTE_EARPIECE
                connection.setAudioRoute(route)
                Log.d("SYNKING_TELECOM", "[TELECOM] AUDIO_ROUTE: Set speaker to $isOn")
                promise.resolve(true)
            } else {
                Log.w("SYNKING_TELECOM", "[TELECOM] AUDIO_ROUTE: No active connection to change route")
                promise.resolve(false) // Fallback to normal AudioManager
            }
        } catch (e: Exception) {
            promise.reject("TELECOM_ERROR", e.message)
        }
    }
}
