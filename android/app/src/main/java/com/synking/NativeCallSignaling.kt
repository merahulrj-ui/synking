package com.synking

import android.content.Context
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.util.concurrent.Executors

object NativeCallSignaling {
    private val client = OkHttpClient()
    private val executor = Executors.newSingleThreadExecutor()

    fun sendDeclineNatively(context: Context, callId: String) {
        executor.execute {
            try {
                val body = """{"callId":"","type":"CALL_REJECTED"}"""
                    .toRequestBody("application/json".toMediaType())
                val request = Request.Builder()
                    .url("https://synking-9my2.onrender.com/api/send-call-push")
                    .post(body)
                    .build()
                client.newCall(request).execute().close()
            } catch (e: Exception) { /* best-effort */ }
        }
    }
}
