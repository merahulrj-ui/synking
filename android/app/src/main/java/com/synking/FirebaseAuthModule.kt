package com.synking

import android.app.Activity
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.google.firebase.FirebaseException
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.PhoneAuthCredential
import com.google.firebase.auth.PhoneAuthOptions
import com.google.firebase.auth.PhoneAuthProvider
import java.util.concurrent.TimeUnit

class FirebaseAuthModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private var storedVerificationId: String? = null
    private var storedResendToken: PhoneAuthProvider.ForceResendingToken? = null

    override fun getName(): String {
        return "NativeFirebaseAuth"
    }

    @ReactMethod
    fun sendOtp(phoneNumber: String, promise: Promise) {
        val activity: Activity? = reactContext.currentActivity
        if (activity == null) {
            promise.reject("ERR_NO_ACTIVITY", "Current Android activity is null")
            return
        }

        var cleanPhone = phoneNumber.trim().replace(" ", "").replace("-", "")
        if (!cleanPhone.startsWith("+")) {
            cleanPhone = "+91" + cleanPhone.takeLast(10)
        }

        val auth = FirebaseAuth.getInstance()
        val callbacks = object : PhoneAuthProvider.OnVerificationStateChangedCallbacks() {
            override fun onVerificationCompleted(credential: PhoneAuthCredential) {
                val code = credential.smsCode
                auth.signInWithCredential(credential)
                    .addOnCompleteListener { task ->
                        if (task.isSuccessful) {
                            val user = task.result?.user
                            val map = Arguments.createMap().apply {
                                putBoolean("success", true)
                                putBoolean("autoVerified", true)
                                putString("code", code)
                                putString("uid", user?.uid)
                                putString("phoneNumber", user?.phoneNumber)
                            }
                            promise.resolve(map)
                        } else {
                            promise.reject("ERR_SIGN_IN_FAILED", task.exception?.message ?: "Instant sign-in failed")
                        }
                    }
            }

            override fun onVerificationFailed(e: FirebaseException) {
                promise.reject("ERR_FIREBASE_PHONE_AUTH", e.message ?: "Verification failed", e)
            }

            override fun onCodeSent(
                verificationId: String,
                token: PhoneAuthProvider.ForceResendingToken
            ) {
                storedVerificationId = verificationId
                storedResendToken = token
                val map = Arguments.createMap().apply {
                    putBoolean("success", true)
                    putBoolean("autoVerified", false)
                    putString("verificationId", verificationId)
                }
                promise.resolve(map)
            }
        }

        val builder = PhoneAuthOptions.newBuilder(auth)
            .setPhoneNumber(cleanPhone)
            .setTimeout(60L, TimeUnit.SECONDS)
            .setActivity(activity)
            .setCallbacks(callbacks)

        val resendToken = storedResendToken
        if (resendToken != null) {
            builder.setForceResendingToken(resendToken)
        }

        PhoneAuthProvider.verifyPhoneNumber(builder.build())
    }

    @ReactMethod
    fun verifyOtp(smsCode: String, promise: Promise) {
        val verificationId = storedVerificationId
        if (verificationId == null) {
            promise.reject("ERR_NO_SESSION", "No active verification session. Please request a new OTP.")
            return
        }

        val trimmedCode = smsCode.trim()
        if (trimmedCode.length < 6) {
            promise.reject("ERR_INVALID_CODE", "OTP must be at least 6 digits")
            return
        }

        val credential = PhoneAuthProvider.getCredential(verificationId, trimmedCode)
        FirebaseAuth.getInstance().signInWithCredential(credential)
            .addOnCompleteListener { task ->
                if (task.isSuccessful) {
                    val user = task.result?.user
                    val map = Arguments.createMap().apply {
                        putBoolean("success", true)
                        putString("uid", user?.uid)
                        putString("phoneNumber", user?.phoneNumber)
                    }
                    promise.resolve(map)
                } else {
                    promise.reject("ERR_INVALID_OTP", task.exception?.message ?: "Invalid verification code")
                }
            }
    }
}
