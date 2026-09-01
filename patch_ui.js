const fs = require('fs');
const file = 'android/app/src/main/java/com/synking/IncomingCallActivity.kt';
let code = fs.readFileSync(file, 'utf8');
const newUI =     private fun buildWhatsAppStyleUI(
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

        // Top Brand Header (Pill)
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
            text = "? SECURE P2P WEBRTC"
            textSize = 11f
            setTextColor(Color.WHITE)
            typeface = android.graphics.Typeface.DEFAULT_BOLD
            letterSpacing = 0.1f
        }
        brandHeader.addView(brandText)
        root.addView(brandHeader)

        // Spacer
        root.addView(View(this).apply {
            layoutParams = LinearLayout.LayoutParams(1, dpToPx(50))
        })

        // Circular Avatar with Glowing Neon Ring
        val avatarPulse = ScaleAnimation(
            1.0f, 1.05f, 1.0f, 1.05f,
            Animation.RELATIVE_TO_SELF, 0.5f,
            Animation.RELATIVE_TO_SELF, 0.5f
        ).apply {
            duration = 1200
            repeatCount = Animation.INFINITE
            repeatMode = Animation.REVERSE
        }

        val avatarContainer = FrameLayout(this).apply {
            val size = dpToPx(140)
            layoutParams = LinearLayout.LayoutParams(size, size).apply {
                gravity = Gravity.CENTER_HORIZONTAL
            }
            background = GradientDrawable(
                GradientDrawable.Orientation.TR_BL,
                intArrayOf(Color.parseColor("#FD3A73"), Color.parseColor("#00E5FF"))
            ).apply {
                shape = GradientDrawable.OVAL
            }
            setPadding(dpToPx(4), dpToPx(4), dpToPx(4), dpToPx(4))
            startAnimation(avatarPulse)
        }
        
        val avatarInner = FrameLayout(this).apply {
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            )
            background = GradientDrawable().apply {
                shape = GradientDrawable.OVAL
                setColor(Color.parseColor("#11121A"))
            }
        }

        val avatarInitial = TextView(this).apply {
            text = if (callerName.isNotBlank()) callerName.take(1).uppercase() else "S"
            textSize = 56f
            setTextColor(Color.WHITE)
            gravity = Gravity.CENTER
            typeface = android.graphics.Typeface.DEFAULT_BOLD
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            )
        }
        avatarInner.addView(avatarInitial)
        avatarContainer.addView(avatarInner)
        root.addView(avatarContainer)

        // Caller Name
        val nameView = TextView(this).apply {
            text = callerName
            textSize = 32f
            setTextColor(Color.WHITE)
            gravity = Gravity.CENTER
            typeface = android.graphics.Typeface.DEFAULT_BOLD
            setPadding(0, dpToPx(32), 0, dpToPx(8))
        }
        root.addView(nameView)

        // Subtitle
        val subView = TextView(this).apply {
            text = "Incoming {if (callType == "video") "Video ??" else "Voice ??"} Call..."
            textSize = 16f
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

        // Bottom Action Buttons Row
        val actionsRow = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            )
        }

        // Decline Button
        val declineCol = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
        }
        val declineBtn = FrameLayout(this).apply {
            val size = dpToPx(76)
            layoutParams = LinearLayout.LayoutParams(size, size)
            background = GradientDrawable().apply {
                shape = GradientDrawable.OVAL
                setColor(Color.parseColor("#1E1E28")) // Dark pill
            }
            setOnClickListener {
                debug("DECLINE_PRESSED", "OK", "callId=callId")
                stopRingtoneAndVibration()
                CallConnectionManager.rejectCall()
                clearPendingCall()
                finish()
            }
        }
        val declineIcon = TextView(this).apply {
            text = "?"
            textSize = 30f
            setTextColor(Color.parseColor("#EF4444"))
            gravity = Gravity.CENTER
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            )
        }
        declineBtn.addView(declineIcon)
        val declineLabel = TextView(this).apply {
            text = "Decline"
            textSize = 14f
            setTextColor(Color.parseColor("#94A3B8"))
            gravity = Gravity.CENTER
            setPadding(0, dpToPx(12), 0, 0)
        }
        declineCol.addView(declineBtn)
        declineCol.addView(declineLabel)

        // Middle Spacing
        val buttonSpacer = View(this).apply {
            layoutParams = LinearLayout.LayoutParams(dpToPx(70), 1)
        }

        // Accept Button
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
                debug("ANSWER_PRESSED", "OK", "callId=callId")
                stopRingtoneAndVibration()
                CallConnectionManager.answerCall()
                handoffToReactNative(callId, callerName, callType)
            }
        }
        val acceptIcon = TextView(this).apply {
            text = "??"
            textSize = 32f
            setTextColor(Color.WHITE)
            gravity = Gravity.CENTER
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            )
        }
        acceptBtn.addView(acceptIcon)

        val acceptPulse = ScaleAnimation(
            1.0f, 1.15f, 1.0f, 1.15f,
            Animation.RELATIVE_TO_SELF, 0.5f,
            Animation.RELATIVE_TO_SELF, 0.5f
        ).apply {
            duration = 500
            repeatCount = Animation.INFINITE
            repeatMode = Animation.REVERSE
        }
        acceptBtn.startAnimation(acceptPulse)

        val acceptLabel = TextView(this).apply {
            text = "Accept"
            textSize = 14f
            setTextColor(Color.WHITE)
            gravity = Gravity.CENTER
            typeface = android.graphics.Typeface.DEFAULT_BOLD
            setPadding(0, dpToPx(12), 0, 0)
        }
        acceptCol.addView(acceptBtn)
        acceptCol.addView(acceptLabel)

        actionsRow.addView(declineCol)
        actionsRow.addView(buttonSpacer)
        actionsRow.addView(acceptCol)

        root.addView(actionsRow)
        setContentView(root)
    }\;
const regex = /private fun buildWhatsAppStyleUI[\s\S]*?setContentView\(root\)\s*\}/;
code = code.replace(regex, newUI);
fs.writeFileSync(file, code);
