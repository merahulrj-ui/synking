package com.synking

import android.telecom.Connection
import android.telecom.ConnectionRequest
import android.telecom.ConnectionService
import android.telecom.PhoneAccountHandle
import android.util.Log

class SynkingConnectionService : ConnectionService() {

    companion object {
        var instance: SynkingConnectionService? = null

        fun startCallForeground(notification: android.app.Notification) {
            try {
                if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.Q) {
                    instance?.startForeground(
                        MyFirebaseMessagingService.NOTIFICATION_ID,
                        notification,
                        android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_PHONE_CALL or
                        android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE or
                        android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_CAMERA
                    )
                } else {
                    instance?.startForeground(MyFirebaseMessagingService.NOTIFICATION_ID, notification)
                }
                Log.d("SYNKING_TELECOM", "[FGS] startForeground ACTIVE: Process shielded from OEM Freezer")
            } catch (e: Exception) {
                Log.w("SYNKING_TELECOM", "[FGS] startForeground notice: ${e.message}")
            }
        }

        fun stopCallForeground() {
            try {
                if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.N) {
                    instance?.stopForeground(STOP_FOREGROUND_REMOVE)
                } else {
                    @Suppress("DEPRECATION")
                    instance?.stopForeground(true)
                }
                instance?.let { s ->
                    val nm = s.getSystemService(android.content.Context.NOTIFICATION_SERVICE) as? android.app.NotificationManager
                    nm?.cancel(MyFirebaseMessagingService.NOTIFICATION_ID)
                }
                Log.d("SYNKING_TELECOM", "[FGS] stopCallForeground: Notification completely removed")
            } catch (e: Exception) {
                Log.e("SYNKING_TELECOM", "[FGS] stopCallForeground error: ${e.message}")
            }
        }
    }

    override fun onCreate() {
        super.onCreate()
        instance = this
    }

    override fun onDestroy() {
        super.onDestroy()
        if (instance == this) instance = null
    }

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
        val callerId = incomingExtras?.getString("callerId") ?: rawExtras?.getString("callerId") ?: ""
        val callerName = incomingExtras?.getString("callerName") ?: rawExtras?.getString("callerName") ?: "Unknown"
        val callType = incomingExtras?.getString("callType") ?: rawExtras?.getString("callType") ?: "audio"

        Log.d("SYNKING_TELECOM", "[TELECOM] CONNECTION_CREATED: Handling incoming for $callerName ($callId) from $callerId")

        val connection = SynkingConnection(applicationContext, callId, callerId, callerName, callType)
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
