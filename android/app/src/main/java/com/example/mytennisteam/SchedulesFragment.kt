package com.example.mytennisteam

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.EditText
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.fragment.app.Fragment
import androidx.fragment.app.activityViewModels
import androidx.recyclerview.widget.LinearLayoutManager
import com.example.mytennisteam.databinding.FragmentSchedulesBinding

class SchedulesFragment : Fragment() {

    private var _binding: FragmentSchedulesBinding? = null
    private val binding get() = _binding!!

    private val homeViewModel: HomeViewModel by activityViewModels()
    private lateinit var scheduleAdapter: ScheduleAdapter

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentSchedulesBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        setupRecyclerView()
        observeViewModel()

        binding.fabAddSchedule.setOnClickListener {
            showCreateScheduleDialog()
        }
    }

    private fun setupRecyclerView() {
        scheduleAdapter = ScheduleAdapter(
            onEditClicked = { schedule ->
                showEditScheduleDialog(schedule)
            },
            onDeleteClicked = { schedule ->
                showDeleteScheduleConfirmation(schedule)
            }
        )
        binding.schedulesRecyclerView.apply {
            adapter = scheduleAdapter
            layoutManager = LinearLayoutManager(context)
        }
    }

    private fun observeViewModel() {
        homeViewModel.homeData.observe(viewLifecycleOwner) { data ->
            if (data != null) {
                scheduleAdapter.submitList(data.schedules)
            }
        }
    }

    private fun showCreateScheduleDialog() {
        val currentGroup = homeViewModel.homeData.value?.selectedGroup
        if (currentGroup == null) {
            Toast.makeText(context, "Please select a group first", Toast.LENGTH_SHORT).show()
            return
        }

        val dialogView = LayoutInflater.from(context).inflate(R.layout.dialog_create_schedule, null)
        val nameEditText = dialogView.findViewById<EditText>(R.id.schedule_name_edit_text)
        val dayEditText = dialogView.findViewById<EditText>(R.id.schedule_day_edit_text)
        val timeEditText = dialogView.findViewById<EditText>(R.id.schedule_time_edit_text)
        val durationEditText = dialogView.findViewById<EditText>(R.id.schedule_duration_edit_text)
        val gameTypeEditText = dialogView.findViewById<EditText>(R.id.schedule_gametype_edit_text)
        val maxPlayersEditText = dialogView.findViewById<EditText>(R.id.schedule_max_players_edit_text)

        AlertDialog.Builder(requireContext())
            .setTitle("Create New Schedule")
            .setView(dialogView)
            .setPositiveButton("Create") { _, _ ->
                val name = nameEditText.text.toString().trim()
                val day = dayEditText.text.toString().trim()
                val time = timeEditText.text.toString().trim()
                val duration = durationEditText.text.toString().toDoubleOrNull()
                val gameType = gameTypeEditText.text.toString().trim()
                val maxPlayers = maxPlayersEditText.text.toString().toIntOrNull()

                if (name.isNotBlank() && day.isNotBlank() && time.isNotBlank() && duration != null && gameType.isNotBlank() && maxPlayers != null) {
                    val rawToken = SessionManager.getAuthToken(requireContext())
                    if (rawToken != null) {
                        val request = CreateScheduleRequest(name, currentGroup.id, day, time, duration, gameType, maxPlayers)
                        homeViewModel.createSchedule("Bearer $rawToken", request)
                    }
                } else {
                    Toast.makeText(context, "All fields are required", Toast.LENGTH_LONG).show()
                }
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun showEditScheduleDialog(schedule: Schedule) {
        val dialogView = LayoutInflater.from(context).inflate(R.layout.dialog_create_schedule, null)
        val nameEditText = dialogView.findViewById<EditText>(R.id.schedule_name_edit_text)
        val dayEditText = dialogView.findViewById<EditText>(R.id.schedule_day_edit_text)
        val timeEditText = dialogView.findViewById<EditText>(R.id.schedule_time_edit_text)
        val durationEditText = dialogView.findViewById<EditText>(R.id.schedule_duration_edit_text)
        val gameTypeEditText = dialogView.findViewById<EditText>(R.id.schedule_gametype_edit_text)
        val maxPlayersEditText = dialogView.findViewById<EditText>(R.id.schedule_max_players_edit_text)

        nameEditText.setText(schedule.name)
        dayEditText.setText(schedule.day)
        timeEditText.setText(schedule.time)
        durationEditText.setText(schedule.duration.toString())
        gameTypeEditText.setText(schedule.gameType)
        maxPlayersEditText.setText(schedule.maxPlayersCount.toString())

        AlertDialog.Builder(requireContext())
            .setTitle("Edit Schedule")
            .setView(dialogView)
            .setPositiveButton("Save") { _, _ ->
                val name = nameEditText.text.toString().trim()
                val day = dayEditText.text.toString().trim()
                val time = timeEditText.text.toString().trim()
                val duration = durationEditText.text.toString().toDoubleOrNull()
                val gameType = gameTypeEditText.text.toString().trim()
                val maxPlayers = maxPlayersEditText.text.toString().toIntOrNull()

                if (name.isNotBlank() && day.isNotBlank() && time.isNotBlank() && duration != null && gameType.isNotBlank() && maxPlayers != null) {
                    val rawToken = SessionManager.getAuthToken(requireContext())
                    if (rawToken != null) {
                        val request = UpdateScheduleRequest(name, day, time, duration, gameType, maxPlayers)
                        homeViewModel.updateSchedule("Bearer $rawToken", schedule.id, request)
                    }
                } else {
                    Toast.makeText(context, "All fields are required", Toast.LENGTH_LONG).show()
                }
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun showDeleteScheduleConfirmation(schedule: Schedule) {
        AlertDialog.Builder(requireContext())
            .setTitle("Delete Schedule")
            .setMessage("Are you sure you want to delete '${schedule.name}'?")
            .setPositiveButton("Delete") { _, _ ->
                val rawToken = SessionManager.getAuthToken(requireContext())
                if (rawToken != null) {
                    homeViewModel.deleteSchedule("Bearer $rawToken", schedule.id)
                }
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
