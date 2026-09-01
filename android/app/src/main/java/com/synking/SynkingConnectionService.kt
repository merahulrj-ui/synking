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
        val extras = request?.extras
        val callId = extras?.getString("callId") ?: "unknown_call_id"
        val callerName = extras?.getString("callerName") ?: "Unknown"
        val callType = extras?.getString("callType") ?: "audio"

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
