package com.example.mytennisteam

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.example.mytennisteam.databinding.ActivityMainBinding
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInClient
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import com.google.android.gms.common.api.ApiException
import kotlinx.coroutines.launch

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private lateinit var googleSignInClient: GoogleSignInClient
    private var joinToken: String? = null

    private val googleSignInLauncher = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
        if (result.resultCode == RESULT_OK) {
            val task = GoogleSignIn.getSignedInAccountFromIntent(result.data)
            try {
                val account = task.getResult(ApiException::class.java)
                if (account?.idToken != null) {
                    authenticateWithBackend(account.idToken!!)
                }
            } catch (e: ApiException) {
                Toast.makeText(this, "Google sign in failed: ${e.statusCode}", Toast.LENGTH_SHORT).show()
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        handleIntent(intent) // Handle intent on initial creation

        // Check for existing session
        if (SessionManager.getAuthToken(this) != null) {
            handleJoinTokenAndStartHomeActivity()
            return
        }

        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        val gso = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
            .requestIdToken(getString(R.string.server_client_id))
            .requestEmail()
            .build()
        googleSignInClient = GoogleSignIn.getClient(this, gso)

        binding.signInButton.setOnClickListener {
            googleSignInLauncher.launch(googleSignInClient.signInIntent)
        }
    }

    override fun onNewIntent(intent: Intent?) {
        super.onNewIntent(intent)
        setIntent(intent) // Update the activity's intent
        if (intent != null) {
            handleIntent(intent) // Handle intent if activity is already running
        }

        if (SessionManager.getAuthToken(this) != null) {
            handleJoinTokenAndStartHomeActivity()
        }
    }

    private fun handleIntent(intent: Intent) {
        if (intent.action == Intent.ACTION_VIEW && intent.data != null) {
            joinToken = intent.data?.getQueryParameter("join_token")
        }
    }
    
    private fun handleJoinTokenAndStartHomeActivity() {
        val tokenToProcess = joinToken
        joinToken = null // Consume the token

        if (tokenToProcess != null) {
            val authToken = SessionManager.getAuthToken(this)
            if (authToken != null) {
                lifecycleScope.launch {
                    try {
                        RetrofitClient.instance.acceptInvitation("Bearer $authToken", tokenToProcess)
                        Toast.makeText(this@MainActivity, "Invitation accepted!", Toast.LENGTH_SHORT).show()
                    } catch (e: Exception) {
                        Toast.makeText(this@MainActivity, "Failed to accept invitation: ${e.message}", Toast.LENGTH_SHORT).show()
                    } finally {
                        startHomeActivity()
                    }
                }
            } else {
                 startHomeActivity()
            }
        } else {
            startHomeActivity()
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
                SessionManager.saveAuthToken(this@MainActivity, response.token, response.user.id, response.user.isSuperAdmin)
                handleJoinTokenAndStartHomeActivity()
            } catch (e: Exception) {
                Toast.makeText(this@MainActivity, "Authentication failed: ${e.message}", Toast.LENGTH_SHORT).show()
            }
        }
    }
}
