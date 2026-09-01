package com.synking

import android.app.Activity
import android.app.KeyguardManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.os.Bundle
import android.os.PowerManager
import android.util.Log
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.view.animation.Animation
import android.view.animation.ScaleAnimation
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.TextView

class IncomingCallActivity : Activity() {

    companion object {
        private const val TAG = "SYNKING_CALL_ACTIVITY"
        @Volatile var currentActivity: IncomingCallActivity? = null
        @Volatile var ringtoneInstance: android.media.Ringtone? = null
        @Volatile var vibratorInstance: android.os.Vibrator? = null

        fun stopRingtoneGlobally() {
            try {
                ringtoneInstance?.stop()
                ringtoneInstance = null
                vibratorInstance?.cancel()
                vibratorInstance = null
                currentActivity?.finish()
                currentActivity = null
                Log.d(TAG, "Ringtone stopped globally.")
            } catch (e: Exception) {
                Log.e(TAG, "Error stopping ringtone globally: ${e.message}")
            }
        }
    }

    private var wakeLock: PowerManager.WakeLock? = null
    private var closeReceiver: BroadcastReceiver? = null

    private fun debug(stage: String, status: String, details: String = "") {
        Log.d("SYNKING_FCM", "[SYNKING_CALL_DEBUG] [$status] $stage $details")
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        currentActivity = this

        applyLockscreenFlags()
        acquireWakeLock()
        startRingtoneAndVibration()
        registerCloseReceiver()

        val callId = intent.getStringExtra("callId") ?: ""
        val callerName = intent.getStringExtra("callerName") ?: "Someone"
        val callType = intent.getStringExtra("callType") ?: "audio"

        debug("CALL_ACTIVITY_CREATED", "OK", "callId=$callId caller=$callerName type=$callType")
        buildWhatsAppStyleUI(callerName, callType, callId)
    }

