package com.synking

import android.content.Context

object CallState {
    private const val PREFS = "synking_call_state"
    private const val KEY_ACTIVE_ID = "active_call_id"
    private const val KEY_TS = "active_call_ts"
    private const val KEY_ANSWERED = "active_call_answered"
    private const val STALE_THRESHOLD_MS = 45_000L

    @Volatile private var activeCallId: String? = null
    @Volatile private var wasAnswered: Boolean = false

    fun init(context: Context) {
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val savedId = prefs.getString(KEY_ACTIVE_ID, null)
        val savedTs = prefs.getLong(KEY_TS, 0L)
        activeCallId = if (savedId != null && (System.currentTimeMillis() - savedTs) < STALE_THRESHOLD_MS)
            savedId else null
        wasAnswered = prefs.getBoolean(KEY_ANSWERED, false)
    }

    fun isDuplicate(callId: String): Boolean = activeCallId == callId

    fun start(context: Context, callId: String): Boolean {
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val savedTs = prefs.getLong(KEY_TS, 0L)
        val now = System.currentTimeMillis()
        if (activeCallId != null && (now - savedTs) < STALE_THRESHOLD_MS && activeCallId != callId) return false
        activeCallId = callId
        wasAnswered = false
        prefs.edit().putString(KEY_ACTIVE_ID, callId).putLong(KEY_TS, now).putBoolean(KEY_ANSWERED, false).apply()
        return true
    }

    fun markAnswered(context: Context) {
        wasAnswered = true
        try {
            context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                .edit().putBoolean(KEY_ANSWERED, true).apply()
        } catch (e: Exception) {}
    }

    fun wasCallAnswered(context: Context): Boolean {
        if (wasAnswered) return true
        return try {
            context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                .getBoolean(KEY_ANSWERED, false)
        } catch (e: Exception) { false }
    }

    fun clear(context: Context, callId: String? = null) {
        activeCallId = null
        wasAnswered = false
        try {
            context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                .edit().remove(KEY_ACTIVE_ID).remove(KEY_TS).remove(KEY_ANSWERED).apply()
        } catch (e: Exception) {}
    }
}
