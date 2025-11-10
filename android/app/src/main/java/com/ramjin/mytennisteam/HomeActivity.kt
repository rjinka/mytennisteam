package com.ramjin.mytennisteam

import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.isVisible
import androidx.fragment.app.Fragment
import com.ramjin.mytennisteam.R
import com.ramjin.mytennisteam.databinding.ActivityHomeBinding

class HomeActivity : AppCompatActivity() {

    private lateinit var binding: ActivityHomeBinding
    private val homeViewModel: HomeViewModel by viewModels { HomeViewModel.provideFactory(this) }
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

        binding.appBar.logoutButton.setOnClickListener {
            logout()
        }
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
    }

    private fun observeViewModels() {
        homeViewModel.homeData.observe(this) { data ->
            if (data != null) {
                binding.appBar.toolbarSubtitle.text = data.selectedGroup.name
            }
        }

        homeViewModel.forceLogout.observe(this, EventObserver {
            logout()
            Toast.makeText(this, "Session expired. Please log in again.", Toast.LENGTH_LONG).show()
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
