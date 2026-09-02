package com.synking

import android.app.KeyguardManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import android.media.AudioAttributes
import android.media.Ringtone
import android.media.RingtoneManager
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import android.os.VibrationEffect
import android.os.Vibrator
import android.util.Log
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.view.WindowManager
import android.view.animation.Animation
import android.view.animation.ScaleAnimation
import android.app.Activity
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.TextView
import com.facebook.react.ReactApplication
import com.oney.WebRTCModule.WebRTCView

class IncomingCallActivity : Activity() {

    companion object {
        var activeRingtone: Ringtone? = null
        var activeVibrator: Vibrator? = null

        fun stopRingtoneGlobally(context: Context? = null) {
            try {
                activeRingtone?.stop()
                activeRingtone = null
            } catch (e: Exception) {}
            try {
                activeVibrator?.cancel()
                activeVibrator = null
            } catch (e: Exception) {}
            try {
                val ctx = context ?: TelecomModule.globalReactContext
                ctx?.let {
                    val v = it.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
                    v?.cancel()
                }
            } catch (e: Exception) {}
        }
    }

    var callId: String = ""
    var callerId: String = ""
    var callerName: String = ""
    var callType: String = ""

    // UI Elements
    private var callerInfoLayout: LinearLayout? = null
    private var timerTextView: TextView? = null
    private var subtitleView: TextView? = null
    private var incomingActionsRow: LinearLayout? = null
    private var activeActionsRow: LinearLayout? = null

    private var isMuted = false
    private var isSpeakerOn = false
    private lateinit var uiLayer: LinearLayout

    // WebRTC Video Containers
    private var remoteVideoContainer: FrameLayout? = null
    private var localVideoContainer: FrameLayout? = null
    private var remoteWebRTCView: WebRTCView? = null
    private var localWebRTCView: WebRTCView? = null

    private var callStartTime = 0L
    private var jsBridgeConfirmed = false
    private val bridgeTimeoutHandler = Handler(Looper.getMainLooper())
    private var debugTextView: TextView? = null
    private val timerHandler = Handler(Looper.getMainLooper())
    private val timerRunnable = object : Runnable {
        override fun run() {
            val duration = (SystemClock.elapsedRealtime() - callStartTime) / 1000
            val min = duration / 60
            val sec = duration % 60
            timerTextView?.text = String.format("%02d:%02d", min, sec)
            timerHandler.postDelayed(this, 1000)
        }
    }

