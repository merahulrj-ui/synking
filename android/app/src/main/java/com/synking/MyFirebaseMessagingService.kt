package com.synking

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.media.RingtoneManager
import android.os.Build
import android.os.PowerManager
import android.util.Log
import androidx.core.app.NotificationCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import android.telecom.TelecomManager
import android.telecom.PhoneAccountHandle
import android.content.ComponentName
import android.os.Bundle

class MyFirebaseMessagingService : FirebaseMessagingService() {

    companion object {
        private const val TAG = "SYNKING_FCM"
        private const val CHANNEL_ID = "incoming_calls"
        const val NOTIFICATION_ID = 9001
    }

    private fun debug(stage: String, status: String, details: String = "") {
        Log.d(
            TAG,
            "[SYNKING_CALL_DEBUG] [$status] $stage $details"
        )
    }

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        debug("FCM_TOKEN_REFRESHED", "OK", "token=${token.take(16)}...")

        // Auto-save native FCM token to server so dead-state wakeup works!
        val prefs = getSharedPreferences("synking_call_state", MODE_PRIVATE)
        val userId = prefs.getString("current_user_id", null)
        if (userId != null) {
            saveFcmTokenToServer(userId, token)
        }
        // Always store token locally so MainActivity can save it after login
        prefs.edit().putString("pending_fcm_token", token).apply()
    }

    private fun saveFcmTokenToServer(userId: String, fcmToken: String) {
        Thread {
            try {
                val url = java.net.URL("https://synking-9my2.onrender.com/api/profiles/push-token")
                val conn = url.openConnection() as java.net.HttpURLConnection
                conn.requestMethod = "POST"
                conn.setRequestProperty("Content-Type", "application/json")
                conn.doOutput = true
                conn.connectTimeout = 10000
                conn.readTimeout = 10000

                val body = """{"userId":"$userId","fcmPushToken":"$fcmToken"}"""
                conn.outputStream.write(body.toByteArray())

                val code = conn.responseCode
                debug("FCM_TOKEN_SAVED_TO_SERVER", if (code == 200) "OK" else "FAIL", "userId=$userId code=$code")
                conn.disconnect()
            } catch (e: Exception) {
                debug("FCM_TOKEN_SAVE_ERROR", "FAIL", e.message ?: "")
            }
        }.start()
    }


    override fun onMessageReceived(message: RemoteMessage) {
        super.onMessageReceived(message)

        Log.d("SYNKING_FCM", "FCM_RECEIVED: data=${message.data}")

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

        if (data["type"] == "CALL_ENDED") {
            debug("FCM_CALL_ENDED", "OK", "Stopping ringtone and converting to Missed Call notification")
            
            val callId = data["callId"] ?: ""
            val callerName = data["callerName"] ?: "Someone"
            val callerId = data["callerId"] ?: ""
            
            // 1. Stop native ringtone & vibration instantly!
            IncomingCallActivity.stopRingtoneGlobally()
            CallConnectionManager.endCall()

            // 2. Directly dismiss open call activity with zero latency
            TelecomModule.incomingActivityInstance?.let { activity ->
                activity.runOnUiThread {
                    try {
                        activity.finishAndRemoveTask()
                    } catch (e: Exception) {}
                    activity.finish()
                }
            }

            // 3. Cancel the ringing incoming call notification
            val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.cancel(NOTIFICATION_ID)
            notificationManager.cancelAll()
            
            // 4. Broadcast to close any open call screen immediately
            sendBroadcast(Intent("com.synking.CLOSE_CALL_SCREEN"))
            sendBroadcast(Intent("com.synking.CALL_ENDED_FROM_JS"))

            // 4. Create dedicated Missed Call Notification Channel (standard notification sound, no looping ringtone)
            val missedChannelId = "synking_missed_calls_channel"
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val channel = NotificationChannel(
                    missedChannelId,
                    "SYNKING Missed Calls",
                    NotificationManager.IMPORTANCE_DEFAULT
                ).apply {
                    description = "Notifications for missed voice and video calls"
                    enableLights(true)
                    enableVibration(true)
                    vibrationPattern = longArrayOf(0, 250, 250, 250)
                }
                notificationManager.createNotificationChannel(channel)
            }

            // 5. Tapping Missed Call opens MainActivity directly
            val tapIntent = Intent(this, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
                putExtra("OPEN_CHAT_USER_ID", callerId)
            }
            val piFlags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            } else {
                PendingIntent.FLAG_UPDATE_CURRENT
            }
            val tapPendingIntent = PendingIntent.getActivity(this, callId.hashCode() + 2, tapIntent, piFlags)

            val missedCallNotification = NotificationCompat.Builder(this, missedChannelId)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle("📞 Missed Call")
                .setContentText("You missed a call from $callerName")
                .setPriority(NotificationCompat.PRIORITY_DEFAULT)
                .setAutoCancel(true)
                .setContentIntent(tapPendingIntent)
                .build()

            notificationManager.notify(callId.hashCode() + 100, missedCallNotification)
            return
        }

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

        // 1. Wake screen instantly with PowerManager WakeLock
        try {
            val pm = getSystemService(Context.POWER_SERVICE) as PowerManager
            val wl = pm.newWakeLock(
                PowerManager.SCREEN_BRIGHT_WAKE_LOCK or PowerManager.ACQUIRE_CAUSES_WAKEUP or PowerManager.ON_AFTER_RELEASE,
                "synking:fcm_call_wakeup"
            )
            wl.acquire(30_000L)
            debug("WAKELOCK_ACQUIRED", "OK", "30s screen wake active")
        } catch (e: Exception) {
            debug("WAKELOCK_ACQUIRED", "FAIL", e.message ?: "")
        }

        // 2. Persist the call state
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

        // 3. TRY TELECOM MANAGER FIRST
        try {
            Log.d("SYNKING_TELECOM", "[FCM] CALL_DATA_PARSED: Attempting TelecomManager...")
            val telecomManager = getSystemService(Context.TELECOM_SERVICE) as TelecomManager
            val componentName = ComponentName(this, SynkingConnectionService::class.java)
            val phoneAccountHandle = PhoneAccountHandle(componentName, "SynkingPhoneAccount")

            // Ensure registered in dead state
            val phoneAccount = android.telecom.PhoneAccount.builder(phoneAccountHandle, "SYNKING Direct")
                .setCapabilities(android.telecom.PhoneAccount.CAPABILITY_SELF_MANAGED)
                .build()
            telecomManager.registerPhoneAccount(phoneAccount)

            val extrasBundle = Bundle().apply {
                putString("callId", callId)
                putString("callerId", callerId)
                putString("callerName", callerName)
                putString("callType", callType)
            }
            val telecomExtras = Bundle().apply {
                putParcelable(TelecomManager.EXTRA_INCOMING_CALL_EXTRAS, extrasBundle)
            }
            
            Log.d("SYNKING_TELECOM", "[TELECOM] ADD_NEW_INCOMING_CALL: Triggering...")
            telecomManager.addNewIncomingCall(phoneAccountHandle, telecomExtras)
            debug("TELECOM_LAUNCH", "OK", "callId=$callId")
            
            // If successful, DO NOT launch the legacy manual UI and Notification!
            return 
        } catch (e: Exception) {
            Log.e("SYNKING_TELECOM", "[TELECOM] ERROR: ${e.message}", e)
            debug("TELECOM_LAUNCH", "FAIL", e.message ?: "")
        }

        // --- LEGACY FALLBACK (Will retire once Telecom is proven 100%) ---

        val piFlags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        } else {
            PendingIntent.FLAG_UPDATE_CURRENT
        }

        val fullScreenIntent = Intent(this, IncomingCallActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_REORDER_TO_FRONT
            putExtra("callId", callId)
            putExtra("callerId", callerId)
            putExtra("callerName", callerName)
            putExtra("callerPhoto", callerPhoto)
            putExtra("callType", callType)
        }
        val fullScreenPendingIntent = PendingIntent.getActivity(this, callId.hashCode(), fullScreenIntent, piFlags)

        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        val channelId = "synking_incoming_calls_v4"

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                "SYNKING Calls (Silent Banner)",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Full screen incoming calls without duplicate banner sound"
                enableLights(true)
                enableVibration(true)
                vibrationPattern = longArrayOf(0, 1000, 1000, 1000, 1000)
                lockscreenVisibility = NotificationCompat.VISIBILITY_PUBLIC
                setBypassDnd(true)
                setSound(null, null)
            }
            notificationManager.createNotificationChannel(channel)
        }



            
            // DECLINE ACTION
            val declineIntent = Intent(this, CallActionReceiver::class.java).apply { action = "ACTION_DECLINE_CALL" }
            val declinePendingIntent = PendingIntent.getBroadcast(this, callId.hashCode() + 1, declineIntent, piFlags)
            
            // ACCEPT ACTION
            val acceptIntent = Intent(this, IncomingCallActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
                putExtra("callId", callId)
                putExtra("callerName", callerName)
                putExtra("callerPhoto", callerPhoto)
                putExtra("callType", callType)
                putExtra("autoAccept", true)
            }
            val acceptPendingIntent = PendingIntent.getActivity(this, callId.hashCode() + 2, acceptIntent, piFlags)

        val notification = NotificationCompat.Builder(this, channelId)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle("📞 Incoming ${if (callType == "video") "Video" else "Voice"} Call")
            .setContentText("$callerName is calling you on SYNKING")
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setAutoCancel(false)
            .setOngoing(true)
            .setFullScreenIntent(fullScreenPendingIntent, true) // ✅ LOCK SCREEN FULL-SCREEN UI
            .setContentIntent(fullScreenPendingIntent) // Tap banner to open UI
            .addAction(android.R.drawable.ic_menu_close_clear_cancel, "Decline", declinePendingIntent)
            .addAction(android.R.drawable.ic_menu_call, "Accept", acceptPendingIntent)
            .build()

        Log.d(
            "SYNKING_FCM",
            "POST_CALL_NOTIFICATION: callId=$callId, caller=$callerName, channel=$channelId, fullScreenIntent=true"
        )
        notificationManager.notify(NOTIFICATION_ID, notification)
        debug("NOTIFICATION_POSTED", "OK", "callId=$callId")

        try {
            Log.d(
                "SYNKING_FCM",
                "DIRECT_START_ACTIVITY: attempting IncomingCallActivity; appState=background/service"
            )
            startActivity(fullScreenIntent)
            Log.d(
                "SYNKING_FCM",
                "DIRECT_START_ACTIVITY: SUCCESS"
            )
            debug("DIRECT_ACTIVITY_LAUNCH", "OK", "Forced IncomingCallActivity to front.")
        } catch (e: Exception) {
            Log.e(
                "SYNKING_FCM",
                "DIRECT_START_ACTIVITY: BLOCKED/FAILED: ${e.javaClass.simpleName}: ${e.message}",
                e
            )
            debug("DIRECT_ACTIVITY_LAUNCH", "FAIL", e.message ?: "")
        }
    }
}
