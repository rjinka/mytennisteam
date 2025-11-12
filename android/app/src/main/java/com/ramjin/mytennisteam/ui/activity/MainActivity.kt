package com.ramjin.mytennisteam.ui.activity

import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.credentials.CredentialManager
import androidx.credentials.CustomCredential
import androidx.credentials.GetCredentialRequest
import androidx.credentials.exceptions.GetCredentialCancellationException
import androidx.credentials.exceptions.GetCredentialException
import androidx.lifecycle.lifecycleScope
import com.google.android.libraries.identity.googleid.GetGoogleIdOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import com.ramjin.mytennisteam.R
import com.ramjin.mytennisteam.data.api.RetrofitClient
import com.ramjin.mytennisteam.data.model.AuthRequest
import com.ramjin.mytennisteam.databinding.ActivityMainBinding
import com.ramjin.mytennisteam.util.SessionManager
import kotlinx.coroutines.launch

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private lateinit var credentialManager: CredentialManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Check for existing session
        if (SessionManager.getAuthToken(this) != null) {
            startHomeActivity()
            return
        }

        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        credentialManager = CredentialManager.create(this)

        binding.signInButton.setOnClickListener {
            signInWithGoogle()
        }
    }

    private fun signInWithGoogle() {
        lifecycleScope.launch {
            try {
                val googleIdOption = GetGoogleIdOption.Builder()
                    .setFilterByAuthorizedAccounts(false)
                    .setServerClientId(getString(R.string.server_client_id))
                    .build()

                val request = GetCredentialRequest.Builder()
                    .addCredentialOption(googleIdOption)
                    .build()

                val result = credentialManager.getCredential(this@MainActivity, request)

                when (val credential = result.credential) {
                    is GoogleIdTokenCredential -> {
                        authenticateWithBackend(credential.idToken)
                    }
                    is CustomCredential -> {
                        if (credential.type == GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL) {
                            val googleIdTokenCredential = GoogleIdTokenCredential.createFrom(credential.data)
                            authenticateWithBackend(googleIdTokenCredential.idToken)
                        } else {
                            Toast.makeText(this@MainActivity, "Sign in failed: Unexpected credential type", Toast.LENGTH_SHORT).show()
                        }
                    }
                    else -> {
                        Toast.makeText(
                            this@MainActivity,
                            "Sign in failed: Unexpected credential type",
                            Toast.LENGTH_SHORT
                        ).show()
                    }
                }

            } catch (e: GetCredentialException) {
                when (e) {
                    is GetCredentialCancellationException -> {
                        // User cancelled the sign-in flow, do nothing.
                    }
                    else -> {
                        // Handle other credential-related errors
                        Toast.makeText(this@MainActivity, "Sign in failed: ${e.message}", Toast.LENGTH_SHORT).show()
                    }
                }
            } catch (e: GoogleIdTokenParsingException) {
                // Handle ID token parsing failure
                Toast.makeText(this@MainActivity, "Sign in failed: Could not parse token.", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun startHomeActivity() {
        val intent = Intent(this, HomeActivity::class.java)
        // Pass the original deep link data to HomeActivity if needed
        if (getIntent().data != null) {
            intent.data = getIntent().data
        }
        startActivity(intent)
        finish()
    }

    private fun authenticateWithBackend(idToken: String) {
        lifecycleScope.launch {
            try {
                val response = RetrofitClient.instance.authenticateWithGoogle(AuthRequest(idToken))
                SessionManager.saveAuthToken(
                    this@MainActivity,
                    response.token,
                    response.user.id,
                    response.user.isSuperAdmin
                )
                startHomeActivity()
            } catch (e: Exception) {
                Toast.makeText(this@MainActivity, "Authentication failed: ${e.message}", Toast.LENGTH_SHORT).show()
            }
        }
    }
}
