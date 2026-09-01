package com.synking

import android.telecom.Connection
import android.telecom.ConnectionRequest
import android.telecom.ConnectionService
import android.telecom.PhoneAccountHandle
import android.util.Log

class SynkingConnectionService : ConnectionService() {

    override fun onCreateIncomingConnection(
        connectionManagerPhoneAccount: PhoneAccountHandle?,
        request: ConnectionRequest?
    ): Connection {
        val rawExtras = request?.extras
        val incomingExtras = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU) {
            rawExtras?.getParcelable(android.telecom.TelecomManager.EXTRA_INCOMING_CALL_EXTRAS, android.os.Bundle::class.java) ?: rawExtras
        } else {
            @Suppress("DEPRECATION")
            rawExtras?.getParcelable(android.telecom.TelecomManager.EXTRA_INCOMING_CALL_EXTRAS) ?: rawExtras
        }
        val callId = incomingExtras?.getString("callId") ?: rawExtras?.getString("callId") ?: "unknown_call_id"
        val callerName = incomingExtras?.getString("callerName") ?: rawExtras?.getString("callerName") ?: "Unknown"
        val callType = incomingExtras?.getString("callType") ?: rawExtras?.getString("callType") ?: "audio"

        Log.d("SYNKING_TELECOM", "[TELECOM] CONNECTION_CREATED: Handling incoming for $callerName ($callId)")

        val connection = SynkingConnection(applicationContext, callId, callerName, callType)
        connection.setInitializing()
        connection.setRinging()
        
        Log.d("SYNKING_TELECOM", "[TELECOM] STATE_RINGING: Set connection state to ringing")
        
        CallConnectionManager.currentConnection = connection
        
        return connection
    }

    override fun onCreateIncomingConnectionFailed(
        connectionManagerPhoneAccount: PhoneAccountHandle?,
        request: ConnectionRequest?
    ) {
        super.onCreateIncomingConnectionFailed(connectionManagerPhoneAccount, request)
        Log.e("SYNKING_TELECOM", "[TELECOM] ERROR: onCreateIncomingConnectionFailed")
    }
}