    private fun registerCloseReceiver() {
        closeReceiver = object : BroadcastReceiver() {
            override fun onReceive(context: Context?, intent: Intent?) {
                debug("CLOSE_BROADCAST_RECEIVED", "OK", "Dismissing IncomingCallActivity")
                stopRingtoneAndVibration()
                finish()
            }
        }
        val filter = IntentFilter("com.synking.CLOSE_CALL_SCREEN")
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(closeReceiver, filter, Context.RECEIVER_NOT_EXPORTED)
        } else {
            registerReceiver(closeReceiver, filter)
        }
    }

    private fun applyLockscreenFlags() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
                setShowWhenLocked(true)
                setTurnScreenOn(true)
                val keyguard = getSystemService(Context.KEYGUARD_SERVICE) as KeyguardManager
                keyguard.requestDismissKeyguard(this, null)
            } else {
                window.addFlags(
                    android.view.WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
                    android.view.WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON or
                    android.view.WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD or
                    android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
                )
            }
            debug("SCREEN_WAKE_REQUEST", "OK")
        } catch (e: Exception) {
            debug("SCREEN_WAKE_REQUEST", "FAIL", e.message ?: "unknown")
        }
    }

    private fun acquireWakeLock() {
        try {
            val pm = getSystemService(Context.POWER_SERVICE) as PowerManager
            wakeLock = pm.newWakeLock(
                PowerManager.SCREEN_BRIGHT_WAKE_LOCK or PowerManager.ACQUIRE_CAUSES_WAKEUP,
                "synking:incoming_call_activity"
            )
            wakeLock?.acquire(30_000L)
            debug("WAKELOCK", "OK", "30 seconds wake")
        } catch (e: Exception) {
            debug("WAKELOCK", "FAIL", e.message ?: "unknown")
        }
    }

    private fun dpToPx(dp: Int): Int {
        return TypedValue.applyDimension(
            TypedValue.COMPLEX_UNIT_DIP,
            dp.toFloat(),
            resources.displayMetrics
        ).toInt()
    }

    private fun buildWhatsAppStyleUI(
        callerName: String,
        callType: String,
        callId: String
    ) {
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER_HORIZONTAL
            setPadding(dpToPx(24), dpToPx(72), dpToPx(24), dpToPx(56))
            background = GradientDrawable(
                GradientDrawable.Orientation.TL_BR,
                intArrayOf(Color.parseColor("#0F172A"), Color.parseColor("#020617"))
            )
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.MATCH_PARENT
            )
        }

        // Top Brand Header
        val brandHeader = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER
            setPadding(dpToPx(16), dpToPx(6), dpToPx(16), dpToPx(6))
            background = GradientDrawable().apply {
                setColor(Color.parseColor("#151622"))
                cornerRadius = dpToPx(20).toFloat()
                setStroke(dpToPx(1), Color.parseColor("#FD3A73"))
            }
        }
        val brandText = TextView(this).apply {
            text = "⚡ SYNKING DIRECT"
            textSize = 12f
            setTextColor(Color.parseColor("#FD3A73"))
            typeface = android.graphics.Typeface.DEFAULT_BOLD
        }
        brandHeader.addView(brandText)
        root.addView(brandHeader)

        // Spacer
        root.addView(View(this).apply {
            layoutParams = LinearLayout.LayoutParams(1, dpToPx(36))
        })

        // Circular Avatar with Glowing Neon Ring
        val avatarContainer = FrameLayout(this).apply {
            val size = dpToPx(130)
            layoutParams = LinearLayout.LayoutParams(size, size).apply {
                gravity = Gravity.CENTER_HORIZONTAL
            }
            background = GradientDrawable().apply {
                shape = GradientDrawable.OVAL
                setColor(Color.parseColor("#11121A"))
                setStroke(dpToPx(3), Color.parseColor("#FD3A73"))
            }
        }

        val avatarInitial = TextView(this).apply {
            text = if (callerName.isNotBlank()) callerName.take(1).uppercase() else "S"
            textSize = 48f
            setTextColor(Color.WHITE)
            gravity = Gravity.CENTER
            typeface = android.graphics.Typeface.DEFAULT_BOLD
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            )
        }
        avatarContainer.addView(avatarInitial)
        root.addView(avatarContainer)

        // Caller Name
        val nameView = TextView(this).apply {
            text = callerName
            textSize = 28f
            setTextColor(Color.WHITE)
            gravity = Gravity.CENTER
            typeface = android.graphics.Typeface.DEFAULT_BOLD
            setPadding(0, dpToPx(20), 0, dpToPx(4))
        }
        root.addView(nameView)

        // Subtitle
        val subView = TextView(this).apply {
            text = "Incoming ${if (callType == "video") "Video 📹" else "Voice 📞"} Call..."
            textSize = 15f
            setTextColor(Color.parseColor("#94A3B8"))
            gravity = Gravity.CENTER
        }
        root.addView(subView)

        // Flexible Expanding Space
        root.addView(View(this).apply {
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                0,
                1.0f
            )
        })

        // Bottom Action Buttons Row (WhatsApp / iOS style circular buttons)
        val actionsRow = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            )
        }

        // Decline Button (Red Circle)
        val declineCol = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
        }
        val declineBtn = FrameLayout(this).apply {
            val size = dpToPx(74)
            layoutParams = LinearLayout.LayoutParams(size, size)
            background = GradientDrawable().apply {
                shape = GradientDrawable.OVAL
                setColor(Color.parseColor("#EF4444"))
                setStroke(dpToPx(2), Color.parseColor("#FCA5A5"))
            }
            setOnClickListener {
                debug("DECLINE_PRESSED", "OK", "callId=$callId")
                stopRingtoneAndVibration()
                CallConnectionManager.rejectCall()
                clearPendingCall()
                finish()
            }
        }
        val declineIcon = TextView(this).apply {
            text = "✕"
            textSize = 28f
            setTextColor(Color.WHITE)
            gravity = Gravity.CENTER
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            )
        }
        declineBtn.addView(declineIcon)
        val declineLabel = TextView(this).apply {
            text = "Decline"
            textSize = 13f
            setTextColor(Color.parseColor("#94A3B8"))
            gravity = Gravity.CENTER
            setPadding(0, dpToPx(8), 0, 0)
        }
        declineCol.addView(declineBtn)
        declineCol.addView(declineLabel)

        // Middle Spacing
        val buttonSpacer = View(this).apply {
            layoutParams = LinearLayout.LayoutParams(dpToPx(70), 1)
        }

        // Accept Button (Green Circle with Ringing Pulse)
        val acceptCol = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
        }
        val acceptBtn = FrameLayout(this).apply {
            val size = dpToPx(76)
            layoutParams = LinearLayout.LayoutParams(size, size)
            background = GradientDrawable(
                GradientDrawable.Orientation.TL_BR,
                intArrayOf(Color.parseColor("#00E5FF"), Color.parseColor("#22C55E"))
            ).apply {
                shape = GradientDrawable.OVAL
            }
            setOnClickListener {
                debug("ANSWER_PRESSED", "OK", "callId=$callId")
                stopRingtoneAndVibration()
                CallConnectionManager.answerCall()
                handoffToReactNative(callId, callerName, callType)
            }
        }
        val acceptIcon = TextView(this).apply {
            text = "✓"
            textSize = 30f
            setTextColor(Color.WHITE)
            gravity = Gravity.CENTER
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            )
        }
        acceptBtn.addView(acceptIcon)

        val pulse = ScaleAnimation(
            1.0f, 1.15f, 1.0f, 1.15f,
            Animation.RELATIVE_TO_SELF, 0.5f,
            Animation.RELATIVE_TO_SELF, 0.5f
        ).apply {
            duration = 500
            repeatCount = Animation.INFINITE
            repeatMode = Animation.REVERSE
        }
        acceptBtn.startAnimation(pulse)

        val acceptLabel = TextView(this).apply {
            text = "Accept"
            textSize = 13f
            setTextColor(Color.parseColor("#22C55E"))
            gravity = Gravity.CENTER
            typeface = android.graphics.Typeface.DEFAULT_BOLD
            setPadding(0, dpToPx(8), 0, 0)
        }
        acceptCol.addView(acceptBtn)
        acceptCol.addView(acceptLabel)

        actionsRow.addView(declineCol)
        actionsRow.addView(buttonSpacer)
        actionsRow.addView(acceptCol)

        root.addView(actionsRow)
        setContentView(root)
    }

    private fun startRingtoneAndVibration() {
        try {
            val ringtoneUri = android.media.RingtoneManager.getDefaultUri(android.media.RingtoneManager.TYPE_RINGTONE)
            ringtoneInstance = android.media.RingtoneManager.getRingtone(applicationContext, ringtoneUri)
            ringtoneInstance?.play()

            vibratorInstance = getSystemService(Context.VIBRATOR_SERVICE) as? android.os.Vibrator
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                vibratorInstance?.vibrate(android.os.VibrationEffect.createWaveform(longArrayOf(0, 1000, 1000), 0))
            } else {
                vibratorInstance?.vibrate(longArrayOf(0, 1000, 1000), 0)
            }
            debug("RINGTONE_STARTED", "OK")
        } catch (e: Exception) {
            debug("RINGTONE_STARTED", "FAIL", e.message ?: "")
        }
    }

    private fun stopRingtoneAndVibration() {
        try {
            ringtoneInstance?.stop()
            ringtoneInstance = null
            vibratorInstance?.cancel()
            vibratorInstance = null
            debug("RINGTONE_STOPPED", "OK")
        } catch (e: Exception) {
            debug("RINGTONE_STOPPED", "FAIL", e.message ?: "")
        }
    }

    private fun handoffToReactNative(callId: String, callerName: String, callType: String) {
        stopRingtoneAndVibration()
        
        // Tell React Native to auto-accept the call immediately!
        TelecomModule.emitAcceptEvent()

        val intent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_REORDER_TO_FRONT
            putExtra("SYNKING_INCOMING_CALL", true)
            putExtra("callId", callId)
            putExtra("callerName", callerName)
            putExtra("callType", callType)
        }
        startActivity(intent)
        debug("REACT_NATIVE_HANDOFF", "OK", "callId=$callId")
        finish()
    }

    private fun clearPendingCall() {
        stopRingtoneAndVibration()
        getSharedPreferences("synking_call_state", MODE_PRIVATE)
            .edit()
            .clear()
            .apply()
    }

    override fun onPause() {
        super.onPause()
        stopRingtoneAndVibration()
    }

    override fun onDestroy() {
        super.onDestroy()
        stopRingtoneAndVibration()
        try {
            closeReceiver?.let { unregisterReceiver(it) }
        } catch (_: Exception) {}
        try {
            wakeLock?.let { if (it.isHeld) it.release() }
        } catch (_: Exception) {}
        currentActivity = null
        debug("CALL_ACTIVITY_DESTROYED", "INFO")
    }
}