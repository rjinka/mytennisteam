package com.ramjin.mytennisteam.ui.activity

import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.view.Menu
import android.view.MenuItem
import android.widget.Toast
import android.widget.EditText
import androidx.activity.viewModels
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.isVisible
import androidx.fragment.app.Fragment
import com.ramjin.mytennisteam.R
import com.ramjin.mytennisteam.databinding.ActivityHomeBinding
import com.ramjin.mytennisteam.ui.fragment.CourtsFragment
import com.ramjin.mytennisteam.ui.fragment.GroupsFragment
import com.ramjin.mytennisteam.ui.fragment.PlayersFragment
import com.ramjin.mytennisteam.ui.fragment.SchedulesFragment
import com.ramjin.mytennisteam.util.EventObserver
import com.ramjin.mytennisteam.util.SessionManager
import com.ramjin.mytennisteam.viewmodel.HomeViewModel
import com.ramjin.mytennisteam.viewmodel.LoadingViewModel

class HomeActivity : AppCompatActivity() {

    private lateinit var binding: ActivityHomeBinding
    private val homeViewModel: HomeViewModel by viewModels { HomeViewModel.Factory }
    private val loadingViewModel: LoadingViewModel by viewModels()

    private val groupsFragment = GroupsFragment()
    private val courtsFragment = CourtsFragment()
    private val schedulesFragment = SchedulesFragment()
    private val playersFragment = PlayersFragment()
    private var activeFragment: Fragment = groupsFragment

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityHomeBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupToolbar()
        setupBottomNavigation()

        if (savedInstanceState == null) {
            supportFragmentManager.beginTransaction()
                .add(R.id.fragment_container, playersFragment, "4").hide(playersFragment)
                .add(R.id.fragment_container, schedulesFragment, "3").hide(schedulesFragment)
                .add(R.id.fragment_container, courtsFragment, "2").hide(courtsFragment)
                .add(R.id.fragment_container, groupsFragment, "1")
                .commit()
            fetchInitialData()
        }

