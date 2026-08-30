package com.synking

import android.content.Intent
import android.util.Log
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

class MyFirebaseMessagingService : FirebaseMessagingService() {

    companion object {
        private const val TAG = "SYNKING_FCM"
    }

    private fun debug(stage: String, status: String, details: String = "") {
        Log.d(
            TAG,
            "[SYNKING_CALL_DEBUG] [$status] $stage $details"
        )
    }

    override fun onNewToken(token: String) {
        super.onNewToken(token)

        debug(
            "FCM_TOKEN_REFRESHED",
            "OK",
            "token=${token.take(16)}..."
        )

        // Token is also obtainable through
        // expo-notifications.getDevicePushTokenAsync().
        //
        // We deliberately do not modify WebRTC here.
    }

    override fun onMessageReceived(message: RemoteMessage) {
        super.onMessageReceived(message)

        debug(
            "FCM_RECEIVED",
            "OK",
            "from=${message.from}"
        )

        val data = message.data

        debug(
            "FCM_DATA",
            "OK",
            "type=${data["type"]} callId=${data["callId"]}"
        )

        if (data["type"] != "INCOMING_CALL") {
            debug(
                "FCM_IGNORED",
                "INFO",
                "type=${data["type"]}"
            )
            return
        }

        val callId = data["callId"] ?: ""
        val callerName = data["callerName"] ?: "Someone"
        val callType = data["callType"] ?: "audio"
        val callerId = data["callerId"] ?: ""
        val callerPhoto = data["callerPhoto"] ?: ""

        debug(
            "INCOMING_CALL_DATA",
            "OK",
            "callId=$callId caller=$callerName type=$callType"
        )

        // Persist the call because React Native may not yet exist.
        val prefs = getSharedPreferences(
            "synking_call_state",
            MODE_PRIVATE
        )

        prefs.edit()
            .putBoolean("has_pending_call", true)
            .putString("call_id", callId)
            .putString("caller_id", callerId)
            .putString("caller_name", callerName)
            .putString("caller_photo", callerPhoto)
            .putString("call_type", callType)
            .apply()

        debug(
            "CALL_STATE_PERSISTED",
            "OK",
            "callId=$callId"
        )

        try {
            val intent = Intent(
                this,
                IncomingCallActivity::class.java
            ).apply {
                flags =
                    Intent.FLAG_ACTIVITY_NEW_TASK or
                    Intent.FLAG_ACTIVITY_SINGLE_TOP or
                    Intent.FLAG_ACTIVITY_CLEAR_TOP

                putExtra("callId", callId)
                putExtra("callerId", callerId)
                putExtra("callerName", callerName)
                putExtra("callerPhoto", callerPhoto)
                putExtra("callType", callType)
            }

            startActivity(intent)

            debug(
                "INCOMING_CALL_ACTIVITY",
                "OK",
                "startActivity requested"
            )

        } catch (e: Exception) {
            debug(
                "INCOMING_CALL_ACTIVITY",
                "FAIL",
                e.message ?: "unknown"
            )
        }
    }
}