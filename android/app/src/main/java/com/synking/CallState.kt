package com.synking

import android.content.Context

object CallState {
    private const val PREFS = "synking_call_state"
    private const val KEY_ACTIVE_ID = "active_call_id"
    private const val KEY_TS = "active_call_ts"
    private const val STALE_THRESHOLD_MS = 45_000L

    @Volatile private var activeCallId: String? = null

    fun init(context: Context) {
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val savedId = prefs.getString(KEY_ACTIVE_ID, null)
        val savedTs = prefs.getLong(KEY_TS, 0L)
        activeCallId = if (savedId != null && (System.currentTimeMillis() - savedTs) < STALE_THRESHOLD_MS)
            savedId else null
    }

    fun isDuplicate(callId: String): Boolean = activeCallId == callId

    fun start(context: Context, callId: String): Boolean {
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val savedTs = prefs.getLong(KEY_TS, 0L)
        val now = System.currentTimeMillis()
        if (activeCallId != null && (now - savedTs) < STALE_THRESHOLD_MS && activeCallId != callId) return false
        activeCallId = callId
        prefs.edit().putString(KEY_ACTIVE_ID, callId).putLong(KEY_TS, now).apply()
        return true
    }

    fun clear(context: Context, callId: String? = null) {
        if (callId == null || activeCallId == callId) {
            activeCallId = null
            context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                .edit().remove(KEY_ACTIVE_ID).remove(KEY_TS).apply()
        }
    }
}
