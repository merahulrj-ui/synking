package com.synking

import android.telecom.DisconnectCause

object CallConnectionManager {
    var currentConnection: SynkingConnection? = null

    fun answerCall() {
        currentConnection?.let {
            it.setActive()
        }
    }

    fun rejectCall() {
        currentConnection?.let {
            it.setDisconnected(DisconnectCause(DisconnectCause.REJECTED))
            it.destroy()
            currentConnection = null
        }
    }

    fun endCall() {
        currentConnection?.let {
            it.setDisconnected(DisconnectCause(DisconnectCause.LOCAL))
            it.destroy()
            currentConnection = null
        }
    }
}
