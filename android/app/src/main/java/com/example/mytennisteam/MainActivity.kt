package com.example.mytennisteam

import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.credentials.CredentialManager
import androidx.credentials.GetCredentialRequest
import androidx.credentials.PasswordCredential
import androidx.credentials.PublicKeyCredential
import androidx.credentials.exceptions.GetCredentialCancellationException
import androidx.credentials.exceptions.GetCredentialException
import androidx.credentials.exceptions.NoCredentialException
import androidx.lifecycle.lifecycleScope
import com.google.android.gms.common.SignInButton
import com.google.android.libraries.identity.googleid.GetGoogleIdOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class MainActivity : AppCompatActivity() {

    private lateinit var credentialManager: CredentialManager
    private lateinit var serverClientId: String

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        serverClientId = getString(R.string.server_client_id)

        // Handle Deep Link
        val data = intent.data
        if (data != null && data.path?.startsWith("/join") == true) {
            val token = data.getQueryParameter("token")
            if (token != null) {
                handleAcceptInvitation(token)
                return // Stop further execution of normal flow
            }
        }

        // Regular sign-in flow
        if (SessionManager.getAuthToken(this) != null) {
            navigateToHome()
            return
        }

        setContentView(R.layout.activity_main)
        credentialManager = CredentialManager.create(this)
        findViewById<SignInButton>(R.id.sign_in_button).setOnClickListener {
            signIn()
        }
    }

    private fun handleAcceptInvitation(token: String) {
        lifecycleScope.launch(Dispatchers.IO) {
            try {
                RetrofitClient.instance.acceptInvitation(token)
                withContext(Dispatchers.Main) {
                    Toast.makeText(this@MainActivity, "Successfully joined the group! Please sign in.", Toast.LENGTH_LONG).show()
                    setContentView(R.layout.activity_main)
                    credentialManager = CredentialManager.create(this@MainActivity)
                    findViewById<SignInButton>(R.id.sign_in_button).setOnClickListener {
                        signIn()
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Failed to join group", e)
                withContext(Dispatchers.Main) {
                    Toast.makeText(this@MainActivity, "Failed to join group. The link may be invalid or expired.", Toast.LENGTH_LONG).show()
                    setContentView(R.layout.activity_main)
                    credentialManager = CredentialManager.create(this@MainActivity)
                    findViewById<SignInButton>(R.id.sign_in_button).setOnClickListener {
                        signIn()
                    }
                }
            }
        }
    }


    private fun signIn() {
        val googleIdOption: GetGoogleIdOption = GetGoogleIdOption.Builder()
            .setFilterByAuthorizedAccounts(false)
            .setServerClientId(serverClientId)
            .build()

        val request: GetCredentialRequest = GetCredentialRequest.Builder()
            .addCredentialOption(googleIdOption)
            .build()

        lifecycleScope.launch {
            try {
                val result = credentialManager.getCredential(this@MainActivity, request)
                val credential = result.credential

                when (credential.type) {
                    GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL -> {
                        val googleIdTokenCredential = GoogleIdTokenCredential.createFrom(credential.data)
                        val idToken = googleIdTokenCredential.idToken
                        sendTokenToBackend(idToken)
                    }
                    PasswordCredential.TYPE_PASSWORD_CREDENTIAL -> {
                        Toast.makeText(this@MainActivity, "Please select a Google account to sign in.", Toast.LENGTH_LONG).show()
                    }
                    PublicKeyCredential.TYPE_PUBLIC_KEY_CREDENTIAL -> {
                        Toast.makeText(this@MainActivity, "Please select a Google account to sign in.", Toast.LENGTH_LONG).show()
                    }
                    else -> {
                        Toast.makeText(this@MainActivity, "Sign-in failed. An unexpected error occurred.", Toast.LENGTH_SHORT).show()
                    }
                }
            } catch (e: GetCredentialException) {
                when (e) {
                    is GetCredentialCancellationException -> { }
                    is NoCredentialException -> {
                        Toast.makeText(this@MainActivity, "No Google accounts found on this device.", Toast.LENGTH_LONG).show()
                    }
                    else -> {
                        Log.e(TAG, "Sign-in failed", e)
                        Toast.makeText(this@MainActivity, "Sign-in failed: ${e.message}", Toast.LENGTH_SHORT).show()
                    }
                }
            }
        }
    }

    private fun sendTokenToBackend(idToken: String) {
        lifecycleScope.launch(Dispatchers.IO) {
            try {
                val response = RetrofitClient.instance.authenticateWithGoogle(AuthRequest(idToken))
                val rawToken = response.token.removePrefix("Bearer ").trim()
                SessionManager.saveAuthToken(this@MainActivity, rawToken)

                withContext(Dispatchers.Main) {
                    navigateToHome()
                }
            } catch (e: Exception) {
                Log.e(TAG, "Backend auth failed", e)
                withContext(Dispatchers.Main) {
                    Toast.makeText(this@MainActivity, "Backend authentication failed.", Toast.LENGTH_LONG).show()
                }
            }
        }
    }

    private fun navigateToHome() {
        val intent = Intent(this, HomeActivity::class.java)
        startActivity(intent)
        finish()
    }

    companion object {
        private const val TAG = "MainActivity"
    }
}
