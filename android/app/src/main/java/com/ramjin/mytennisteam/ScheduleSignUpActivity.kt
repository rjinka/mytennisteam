package com.ramjin.mytennisteam

import android.os.Bundle
import android.widget.Toast
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import com.ramjin.mytennisteam.databinding.ActivityScheduleSignUpBinding

class ScheduleSignUpActivity : AppCompatActivity() {

    private lateinit var binding: ActivityScheduleSignUpBinding
    private val homeViewModel: HomeViewModel by viewModels { HomeViewModel.Factory }
    private val loadingViewModel: LoadingViewModel by viewModels()
    private lateinit var scheduleId: String

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityScheduleSignUpBinding.inflate(layoutInflater)
        setContentView(binding.root)

        scheduleId = intent.getStringExtra("scheduleId") ?: return

        binding.signupsRecyclerView.layoutManager = LinearLayoutManager(this)

        val token = "Bearer ${SessionManager.getAuthToken(this)}"
        homeViewModel.getScheduleSignups(token, scheduleId, loadingViewModel)

        homeViewModel.scheduleSignups.observe(this) { signups ->
            binding.signupsRecyclerView.adapter = ScheduleSignUpAdapter(signups)
        }

        binding.completePlanningButton.setOnClickListener {
            homeViewModel.completeSchedulePlanning(token, scheduleId, loadingViewModel)
            finish()
        }

        binding.deleteScheduleButton.setOnClickListener {
            homeViewModel.deleteSchedule(token, scheduleId, loadingViewModel)
            finish()
        }

        loadingViewModel.isLoading.observe(this) { isLoading ->
            // Show/hide a progress bar or loading indicator
        }

        homeViewModel.forceLogout.observe(this) { event ->
            event.getContentIfNotHandled()?.let {
                Toast.makeText(this, "Session expired. Please log in again.", Toast.LENGTH_SHORT).show()
                // Navigate to login screen
            }
        }
    }
}
