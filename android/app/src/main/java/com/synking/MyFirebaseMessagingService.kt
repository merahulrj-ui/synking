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

class MyFirebaseMessagingService : FirebaseMessagingService() {

    companion object {
        private const val TAG = "SYNKING_FCM"
        private const val CHANNEL_ID = "incoming_calls"
        private const val NOTIFICATION_ID = 9001
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

        // 1. Wake screen instantly with PowerManager WakeLock
        try {
            val pm = getSystemService(Context.POWER_SERVICE) as PowerManager
            val wl = pm.newWakeLock(
                PowerManager.SCREEN_BRIGHT_WAKE_LOCK or PowerManager.ACQUIRE_CAUSES_WAKEUP or PowerManager.ON_AFTER_RELEASE,
                "synking:fcm_call_wakeup"
            )
            wl.acquire(15_000L)
            debug("WAKELOCK_ACQUIRED", "OK", "15s screen wake active")
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

        // 3. Create FullScreenIntent PendingIntent for IncomingCallActivity
        val fullScreenIntent = Intent(
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

        val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        } else {
            PendingIntent.FLAG_UPDATE_CURRENT
        }

        val fullScreenPendingIntent = PendingIntent.getActivity(
            this,
            callId.hashCode(),
            fullScreenIntent,
            flags
        )

        // 4. Create Notification Channel with High Importance and Call Category
        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "SYNKING Incoming Calls",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Incoming voice & video calls from SYNKING"
                enableLights(true)
                enableVibration(true)
                vibrationPattern = longArrayOf(0, 800, 1000, 800, 1000)
                lockscreenVisibility = NotificationCompat.VISIBILITY_PUBLIC
                setBypassDnd(true)
                val ringtoneUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE)
                setSound(
                    ringtoneUri,
                    AudioAttributes.Builder()
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
                        .build()
                )
            }
            notificationManager.createNotificationChannel(channel)
        }

        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle("📞 Incoming ${if (callType == "video") "Video" else "Voice"} Call")
            .setContentText("$callerName is calling you on SYNKING")
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setAutoCancel(false)
            .setOngoing(true)
            .setFullScreenIntent(fullScreenPendingIntent, true)
            .setContentIntent(fullScreenPendingIntent)
            .build()

        notificationManager.notify(NOTIFICATION_ID, notification)
        debug("NOTIFICATION_POSTED", "OK", "callId=$callId")

        // 5. DIRECT ACTIVITY LAUNCH — Bypass Realme/ColorOS FullScreenIntent blocking!
        // This directly launches IncomingCallActivity over lock screen
        try {
            val directIntent = Intent(this, IncomingCallActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or
                        Intent.FLAG_ACTIVITY_CLEAR_TOP or
                        Intent.FLAG_ACTIVITY_SINGLE_TOP
                putExtra("callId", callId)
                putExtra("callerId", callerId)
                putExtra("callerName", callerName)
                putExtra("callerPhoto", callerPhoto)
                putExtra("callType", callType)
            }
            startActivity(directIntent)
            debug("DIRECT_ACTIVITY_LAUNCH", "OK", "IncomingCallActivity launched directly")
        } catch (e: Exception) {
            debug("DIRECT_ACTIVITY_LAUNCH", "FAIL", e.message ?: "")
        }


        notificationManager.notify(NOTIFICATION_ID, notification)
        debug("FULLSCREEN_NOTIFICATION_POSTED", "OK", "Notification with FullScreenIntent dispatched")

        // 5. Try direct startActivity as well
        try {
            startActivity(fullScreenIntent)
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