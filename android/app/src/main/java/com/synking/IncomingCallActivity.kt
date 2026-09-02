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

        fun stopRingtoneGlobally() {
            try {
                activeRingtone?.stop()
                activeRingtone = null
            } catch (e: Exception) {}
            try {
                activeVibrator?.cancel()
                activeVibrator = null
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

    override fun onCreate(savedInstanceState: Bundle?) {
        setTheme(R.style.AppTheme)
        super.onCreate(savedInstanceState)

        TelecomModule.incomingActivityInstance = this

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
            remoteWebRTCView = WebRTCView(ctx)
            remoteVideoContainer?.addView(remoteWebRTCView)
        }

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
            localWebRTCView = WebRTCView(ctx)
            localWebRTCView?.setMirror(true)
            localVideoContainer?.addView(localWebRTCView)
        }

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

    override fun onDestroy() {
        super.onDestroy()

        TelecomModule.incomingActivityInstance = null

        stopRingtoneAndVibration()
        timerHandler.removeCallbacks(timerRunnable)
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

        uiLayer = LinearLayout(this).apply {
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

        // Caller Info Container (easily hidden during video call)
        callerInfoLayout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER_HORIZONTAL
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            )
        }

        // Brand Header Pill
        val brandHeader = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER
            setPadding(dpToPx(20), dpToPx(8), dpToPx(20), dpToPx(8))
            background = GradientDrawable(
                GradientDrawable.Orientation.LEFT_RIGHT,
                intArrayOf(Color.parseColor("#33FD3A73"), Color.parseColor("#339D00FF"))
            ).apply {
                cornerRadius = dpToPx(30).toFloat()
                setStroke(dpToPx(1), Color.parseColor("#80FD3A73"))
            }
        }
        val brandText = TextView(this).apply {
            text = "SECURE P2P WEBRTC"
            textSize = 11f
            setTextColor(Color.WHITE)
            typeface = android.graphics.Typeface.DEFAULT_BOLD
            letterSpacing = 0.1f
        }
        brandHeader.addView(brandText)
        callerInfoLayout?.addView(brandHeader)

        callerInfoLayout?.addView(View(this).apply { layoutParams = LinearLayout.LayoutParams(1, dpToPx(36)) })

        val avatarContainer = FrameLayout(this).apply {
            val size = dpToPx(140)
            layoutParams = LinearLayout.LayoutParams(size, size).apply { gravity = Gravity.CENTER_HORIZONTAL }
            background = GradientDrawable(
                GradientDrawable.Orientation.TR_BL,
                intArrayOf(Color.parseColor("#FD3A73"), Color.parseColor("#00E5FF"))
            ).apply { shape = GradientDrawable.OVAL }
            setPadding(dpToPx(4), dpToPx(4), dpToPx(4), dpToPx(4))
        }

        val avatarInner = FrameLayout(this).apply {
            layoutParams = FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT)
            background = GradientDrawable().apply { shape = GradientDrawable.OVAL; setColor(Color.parseColor("#11121A")) }
        }

        val avatarInitial = TextView(this).apply {
            text = if (callerName.isNotBlank()) callerName.take(1).uppercase() else "S"
            textSize = 56f
            setTextColor(Color.WHITE)
            gravity = Gravity.CENTER
            typeface = android.graphics.Typeface.DEFAULT_BOLD
            layoutParams = FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT)
        }
        avatarInner.addView(avatarInitial)
        avatarContainer.addView(avatarInner)
        callerInfoLayout?.addView(avatarContainer)

        val nameView = TextView(this).apply {
            text = callerName
            textSize = 32f
            setTextColor(Color.WHITE)
            gravity = Gravity.CENTER
            typeface = android.graphics.Typeface.DEFAULT_BOLD
            setPadding(0, dpToPx(28), 0, dpToPx(8))
        }
        callerInfoLayout?.addView(nameView)

        subtitleView = TextView(this).apply {
            text = "Incoming ${if (callType == "video") "Video Call..." else "Voice Call..."}"
            textSize = 16f
            setTextColor(Color.parseColor("#94A3B8"))
            gravity = Gravity.CENTER
        }
        callerInfoLayout?.addView(subtitleView!!)

        uiLayer.addView(callerInfoLayout)

        timerTextView = TextView(this).apply {
            text = "00:00"
            textSize = 20f
            setTextColor(Color.parseColor("#22C55E"))
            gravity = Gravity.CENTER
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

        val declineCol = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL; gravity = Gravity.CENTER }
        val declineBtn = FrameLayout(this).apply {
            val size = dpToPx(76)
            layoutParams = LinearLayout.LayoutParams(size, size)
            background = GradientDrawable().apply { shape = GradientDrawable.OVAL; setColor(Color.parseColor("#1E1E28")) }
            setOnClickListener {
                stopRingtoneAndVibration()
                CallConnectionManager.rejectCall()
                try {
                    finishAndRemoveTask()
                } catch (e: Exception) {}
                finish()
            }
        }
        declineBtn.addView(TextView(this).apply { text = "\u2715"; textSize = 30f; setTextColor(Color.parseColor("#EF4444")); gravity = Gravity.CENTER })
        declineCol.addView(declineBtn)
        declineCol.addView(TextView(this).apply { text = "Decline"; textSize = 14f; setTextColor(Color.parseColor("#94A3B8")); setPadding(0, dpToPx(12), 0, 0) })

        val acceptCol = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL; gravity = Gravity.CENTER }
        val acceptBtn = FrameLayout(this).apply {
            val size = dpToPx(76)
            layoutParams = LinearLayout.LayoutParams(size, size)
            background = GradientDrawable(GradientDrawable.Orientation.TL_BR, intArrayOf(Color.parseColor("#00E5FF"), Color.parseColor("#22C55E"))).apply { shape = GradientDrawable.OVAL }
            setOnClickListener {
                handleAccept()
            }
        }
        acceptBtn.addView(TextView(this).apply { text = "\uD83D\uDCDE"; textSize = 32f; setTextColor(Color.WHITE); gravity = Gravity.CENTER })
        val acceptPulse = ScaleAnimation(1.0f, 1.15f, 1.0f, 1.15f, Animation.RELATIVE_TO_SELF, 0.5f, Animation.RELATIVE_TO_SELF, 0.5f).apply {
            duration = 500; repeatCount = Animation.INFINITE; repeatMode = Animation.REVERSE
        }
        acceptBtn.startAnimation(acceptPulse)
        acceptCol.addView(acceptBtn)
        acceptCol.addView(TextView(this).apply { text = "Accept"; textSize = 14f; setTextColor(Color.WHITE); typeface = android.graphics.Typeface.DEFAULT_BOLD; setPadding(0, dpToPx(12), 0, 0) })

        incomingActionsRow?.addView(declineCol)
        incomingActionsRow?.addView(View(this).apply { layoutParams = LinearLayout.LayoutParams(dpToPx(70), 1) })
        incomingActionsRow?.addView(acceptCol)
        uiLayer.addView(incomingActionsRow!!)

        // ACTIVE ACTIONS ROW
        activeActionsRow = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER
            layoutParams = LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT)
            visibility = View.GONE
        }

        val muteBtn = createControlButton("\uD83C\uDF99\uFE0F", "Mute") { btn, label ->
            isMuted = !isMuted
            val bg = btn.background as GradientDrawable
            bg.setColor(Color.parseColor(if (isMuted) "#EF4444" else "#1E1E28"))
            label.text = if (isMuted) "Unmute" else "Mute"
            TelecomModule.emitMuteToggled(isMuted)
        }

        val speakerBtn = createControlButton("\uD83D\uDD0A", "Speaker") { btn, label ->
            isSpeakerOn = !isSpeakerOn
            val bg = btn.background as GradientDrawable
            bg.setColor(Color.parseColor(if (isSpeakerOn) "#3B82F6" else "#1E1E28"))
            label.text = if (isSpeakerOn) "Speaker Off" else "Speaker On"
            TelecomModule.emitSpeakerToggled(isSpeakerOn)
        }

        val endBtnCol = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL; gravity = Gravity.CENTER }
        val endBtn = FrameLayout(this).apply {
            val size = dpToPx(76)
            layoutParams = LinearLayout.LayoutParams(size, size)
            background = GradientDrawable().apply { shape = GradientDrawable.OVAL; setColor(Color.parseColor("#EF4444")) }
            setOnClickListener {
                TelecomModule.emitEndCallEvent()
                CallConnectionManager.endCall()
                try {
                    finishAndRemoveTask()
                } catch (e: Exception) {}
                finish()
            }
        }
        endBtn.addView(TextView(this).apply { text = "\uD83D\uDCDE"; textSize = 30f; setTextColor(Color.WHITE); gravity = Gravity.CENTER; rotation = 135f })
        endBtnCol.addView(endBtn)
        endBtnCol.addView(TextView(this).apply { text = "End"; textSize = 14f; setTextColor(Color.parseColor("#94A3B8")); setPadding(0, dpToPx(12), 0, 0) })

        activeActionsRow?.addView(muteBtn)
        activeActionsRow?.addView(View(this).apply { layoutParams = LinearLayout.LayoutParams(dpToPx(30), 1) })
        activeActionsRow?.addView(speakerBtn)
        activeActionsRow?.addView(View(this).apply { layoutParams = LinearLayout.LayoutParams(dpToPx(30), 1) })
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

    private fun createControlButton(iconText: String, labelText: String, onClick: (FrameLayout, TextView) -> Unit): LinearLayout {
        val col = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL; gravity = Gravity.CENTER }
        val btn = FrameLayout(this).apply {
            val size = dpToPx(60)
            layoutParams = LinearLayout.LayoutParams(size, size)
            background = GradientDrawable().apply { shape = GradientDrawable.OVAL; setColor(Color.parseColor("#1E1E28")) }
        }
        btn.addView(TextView(this).apply { text = iconText; textSize = 24f; setTextColor(Color.WHITE); gravity = Gravity.CENTER })
        val label = TextView(this).apply { text = labelText; textSize = 12f; setTextColor(Color.parseColor("#94A3B8")); setPadding(0, dpToPx(8), 0, 0) }
        btn.setOnClickListener { onClick(btn, label) }
        col.addView(btn)
        col.addView(label)
        return col
    }

    private fun handleAccept() {
        Log.d("SYNKING_DEBUG", "[UI] ACCEPT_BUTTON_TAPPED: callId=$callId callerId=$callerId callerName=$callerName type=$callType")
        stopRingtoneAndVibration()
        CallConnectionManager.answerCall()
        TelecomModule.emitAcceptEvent(callId, callerId, callerName, callType)

        if (callType == "video") {
            incomingActionsRow?.visibility = View.GONE
            activeActionsRow?.visibility = View.VISIBLE
            subtitleView?.text = "Connecting video..."
            subtitleView?.setTextColor(Color.parseColor("#3B82F6"))
            subtitleView?.visibility = View.VISIBLE
            timerTextView?.visibility = View.GONE
        } else {
            incomingActionsRow?.visibility = View.GONE
            activeActionsRow?.visibility = View.VISIBLE
            timerTextView?.visibility = View.VISIBLE
            callStartTime = SystemClock.elapsedRealtime()
            timerHandler.post(timerRunnable)
        }
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
