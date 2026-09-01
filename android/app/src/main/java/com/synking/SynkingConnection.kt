package com.synking

import android.content.Context
import android.content.Intent
import android.telecom.Connection
import android.telecom.DisconnectCause
import android.util.Log

class SynkingConnection(private val context: Context, private val callId: String, private val callerName: String, private val callType: String) : Connection() {

    init {
        // Essential properties for VoIP call
        connectionProperties = PROPERTY_SELF_MANAGED
        audioModeIsVoip = true
    }

    override fun onShowIncomingCallUi() {
        super.onShowIncomingCallUi()
        Log.d("SYNKING_TELECOM", "[UI] INCOMING_CALL_SHOWN: Showing custom IncomingCallActivity for $callId")
        
        val fullScreenIntent = Intent(context, IncomingCallActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_REORDER_TO_FRONT
            putExtra("callId", callId)
            putExtra("callerName", callerName)
            putExtra("callType", callType)
        }
        
        try {
            context.startActivity(fullScreenIntent)
        } catch (e: Exception) {
            Log.e("SYNKING_TELECOM", "[TELECOM] ERROR: Failed to launch UI: ${e.message}", e)
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
