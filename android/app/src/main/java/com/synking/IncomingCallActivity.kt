package com.synking

import android.app.Activity
import android.app.KeyguardManager
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.os.PowerManager
import android.graphics.Color
import android.view.Gravity
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView

class IncomingCallActivity : Activity() {

    private var wakeLock: PowerManager.WakeLock? = null

    private fun debug(stage: String, status: String, details: String = "") {
        android.util.Log.d(
            "SYNKING_FCM",
            "[SYNKING_CALL_DEBUG] [$status] $stage $details"
        )
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        applyLockscreenFlags()
        acquireWakeLock()

        val callId =
            intent.getStringExtra("callId") ?: ""

        val callerName =
            intent.getStringExtra("callerName")
                ?: "Someone"

        val callType =
            intent.getStringExtra("callType")
                ?: "audio"

        debug(
            "CALL_ACTIVITY_CREATED",
            "OK",
            "callId=$callId caller=$callerName type=$callType"
        )

        showCallDebugger(
            callerName,
            callType,
            callId
        )
    }

    private fun applyLockscreenFlags() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
                setShowWhenLocked(true)
                setTurnScreenOn(true)

                val keyguard =
                    getSystemService(
                        Context.KEYGUARD_SERVICE
                    ) as KeyguardManager

                keyguard.requestDismissKeyguard(
                    this,
                    null
                )
            } else {
                window.addFlags(
                    android.view.WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
                    android.view.WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON or
                    android.view.WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD
                )
            }

            debug(
                "SCREEN_WAKE_REQUEST",
                "OK"
            )

        } catch (e: Exception) {
            debug(
                "SCREEN_WAKE_REQUEST",
                "FAIL",
                e.message ?: "unknown"
            )
        }
    }

    private fun acquireWakeLock() {
        try {
            val pm =
                getSystemService(
                    Context.POWER_SERVICE
                ) as PowerManager

            wakeLock =
                pm.newWakeLock(
                    PowerManager.SCREEN_BRIGHT_WAKE_LOCK or
                    PowerManager.ACQUIRE_CAUSES_WAKEUP,
                    "synking:incoming_call"
                )

            wakeLock?.acquire(10_000L)

            debug(
                "WAKELOCK",
                "OK",
                "10 seconds"
            )

        } catch (e: Exception) {
            debug(
                "WAKELOCK",
                "FAIL",
                e.message ?: "unknown"
            )
        }
    }

    private fun showCallDebugger(
        callerName: String,
        callType: String,
        callId: String
    ) {
        val root =
            LinearLayout(this).apply {
                orientation = LinearLayout.VERTICAL
                gravity = Gravity.CENTER
                setPadding(40, 40, 40, 40)
                setBackgroundColor(Color.BLACK)
            }

        val title =
            TextView(this).apply {
                text = "SYNKING CALL DEBUG\nCaller: $callerName ($callType)\n"
                textSize = 22f
                setTextColor(Color.WHITE)
                gravity = Gravity.CENTER
            }

        val info =
            TextView(this).apply {
                text =
                    "[FCM] RECEIVED       OK\n" +
                    "[FCM] callId         OK\n" +
                    "[PROCESS] STARTED    OK\n" +
                    "[NOTIFICATION] POST  OK\n" +
                    "[FULLSCREEN] LAUNCH  OK\n" +
                    "[SCREEN] WAKE        OK\n" +
                    "[RINGTONE] START     OK\n" +
                    "[ACTIVITY] CREATED   OK\n" +
                    "[WEBRTC] HANDOFF     Pending Answer\n"
                textSize = 16f
                setTextColor(Color.parseColor("#00E5FF")) // Cyan color for debug text
                setPadding(0, 40, 0, 40)
            }

        val answer =
            Button(this).apply {
                text = "ANSWER (Trigger Handoff)"
                setOnClickListener {
                    debug(
                        "ANSWER_PRESSED",
                        "OK",
                        "callId=$callId"
                    )

                    handoffToReactNative(
                        callId,
                        callerName,
                        callType
                    )
                }
            }

        val decline =
            Button(this).apply {
                text = "DECLINE & CLOSE"
                setOnClickListener {
                    debug(
                        "DECLINE_PRESSED",
                        "OK",
                        "callId=$callId"
                    )

                    clearPendingCall()
                    finish()
                }
            }

        root.addView(title)
        root.addView(info)
        root.addView(answer)
        root.addView(decline)

        setContentView(root)
    }

    private fun handoffToReactNative(
        callId: String,
        callerName: String,
        callType: String
    ) {
        clearPendingCall()

        val intent =
            Intent(this, MainActivity::class.java).apply {
                flags =
                    Intent.FLAG_ACTIVITY_NEW_TASK or
                    Intent.FLAG_ACTIVITY_SINGLE_TOP or
                    Intent.FLAG_ACTIVITY_CLEAR_TOP

                putExtra(
                    "SYNKING_INCOMING_CALL",
                    true
                )

                putExtra(
                    "callId",
                    callId
                )

                putExtra(
                    "callerName",
                    callerName
                )

                putExtra(
                    "callType",
                    callType
                )
            }

        startActivity(intent)

        debug(
            "REACT_NATIVE_HANDOFF",
            "OK",
            "callId=$callId"
        )

        finish()
    }

    private fun clearPendingCall() {
        getSharedPreferences(
            "synking_call_state",
            MODE_PRIVATE
        )
            .edit()
            .clear()
            .apply()
    }

    override fun onDestroy() {
        super.onDestroy()

        try {
            wakeLock?.let {
                if (it.isHeld) {
                    it.release()
                }
            }
        } catch (_: Exception) {
        }

        debug(
            "CALL_ACTIVITY_DESTROYED",
            "INFO"
        )
    }
}