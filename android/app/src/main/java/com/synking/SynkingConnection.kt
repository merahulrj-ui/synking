package com.synking

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.telecom.Connection
import android.telecom.DisconnectCause
import android.util.Log
import androidx.core.app.NotificationCompat

class SynkingConnection(
    private val context: Context,
    private val callId: String,
    private val callerId: String = "",
    private val callerName: String,
    private val callType: String
) : Connection() {

    init {
        // Essential properties for VoIP call
        connectionProperties = PROPERTY_SELF_MANAGED
        audioModeIsVoip = true
    }

    override fun onShowIncomingCallUi() {
        super.onShowIncomingCallUi()
        Log.d("SYNKING_TELECOM", "[UI] INCOMING_CALL_SHOWN: Showing custom IncomingCallActivity for $callId ($callerId)")

        val fullScreenIntent = Intent(context, IncomingCallActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_REORDER_TO_FRONT
            putExtra("callId", callId)
            putExtra("callerId", callerId)
            putExtra("callerName", callerName)
            putExtra("callType", callType)
        }

        val piFlags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        } else {
            PendingIntent.FLAG_UPDATE_CURRENT
        }
        val fullScreenPendingIntent = PendingIntent.getActivity(
            context, callId.hashCode(), fullScreenIntent, piFlags
        )

        // ── Notification Channel (lock screen needs this) ──
        val channelId = "synking_telecom_calls"
        val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                "SYNKING Incoming Calls",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                lockscreenVisibility = NotificationCompat.VISIBILITY_PUBLIC
                setBypassDnd(true)
                setSound(null, null) // Ringtone plays in IncomingCallActivity
                enableVibration(false) // Single source of vibration in IncomingCallActivity
            }
            nm.createNotificationChannel(channel)
        }

        // ── Decline Action ──
        val declineIntent = Intent(context, CallActionReceiver::class.java).apply {
            action = "ACTION_DECLINE_CALL"
        }
        val declinePendingIntent = PendingIntent.getBroadcast(
            context, callId.hashCode() + 1, declineIntent, piFlags
        )

        // ── Accept Action ──
        val acceptIntent = Intent(context, IncomingCallActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
            putExtra("callId", callId)
            putExtra("callerId", callerId)
            putExtra("callerName", callerName)
            putExtra("callType", callType)
            putExtra("autoAccept", true)
        }
        val acceptPendingIntent = PendingIntent.getActivity(
            context, callId.hashCode() + 2, acceptIntent, piFlags
        )

        // ── Build Notification with FullScreenIntent for Lock Screen ──
        val notification = NotificationCompat.Builder(context, channelId)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle("📞 Incoming ${if (callType == "video") "Video" else "Voice"} Call")
            .setContentText("$callerName is calling on SYNKING")
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setFullScreenIntent(fullScreenPendingIntent, true) // ✅ LOCK SCREEN!
            .setContentIntent(fullScreenPendingIntent)
            .setAutoCancel(false)
            .setOngoing(true)
            .addAction(android.R.drawable.ic_menu_close_clear_cancel, "Decline", declinePendingIntent)
            .addAction(android.R.drawable.ic_menu_call, "Accept", acceptPendingIntent)
            .build()

        SynkingConnectionService.startCallForeground(notification)
        nm.notify(MyFirebaseMessagingService.NOTIFICATION_ID, notification)
        Log.d("SYNKING_TELECOM", "[UI] NOTIFICATION_POSTED: with FullScreenIntent for lock screen")

        // ── Also try direct Activity launch (works when app is foreground) ──
        try {
            context.startActivity(fullScreenIntent)
            Log.d("SYNKING_TELECOM", "[UI] DIRECT_ACTIVITY_LAUNCH: SUCCESS")
        } catch (e: Exception) {
            Log.e("SYNKING_TELECOM", "[UI] DIRECT_ACTIVITY_LAUNCH: BLOCKED (${e.message}) — FullScreenIntent notification will handle it")
        }
    }

    override fun onAnswer() {
        super.onAnswer()
        Log.d("SYNKING_TELECOM", "[UI] ANSWER: natively accepted")
        setActive()
    }

    override fun onReject() {
        super.onReject()
        Log.d("SYNKING_TELECOM", "[UI] REJECT: natively rejected")
        setDisconnected(DisconnectCause(DisconnectCause.REJECTED))
        destroy()
    }

    override fun onDisconnect() {
        super.onDisconnect()
        Log.d("SYNKING_TELECOM", "[UI] DISCONNECT: natively disconnected")
        setDisconnected(DisconnectCause(DisconnectCause.LOCAL))
        destroy()
    }
}