        observeViewModels()
        handleIntent(intent)
    }

    override fun onNewIntent(intent: Intent?) {
        super.onNewIntent(intent)
        setIntent(intent) // Update the activity's intent
        handleIntent(intent)
    }

    fun setCourtsTabVisibility(isVisible: Boolean) {
        binding.bottomNavigation.menu.findItem(R.id.navigation_courts).isVisible = isVisible
    }

    private fun setupToolbar() {
        setSupportActionBar(binding.appBar.toolbar)
        supportActionBar?.setDisplayShowTitleEnabled(false)
    }

    override fun onCreateOptionsMenu(menu: Menu): Boolean {
        menuInflater.inflate(R.menu.home_toolbar_menu, menu)
        return true
    }

    override fun onOptionsItemSelected(item: MenuItem): Boolean {
        return when (item.itemId) {
            R.id.action_delete_account -> {
                requestAccountDeletion()
                true
            }
            R.id.action_contact_support -> {
                showContactSupportDialog()
                true
            }
            else -> super.onOptionsItemSelected(item)
        }
    }

    private fun showContactSupportDialog() {
        val editText = EditText(this).apply {
            hint = "Please describe your issue..."
            setLines(5)
            isSingleLine = false
        }

        AlertDialog.Builder(this)
            .setTitle("Contact Support")
            .setView(editText)
            .setPositiveButton("Submit") { _, _ ->
                val message = editText.text.toString().trim()
                if (message.isNotBlank()) {
                    val token = SessionManager.getAuthToken(this)
                    if (token != null) {
                        homeViewModel.submitSupportRequest(
                            "Bearer $token",
                            homeViewModel.homeData.value?.selectedGroup?.id,
                            message,
                            loadingViewModel
                        )
                    }
                }
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun requestAccountDeletion() {
        if (homeViewModel.allGroups.value?.isNotEmpty() == true) {
            Toast.makeText(this, "You must leave all groups before deleting your account.", Toast.LENGTH_LONG).show()
            return
        }

        AlertDialog.Builder(this)
            .setTitle("Delete Account")
            .setMessage("Are you sure you want to permanently delete your account? This action cannot be undone.")
            .setPositiveButton("Delete") { _, _ ->
                val token = SessionManager.getAuthToken(this)
                if (token != null) {
                    homeViewModel.deleteAccount("Bearer $token", loadingViewModel)
                }
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun logout() {
        SessionManager.clearAuthToken(this)
        val intent = Intent(this, MainActivity::class.java)
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        startActivity(intent)
    }

    private fun setupBottomNavigation() {
        binding.bottomNavigation.setOnItemSelectedListener { item ->
            val selectedFragment = when (item.itemId) {
                R.id.navigation_courts -> courtsFragment
                R.id.navigation_schedules -> schedulesFragment
                R.id.navigation_players -> playersFragment
                else -> groupsFragment
            }
            supportFragmentManager.beginTransaction().hide(activeFragment).show(selectedFragment).commit()
            activeFragment = selectedFragment
            true
        }
    }

    private fun fetchInitialData() {
        val rawToken = SessionManager.getAuthToken(this)
        if (rawToken == null) {
            // If no token, and we're in HomeActivity, we need to log in.
            logout()
            return
        }
        homeViewModel.fetchInitialGroups("Bearer $rawToken", loadingViewModel)
        setCourtsTabVisibility(homeViewModel.allGroups.value?.isNotEmpty() ?: false)
    }

    private fun observeViewModels() {
        homeViewModel.homeData.observe(this) { data ->
            if (data != null) {
                binding.appBar.toolbarSubtitle.text = data.selectedGroup.name
            }
        }

        homeViewModel.allGroups.observe(this) { groups ->
            setCourtsTabVisibility(groups.isNotEmpty())
        }

        homeViewModel.forceLogout.observe(this, EventObserver {
            logout()
            Toast.makeText(this, "Session expired. Please log in again.", Toast.LENGTH_LONG).show()
        })

        homeViewModel.deleteAccountStatus.observe(this, EventObserver { success ->
            if (success) {
                Toast.makeText(this, "Account successfully deleted.", Toast.LENGTH_LONG).show()
                logout()
            } else {
                Toast.makeText(this, "Failed to delete account. Please try again.", Toast.LENGTH_LONG).show()
            }
        })

        homeViewModel.contactSupportStatus.observe(this, EventObserver { success ->
            if (success) {
                Toast.makeText(this@HomeActivity, "Support request sent!", Toast.LENGTH_LONG).show()
            } else {
                Toast.makeText(this@HomeActivity, "Failed to submit support request. Please try again.", Toast.LENGTH_LONG).show()
            }
        })

        loadingViewModel.isLoading.observe(this) { isLoading ->
            binding.loadingOverlay.root.isVisible = isLoading
        }

        homeViewModel.joinGroupStatus.observe(this, EventObserver { message ->
            Toast.makeText(this, message, Toast.LENGTH_LONG).show()
        })

        homeViewModel.acceptInvitationStatus.observe(this, EventObserver { message ->
            Toast.makeText(this, message, Toast.LENGTH_LONG).show()
        })
    }

    private fun handleIntent(intent: Intent?) {
        val groupId = intent?.data?.getQueryParameter("groupId")
        if (groupId != null) {
            // If there's a groupId but no token, redirect to login.
            // The login flow will bring the user back here, and fetchInitialData will run.
            // The intent will be processed again after login.
            if (SessionManager.getAuthToken(this) == null) {
                return // fetchInitialData will handle the redirection to login
            }
            val rawToken = SessionManager.getAuthToken(this)
            if (rawToken != null) {
                homeViewModel.joinGroup("Bearer $rawToken", groupId, loadingViewModel)
            }
            intent.data = null // Clear the data to prevent re-processing on configuration change
        }
        val joinToken = intent?.data?.getQueryParameter("join_token")
        if (joinToken != null) {
            val rawToken = SessionManager.getAuthToken(this)
            if (rawToken != null) {
                homeViewModel.acceptInvitation("Bearer $rawToken", joinToken, loadingViewModel)
            }
            intent.data = null // Clear the data to prevent re-processing on configuration change
        }
    }
}