    private val callEndedReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            Log.d("SYNKING_DEBUG", "[UI] CALL_ENDED_RECEIVER triggered by ${intent?.action}")
            stopRingtoneAndVibration()
            runOnUiThread {
                try {
                    finishAndRemoveTask()
                } catch (e: Exception) {}
                finish()
            }
        }
    }

    private val videoConnectedReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            if (callType == "video") {
                subtitleView?.visibility = View.GONE
                timerTextView?.visibility = View.VISIBLE
                if (callStartTime == 0L) {
                    callStartTime = SystemClock.elapsedRealtime()
                    timerHandler.post(timerRunnable)
                }
                Log.d("SYNKING_TELECOM", "[UI] VIDEO_CONNECTED: Staying in native IncomingCallActivity for lock screen")
            }
        }
    }

    private var callWakeLock: android.os.PowerManager.WakeLock? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        setTheme(R.style.AppTheme)
        super.onCreate(savedInstanceState)

        TelecomModule.incomingActivityInstance = this

        // Hold CPU WakeLock so Android OS/Realme UI Freezer does NOT freeze the process
        try {
            val pm = getSystemService(Context.POWER_SERVICE) as android.os.PowerManager
            callWakeLock = pm.newWakeLock(android.os.PowerManager.PARTIAL_WAKE_LOCK, "synking:active_call_cpu_wakelock")
            callWakeLock?.acquire(10 * 60 * 1000L)
            Log.d("SYNKING_DEBUG", "[WAKELOCK] Acquired active call WakeLock to prevent OS freeze")
        } catch (e: Exception) {
            Log.w("SYNKING_DEBUG", "[WAKELOCK] Warning: ${e.message}")
        }

        // Boot JS in background if not running (MainApplication already calls loadReactNative)
        try {
            val app = application as? MainApplication
            app?.reactHost?.start()
        } catch (e: Throwable) {
            Log.w("SYNKING_CALL", "Background ReactHost init note: ${e.message}")
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true)
            setTurnScreenOn(true)
        } else {
            window.addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
                WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON or
                WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
            )
        }

        val cancelFilter = IntentFilter().apply {
            addAction("com.synking.CALL_ENDED_FROM_JS")
            addAction("com.synking.CLOSE_CALL_SCREEN")
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(callEndedReceiver, cancelFilter, Context.RECEIVER_NOT_EXPORTED)
            registerReceiver(videoConnectedReceiver, IntentFilter("com.synking.VIDEO_CALL_CONNECTED_FROM_JS"), Context.RECEIVER_NOT_EXPORTED)
        } else {
            registerReceiver(callEndedReceiver, cancelFilter)
            registerReceiver(videoConnectedReceiver, IntentFilter("com.synking.VIDEO_CALL_CONNECTED_FROM_JS"))
        }

        callId = intent.getStringExtra("callId") ?: ""
        callerId = intent.getStringExtra("callerId") ?: ""
        callerName = intent.getStringExtra("callerName") ?: "Unknown"
        callType = intent.getStringExtra("callType") ?: "audio"

        playRingtoneAndVibrate()
        buildUI()

        // Auto-accept if launched from notification Accept button
        val autoAccept = intent.getBooleanExtra("autoAccept", false)
        if (autoAccept) {
            Handler(Looper.getMainLooper()).postDelayed({
                handleAccept()
            }, 300)
        }
    }

    fun attachRemoteVideo(streamUrl: String) {
        val ctx = TelecomModule.globalReactContext ?: return
        if (remoteWebRTCView == null) {
            remoteWebRTCView = WebRTCView(ctx).apply {
                layoutParams = FrameLayout.LayoutParams(
                    FrameLayout.LayoutParams.MATCH_PARENT,
                    FrameLayout.LayoutParams.MATCH_PARENT
                )
            }
            remoteVideoContainer?.addView(remoteWebRTCView)
        }

        try {
            val methodFit = remoteWebRTCView!!.javaClass.getDeclaredMethod("setObjectFit", String::class.java)
            methodFit.isAccessible = true
            methodFit.invoke(remoteWebRTCView, "cover")
        } catch (e: Exception) {}

        try {
            val method = remoteWebRTCView!!.javaClass.getDeclaredMethod("setStreamURL", String::class.java)
            method.isAccessible = true
            method.invoke(remoteWebRTCView, streamUrl)
        } catch (e: Exception) {
            e.printStackTrace()
        }

        uiLayer.setBackgroundColor(Color.TRANSPARENT)
        callerInfoLayout?.visibility = View.GONE
        remoteVideoContainer?.visibility = View.VISIBLE

        activeActionsRow?.bringToFront()
        localVideoContainer?.bringToFront()
        timerTextView?.bringToFront()
    }

    fun attachLocalVideo(streamUrl: String) {
        val ctx = TelecomModule.globalReactContext ?: return
        if (localWebRTCView == null) {
            localWebRTCView = WebRTCView(ctx).apply {
                layoutParams = FrameLayout.LayoutParams(
                    FrameLayout.LayoutParams.MATCH_PARENT,
                    FrameLayout.LayoutParams.MATCH_PARENT
                )
                setMirror(true)
            }
            localVideoContainer?.addView(localWebRTCView)
        }

        try {
            val methodFit = localWebRTCView!!.javaClass.getDeclaredMethod("setObjectFit", String::class.java)
            methodFit.isAccessible = true
            methodFit.invoke(localWebRTCView, "cover")
        } catch (e: Exception) {}

        try {
            val method = localWebRTCView!!.javaClass.getDeclaredMethod("setStreamURL", String::class.java)
            method.isAccessible = true
            method.invoke(localWebRTCView, streamUrl)
        } catch (e: Exception) {
            e.printStackTrace()
        }

        localVideoContainer?.visibility = View.VISIBLE
        localVideoContainer?.bringToFront()
    }

    fun updateDebugStage(stage: String, status: String) {
        runOnUiThread {
            try {
                debugTextView?.let { tv ->
                    tv.text = "${tv.text}\n• $stage: $status"
                }
            } catch (e: Exception) {}
        }
    }

    fun onJsBridgeConfirmed() {
        jsBridgeConfirmed = true
        updateDebugStage("RN BRIDGED", "CONFIRMED ✅")
        bridgeTimeoutHandler.removeCallbacksAndMessages(null)
        PendingCallStore.clear(this)
        CallState.clear(this, callId)
        Log.d("SYNKING_DEBUG", "[UI] onJsBridgeConfirmed: JS bridge active and confirmed")
    }

    override fun onDestroy() {
        super.onDestroy()

        TelecomModule.incomingActivityInstance = null
        bridgeTimeoutHandler.removeCallbacksAndMessages(null)
        CallState.clear(this, callId)

        stopRingtoneAndVibration()
        timerHandler.removeCallbacks(timerRunnable)
        try {
            if (callWakeLock?.isHeld == true) {
                callWakeLock?.release()
                Log.d("SYNKING_DEBUG", "[WAKELOCK] Released active call WakeLock")
            }
        } catch (e: Exception) {}
        try {
            unregisterReceiver(callEndedReceiver)
            unregisterReceiver(videoConnectedReceiver)
        } catch (e: Exception) {}
    }

    private fun buildUI() {
        val root = FrameLayout(this)

        remoteVideoContainer = FrameLayout(this).apply {
            layoutParams = FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT)
            visibility = View.GONE
            setBackgroundColor(Color.parseColor("#05060A"))
        }
        root.addView(remoteVideoContainer)

        // 🌌 Deep Midnight OLED Canvas
        uiLayer = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER_HORIZONTAL
            setPadding(dpToPx(24), dpToPx(64), dpToPx(24), dpToPx(56))
            background = GradientDrawable(
                GradientDrawable.Orientation.TOP_BOTTOM,
                intArrayOf(Color.parseColor("#060813"), Color.parseColor("#0B1120"))
            )
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.MATCH_PARENT
            )
        }

        // Caller Info Container
        callerInfoLayout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER_HORIZONTAL
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            )
        }

        // 🔒 Frosted Glass Header Security Pill
        val brandHeader = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER
            setPadding(dpToPx(20), dpToPx(8), dpToPx(20), dpToPx(8))
            background = GradientDrawable().apply {
                setColor(Color.parseColor("#1F1E293B"))
                cornerRadius = dpToPx(30).toFloat()
                setStroke(dpToPx(1), Color.parseColor("#4D38BDF8"))
            }
        }
        val brandText = TextView(this).apply {
            text = "\uD83D\uDD12 End-to-End Encrypted HD"
            textSize = 12f
            setTextColor(Color.parseColor("#E2E8F0"))
            typeface = android.graphics.Typeface.DEFAULT_BOLD
            letterSpacing = 0.05f
        }
        brandHeader.addView(brandText)
        callerInfoLayout?.addView(brandHeader)

        callerInfoLayout?.addView(View(this).apply { layoutParams = LinearLayout.LayoutParams(1, dpToPx(36)) })

        // 🪞 Holographic Iridescent Avatar Container
        val avatarContainer = FrameLayout(this).apply {
            val size = dpToPx(148)
            layoutParams = LinearLayout.LayoutParams(size, size).apply { gravity = Gravity.CENTER_HORIZONTAL }
            background = GradientDrawable(
                GradientDrawable.Orientation.TL_BR,
                intArrayOf(Color.parseColor("#A855F7"), Color.parseColor("#38BDF8"))
            ).apply { shape = GradientDrawable.OVAL }
            setPadding(dpToPx(3), dpToPx(3), dpToPx(3), dpToPx(3))
        }

        val avatarInner = FrameLayout(this).apply {
            layoutParams = FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT)
            background = GradientDrawable().apply { shape = GradientDrawable.OVAL; setColor(Color.parseColor("#0F172A")) }
        }

        val avatarInitial = TextView(this).apply {
            text = if (callerName.isNotBlank()) callerName.take(1).uppercase() else "S"
            textSize = 58f
            setTextColor(Color.WHITE)
            gravity = Gravity.CENTER
            typeface = android.graphics.Typeface.DEFAULT_BOLD
            layoutParams = FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT)
        }
        val avatarImageView = ImageView(this).apply {
            layoutParams = FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT)
            scaleType = ImageView.ScaleType.CENTER_CROP
            visibility = View.GONE
            clipToOutline = true
            outlineProvider = object : android.view.ViewOutlineProvider() {
                override fun getOutline(view: View, outline: android.graphics.Outline) {
                    outline.setOval(0, 0, view.width, view.height)
                }
            }
        }
        avatarInner.addView(avatarImageView)

        val photoUrl = intent.getStringExtra("callerPhoto")
        if (!photoUrl.isNullOrBlank()) {
            java.util.concurrent.Executors.newSingleThreadExecutor().execute {
                try {
                    val url = java.net.URL(photoUrl)
                    val bmp = android.graphics.BitmapFactory.decodeStream(url.openConnection().getInputStream())
                    runOnUiThread {
                        if (bmp != null) {
                            avatarImageView.setImageBitmap(bmp)
                            avatarImageView.visibility = View.VISIBLE
                            avatarInitial.visibility = View.GONE
                        }
                    }
                } catch (e: Exception) {
                    Log.w("SYNKING_DEBUG", "Photo load note: ${e.message}")
                }
            }
        }

        avatarInner.addView(avatarInitial)
        avatarContainer.addView(avatarInner)
        callerInfoLayout?.addView(avatarContainer)

        val nameView = TextView(this).apply {
            text = callerName
            textSize = 30f
            setTextColor(Color.WHITE)
            gravity = Gravity.CENTER
            typeface = android.graphics.Typeface.DEFAULT_BOLD
            setPadding(0, dpToPx(24), 0, dpToPx(6))
        }
        callerInfoLayout?.addView(nameView)

        subtitleView = TextView(this).apply {
            text = "Incoming Encrypted ${if (callType == "video") "HD Video Call" else "HD Voice Call"}"
            textSize = 15f
            setTextColor(Color.parseColor("#94A3B8"))
            gravity = Gravity.CENTER
        }
        callerInfoLayout?.addView(subtitleView!!)

        uiLayer.addView(callerInfoLayout)

        timerTextView = TextView(this).apply {
            text = "00:00"
            textSize = 22f
            setTextColor(Color.parseColor("#10B981"))
            gravity = Gravity.CENTER
            typeface = android.graphics.Typeface.MONOSPACE
            visibility = View.GONE
            setPadding(0, dpToPx(16), 0, dpToPx(8))
        }
        uiLayer.addView(timerTextView!!)

        // Flexible spacer to push buttons to bottom
        uiLayer.addView(View(this).apply { layoutParams = LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, 0, 1.0f) })

        // INCOMING ACTIONS ROW
        incomingActionsRow = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER
            layoutParams = LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT)
        }

        // 🔴 Deep Crimson Frosted Glass Decline Pod
        val declineCol = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL; gravity = Gravity.CENTER }
        val declineBtn = FrameLayout(this).apply {
            val size = dpToPx(80)
            layoutParams = LinearLayout.LayoutParams(size, size)
            background = GradientDrawable().apply {
                shape = GradientDrawable.OVAL
                setColor(Color.parseColor("#1F1315"))
                setStroke(dpToPx(2), Color.parseColor("#EF4444"))
            }
            setOnClickListener {
                dismissNotificationBanner()
                stopRingtoneAndVibration()
                CallConnectionManager.rejectCall()
                PendingCallStore.clear(this@IncomingCallActivity)
                CallState.clear(this@IncomingCallActivity, callId)

                val finalCallId = if (callId.isNotEmpty()) callId else (intent.getStringExtra("callId") ?: "")
                val finalCallerId = if (callerId.isNotEmpty()) callerId else (intent.getStringExtra("callerId") ?: "")

                // 🚀 Direct Native HTTP Signal to Server (Immediate 0ms Laptop Ring Cancel)
                NativeCallSignaling.sendDeclineNatively(finalCallId, finalCallerId)

                TelecomModule.emitDeclineEvent(finalCallId)

                try {
                    finishAndRemoveTask()
                } catch (e: Exception) {}
                finish()
            }
        }
        declineBtn.addView(TextView(this).apply { text = "✕"; textSize = 28f; setTextColor(Color.parseColor("#EF4444")); gravity = Gravity.CENTER })
        declineCol.addView(declineBtn)
        declineCol.addView(TextView(this).apply { text = "Decline"; textSize = 13f; setTextColor(Color.parseColor("#94A3B8")); setPadding(0, dpToPx(10), 0, 0) })

        // 🟢 Luxury Emerald Gradient Accept Pod
        val acceptCol = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL; gravity = Gravity.CENTER }
        val acceptBtn = FrameLayout(this).apply {
            val size = dpToPx(80)
            layoutParams = LinearLayout.LayoutParams(size, size)
            background = GradientDrawable(
                GradientDrawable.Orientation.TL_BR,
                intArrayOf(Color.parseColor("#10B981"), Color.parseColor("#059669"))
            ).apply { shape = GradientDrawable.OVAL }
            setOnClickListener {
                dismissNotificationBanner()
                handleAccept()
            }
        }
        acceptBtn.addView(TextView(this).apply { text = "✔"; textSize = 28f; setTextColor(Color.WHITE); gravity = Gravity.CENTER })
        val acceptPulse = ScaleAnimation(1.0f, 1.10f, 1.0f, 1.10f, Animation.RELATIVE_TO_SELF, 0.5f, Animation.RELATIVE_TO_SELF, 0.5f).apply {
            duration = 600; repeatCount = Animation.INFINITE; repeatMode = Animation.REVERSE
        }
        acceptBtn.startAnimation(acceptPulse)
        acceptCol.addView(acceptBtn)
        acceptCol.addView(TextView(this).apply { text = "Accept"; textSize = 13f; setTextColor(Color.parseColor("#10B981")); typeface = android.graphics.Typeface.DEFAULT_BOLD; setPadding(0, dpToPx(10), 0, 0) })

        incomingActionsRow?.addView(declineCol)
        incomingActionsRow?.addView(View(this).apply { layoutParams = LinearLayout.LayoutParams(dpToPx(72), 1) })
        incomingActionsRow?.addView(acceptCol)
        uiLayer.addView(incomingActionsRow!!)

        // ACTIVE ACTIONS ROW (4-Button Ultra-Luxury Control Dock)
        activeActionsRow = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER
            layoutParams = LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT)
            visibility = View.GONE
        }

        val muteBtn = createControlButton("\uD83C\uDF99\uFE0F", "Mute") { btn, label ->
            isMuted = !isMuted
            val bg = btn.background as GradientDrawable
            bg.setColor(Color.parseColor(if (isMuted) "#EF4444" else "#1E293B"))
            label.text = if (isMuted) "Unmute" else "Mute"
            TelecomModule.emitMuteToggled(isMuted)
        }

        val speakerBtn = createControlButton("\uD83D\uDD0A", "Speaker") { btn, label ->
            isSpeakerOn = !isSpeakerOn
            val bg = btn.background as GradientDrawable
            bg.setColor(Color.parseColor(if (isSpeakerOn) "#38BDF8" else "#1E293B"))
            label.text = if (isSpeakerOn) "Speaker Off" else "Speaker On"
            TelecomModule.emitSpeakerToggled(isSpeakerOn)
        }

        var isCameraActive = callType == "video"
        val cameraBtn = createControlButton("\uD83D\uDCF9", if (isCameraActive) "Camera Off" else "Camera On") { btn, label ->
            isCameraActive = !isCameraActive
            val bg = btn.background as GradientDrawable
            bg.setColor(Color.parseColor(if (isCameraActive) "#00E5FF" else "#1E293B"))
            label.text = if (isCameraActive) "Camera Off" else "Camera On"
            TelecomModule.emitVideoToggled(isCameraActive)
        }

        val endBtnCol = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL; gravity = Gravity.CENTER }
        val endBtn = FrameLayout(this).apply {
            val size = dpToPx(72)
            layoutParams = LinearLayout.LayoutParams(size, size)
            background = GradientDrawable().apply { shape = GradientDrawable.OVAL; setColor(Color.parseColor("#EF4444")) }
            setOnClickListener {
                dismissNotificationBanner()
                val finalCallId = if (callId.isNotEmpty()) callId else (intent.getStringExtra("callId") ?: "")
                val finalCallerId = if (callerId.isNotEmpty()) callerId else (intent.getStringExtra("callerId") ?: "")

                // 🚀 Direct Native HTTP Signal to Server
                NativeCallSignaling.sendEndCallNatively(finalCallId, finalCallerId)

                TelecomModule.emitEndCallEvent()
                CallConnectionManager.endCall()
                try {
                    finishAndRemoveTask()
                } catch (e: Exception) {}
                finish()
            }
        }
        endBtn.addView(TextView(this).apply { text = "\uD83D\uDCDE"; textSize = 28f; setTextColor(Color.WHITE); gravity = Gravity.CENTER; rotation = 135f })
        endBtnCol.addView(endBtn)
        endBtnCol.addView(TextView(this).apply { text = "End"; textSize = 13f; setTextColor(Color.parseColor("#EF4444")); setPadding(0, dpToPx(8), 0, 0) })

        activeActionsRow?.addView(muteBtn)
        activeActionsRow?.addView(View(this).apply { layoutParams = LinearLayout.LayoutParams(dpToPx(16), 1) })
        activeActionsRow?.addView(speakerBtn)
        activeActionsRow?.addView(View(this).apply { layoutParams = LinearLayout.LayoutParams(dpToPx(16), 1) })
        activeActionsRow?.addView(cameraBtn)
        activeActionsRow?.addView(View(this).apply { layoutParams = LinearLayout.LayoutParams(dpToPx(16), 1) })
        activeActionsRow?.addView(endBtnCol)

        uiLayer.addView(activeActionsRow!!)
        root.addView(uiLayer)

        localVideoContainer = FrameLayout(this).apply {
            layoutParams = FrameLayout.LayoutParams(dpToPx(110), dpToPx(160)).apply {
                gravity = Gravity.BOTTOM or Gravity.END
                setMargins(0, 0, dpToPx(24), dpToPx(130))
            }
            visibility = View.GONE
            setBackgroundColor(Color.parseColor("#11121A"))
            elevation = 20f
        }
        root.addView(localVideoContainer)

        setContentView(root)
    }

    private fun dismissNotificationBanner() {
        try {
            val nm = getSystemService(Context.NOTIFICATION_SERVICE) as? android.app.NotificationManager
            nm?.cancel(1001)
            nm?.cancel(1002)
            nm?.cancel(1003)
            nm?.cancelAll()
        } catch (e: Exception) {}
    }

    private fun createControlButton(iconText: String, labelText: String, onClick: (FrameLayout, TextView) -> Unit): LinearLayout {
        val col = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL; gravity = Gravity.CENTER }
        val btn = FrameLayout(this).apply {
            val size = dpToPx(60)
            layoutParams = LinearLayout.LayoutParams(size, size)
            background = GradientDrawable().apply {
                shape = GradientDrawable.OVAL
                setColor(Color.parseColor("#1E293B"))
                setStroke(dpToPx(1), Color.parseColor("#334155"))
            }
        }
        btn.addView(TextView(this).apply { text = iconText; textSize = 22f; setTextColor(Color.WHITE); gravity = Gravity.CENTER })
        val label = TextView(this).apply { text = labelText; textSize = 12f; setTextColor(Color.parseColor("#94A3B8")); setPadding(0, dpToPx(8), 0, 0) }
        btn.setOnClickListener { onClick(btn, label) }
        col.addView(btn)
        col.addView(label)
        return col
    }

    private fun handleAccept() {
        val finalCallId = if (callId.isNotEmpty()) callId else (intent.getStringExtra("callId") ?: "")
        val finalCallerId = if (callerId.isNotEmpty()) callerId else (intent.getStringExtra("callerId") ?: "")
        val finalCallerName = if (callerName.isNotEmpty()) callerName else (intent.getStringExtra("callerName") ?: "Unknown")
        val finalCallType = if (callType.isNotEmpty()) callType else (intent.getStringExtra("callType") ?: "audio")
        val finalCallerPhoto = intent.getStringExtra("callerPhoto")

        Log.d("SYNKING_DEBUG", "[UI] ACCEPT_BUTTON_TAPPED: callId=$finalCallId callerId=$finalCallerId callerName=$finalCallerName type=$finalCallType")
        dismissNotificationBanner()
        stopRingtoneAndVibration()
        CallConnectionManager.answerCall()

        val call = PendingCall(
            callId = finalCallId,
            callerId = finalCallerId,
            callerName = finalCallerName,
            callerPhoto = finalCallerPhoto,
            callType = finalCallType
        )

        // 🚀 1. DIRECT NATIVE HTTP SIGNAL (Immediate 0ms Laptop Handshake!)
        NativeCallSignaling.sendAcceptNatively(finalCallId, finalCallerId, finalCallType)

        // 🚀 2. React Native Event Bridge
        TelecomModule.emitAcceptEvent(call)

        // 🚀 3. Save pending call for JS cold-boot recovery
        PendingCallStore.save(this, call)

        // 🚀 4. Seamless Handoff to React Native Live Calling Screen (MainActivity)
        try {
            val mainIntent = Intent(this, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
                putExtra("SYNKING_INCOMING_CALL", true)
                putExtra("callId", finalCallId)
                putExtra("callerId", finalCallerId)
                putExtra("callerName", finalCallerName)
                putExtra("callType", finalCallType)
                putExtra("callerPhoto", finalCallerPhoto)
                putExtra("AUTO_ACCEPT", true)
            }
            startActivity(mainIntent)
        } catch (e: Exception) {
            Log.w("SYNKING_DEBUG", "MainActivity handoff note: ${e.message}")
        }

        try {
            finishAndRemoveTask()
        } catch (e: Exception) {}
        finish()
    }

    private fun dpToPx(dp: Int): Int = TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, dp.toFloat(), resources.displayMetrics).toInt()

    private fun playRingtoneAndVibrate() {
        try {
            Log.d("SYNKING_DEBUG", "[AUDIO] START_RINGTONE_AND_VIBRATION: Initiating audio & haptics")
            val uri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE)
            activeRingtone = RingtoneManager.getRingtone(applicationContext, uri)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                activeRingtone?.audioAttributes = AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build()
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                activeRingtone?.isLooping = true
            }
            activeRingtone?.play()

            activeVibrator = getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                activeVibrator?.vibrate(VibrationEffect.createWaveform(longArrayOf(0, 1000, 1000), 0))
            } else {
                @Suppress("DEPRECATION")
                activeVibrator?.vibrate(longArrayOf(0, 1000, 1000), 0)
            }
            Log.d("SYNKING_DEBUG", "[AUDIO] RINGTONE_AND_VIBRATION: Active and playing")
        } catch (e: Exception) {
            Log.e("SYNKING_DEBUG", "[AUDIO] RINGTONE_ERROR: ${e.message}")
        }
    }

    private fun stopRingtoneAndVibration() {
        Log.d("SYNKING_DEBUG", "[AUDIO] STOP_RINGTONE_AND_VIBRATION: Cancelling all audio and vibration globally")
        stopRingtoneGlobally()
    }
}
