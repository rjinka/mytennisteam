package com.example.mytennisteam

import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.fragment.app.Fragment
import com.example.mytennisteam.databinding.ActivityHomeBinding

class HomeActivity : AppCompatActivity() {

    private lateinit var binding: ActivityHomeBinding
    private val homeViewModel: HomeViewModel by viewModels()

    // Create and cache fragment instances
    private val groupsFragment = GroupsFragment()
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
            // Add all fragments initially, but show only the active one
            supportFragmentManager.beginTransaction()
                .add(R.id.fragment_container, playersFragment, "3").hide(playersFragment)
                .add(R.id.fragment_container, schedulesFragment, "2").hide(schedulesFragment)
                .add(R.id.fragment_container, groupsFragment, "1")
                .commit()
            fetchInitialData()
        }

        observeViewModel()
    }

    private fun setupToolbar() {
        setSupportActionBar(binding.appBar.toolbar)
        supportActionBar?.setDisplayShowTitleEnabled(false) // Hide the default title

        binding.appBar.logoutButton.setOnClickListener {
            SessionManager.clearAuthToken(this)
            val intent = Intent(this, MainActivity::class.java)
            intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
            startActivity(intent)
        }
    }

    private fun setupBottomNavigation() {
        binding.bottomNavigation.setOnItemSelectedListener { item ->
            val selectedFragment = when (item.itemId) {
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
            Toast.makeText(this, "Authentication token not found. Please log in again.", Toast.LENGTH_LONG).show()
            finish()
            return
        }
        homeViewModel.fetchInitialGroups("Bearer $rawToken")
    }

    private fun observeViewModel() {
        homeViewModel.homeData.observe(this) { data ->
            if (data != null) {
                binding.appBar.toolbarSubtitle.text = data.selectedGroup.name
            }
        }
    }
}
