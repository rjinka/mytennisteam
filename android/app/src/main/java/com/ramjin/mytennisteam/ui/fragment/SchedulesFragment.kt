package com.ramjin.mytennisteam.ui.fragment

import android.app.TimePickerDialog
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ArrayAdapter
import android.widget.AutoCompleteTextView
import android.widget.Button
import android.widget.CheckBox
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.core.view.children
import androidx.core.view.isVisible
import androidx.fragment.app.Fragment
import androidx.fragment.app.activityViewModels
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.google.android.material.textfield.TextInputEditText
import com.google.android.material.textfield.TextInputLayout
import com.ramjin.mytennisteam.R
import com.ramjin.mytennisteam.data.model.*
import com.ramjin.mytennisteam.databinding.FragmentSchedulesBinding
import com.ramjin.mytennisteam.ui.adapter.ScheduleAdapter
import com.ramjin.mytennisteam.ui.adapter.ScheduleSignUpAdapter
import com.ramjin.mytennisteam.ui.adapter.ScheduleStatsAdapter
import com.ramjin.mytennisteam.util.SessionManager
import com.ramjin.mytennisteam.viewmodel.HomeViewModel
import com.ramjin.mytennisteam.viewmodel.LoadingViewModel
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale

class SchedulesFragment : Fragment() {

    private var _binding: FragmentSchedulesBinding? = null
    private val binding get() = _binding!!

    private val homeViewModel: HomeViewModel by activityViewModels()
    private val loadingViewModel: LoadingViewModel by activityViewModels()
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
            showCreateOrEditScheduleDialog(null)
        }

        binding.swipeRefreshLayout.setOnRefreshListener {
            val rawToken = SessionManager.getAuthToken(requireContext())
            if (rawToken != null) {
                homeViewModel.refreshHomeData("Bearer $rawToken", loadingViewModel)
            }
        }

        if (childFragmentManager.findFragmentById(R.id.schedule_detail_container) == null) {
            childFragmentManager.beginTransaction()
                .add(R.id.schedule_detail_container, ScheduleDetailFragment())
                .commit()
        }
    }

    private fun setupRecyclerView() {
        val currentUserId = SessionManager.getUserId(requireContext())
        val isSuperAdmin = SessionManager.isSuperAdmin(requireContext())
        val groupAdmins = homeViewModel.homeData.value?.selectedGroup?.admins ?: emptyList()

        scheduleAdapter = ScheduleAdapter(
            onItemClicked = { schedule ->
                val rawToken = SessionManager.getAuthToken(requireContext())
                if (rawToken != null) {
                    homeViewModel.onScheduleSelected(schedule, "Bearer $rawToken", loadingViewModel)
                }
            },
            onEditClicked = { schedule ->
                showCreateOrEditScheduleDialog(schedule)
            },
            onDeleteClicked = { schedule ->
                showDeleteScheduleConfirmation(schedule)
            },
            onStatsClicked = { schedule ->
                showScheduleStatsDialog(schedule)
            },
            onViewSignupsClicked = { schedule ->
                showScheduleSignupsDialog(schedule)
            },
            currentUserId = currentUserId,
            isSuperAdmin = isSuperAdmin,
            groupAdmins = groupAdmins
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
                binding.swipeRefreshLayout.isRefreshing = false

                val currentUserId = SessionManager.getUserId(requireContext())
                val isSuperAdmin = SessionManager.isSuperAdmin(requireContext())
                scheduleAdapter.updateGroupAdmins(data.selectedGroup.admins)
                val isGroupAdmin = data.selectedGroup.admins.contains(currentUserId)

                val canManageSchedules = isSuperAdmin || isGroupAdmin
                binding.fabAddSchedule.visibility = if (canManageSchedules) View.VISIBLE else View.GONE
            }
        }

        homeViewModel.selectedSchedule.observe(viewLifecycleOwner) { schedule ->
            val isScheduleSelected = schedule != null
            binding.scheduleDetailContainer.isVisible = isScheduleSelected
            binding.schedulesRecyclerView.isVisible = !isScheduleSelected

            val currentUserId = SessionManager.getUserId(requireContext())
            val isSuperAdmin = SessionManager.isSuperAdmin(requireContext())
            val isGroupAdmin = homeViewModel.homeData.value?.selectedGroup?.admins?.contains(currentUserId) == true
            binding.fabAddSchedule.isVisible = isSuperAdmin || isGroupAdmin
        }
    }

    private fun showCreateOrEditScheduleDialog(schedule: Schedule?) {
        val currentGroup = homeViewModel.homeData.value?.selectedGroup
        if (currentGroup == null) {
            Toast.makeText(context, "Please select a group first", Toast.LENGTH_SHORT).show()
            return
        }

        val dialogView = LayoutInflater.from(context).inflate(R.layout.dialog_create_schedule, null)
        val nameEditText = dialogView.findViewById<TextInputEditText>(R.id.schedule_name_edit_text)
        val daySpinner = dialogView.findViewById<AutoCompleteTextView>(R.id.schedule_day_spinner)
        val timeEditText = dialogView.findViewById<TextInputEditText>(R.id.schedule_time_edit_text)
        val durationEditText = dialogView.findViewById<TextInputEditText>(R.id.schedule_duration_edit_text)
        val courtsContainer = dialogView.findViewById<LinearLayout>(R.id.courts_checkbox_container)
        val recurringCheckbox = dialogView.findViewById<CheckBox>(R.id.recurring_checkbox)
        val recurrenceOptionsContainer = dialogView.findViewById<LinearLayout>(R.id.recurrence_options_container)
        val recurrenceSpinner = dialogView.findViewById<AutoCompleteTextView>(R.id.recurrence_spinner)
        val recurrenceCountEditText = dialogView.findViewById<TextInputEditText>(R.id.recurrence_count_edit_text)

        val daysOfWeek = resources.getStringArray(R.array.days_of_week)
        val recurrenceOptions = resources.getStringArray(R.array.recurrence_options)
        val gameTypes = resources.getStringArray(R.array.game_type_options)

        daySpinner.setAdapter(ArrayAdapter(requireContext(), android.R.layout.simple_spinner_item, daysOfWeek))
        recurrenceSpinner.setAdapter(ArrayAdapter(requireContext(), android.R.layout.simple_spinner_item, recurrenceOptions))
        
        val gameTypeAdapter = ArrayAdapter(requireContext(), android.R.layout.simple_spinner_item, gameTypes)

        val availableCourts = homeViewModel.homeData.value?.courts ?: emptyList()
        availableCourts.forEach { court ->
            val courtSelectionView = LayoutInflater.from(context).inflate(R.layout.item_court_selection, courtsContainer, false)
            val checkBox = courtSelectionView.findViewById<CheckBox>(R.id.court_checkbox)
            val gameTypeSpinner = courtSelectionView.findViewById<AutoCompleteTextView>(R.id.game_type_spinner)
            checkBox.text = court.name
            checkBox.tag = court.id
            gameTypeSpinner.setAdapter(gameTypeAdapter)
            courtsContainer.addView(courtSelectionView)
        }
        
        timeEditText.setOnClickListener { 
            val calendar = Calendar.getInstance()
            val timeSetListener = TimePickerDialog.OnTimeSetListener { _, hour, minute ->
                calendar.set(Calendar.HOUR_OF_DAY, hour)
                calendar.set(Calendar.MINUTE, minute)
                timeEditText.setText(SimpleDateFormat("hh:mm a", Locale.US).format(calendar.time))
            }
            TimePickerDialog(context, timeSetListener, calendar.get(Calendar.HOUR_OF_DAY), calendar.get(Calendar.MINUTE), false).show()
        }

        recurringCheckbox.setOnCheckedChangeListener { _, isChecked ->
            recurrenceOptionsContainer.isVisible = isChecked
        }

        schedule?.let {
            nameEditText.setText(it.name)
            daySpinner.setText(daysOfWeek.getOrNull(it.day.toIntOrNull() ?: -1), false)
            timeEditText.setText(it.time)
            durationEditText.setText(it.duration.toInt().toString())
            recurringCheckbox.isChecked = it.recurring
            recurrenceSpinner.setText(recurrenceOptions.getOrNull(it.frequency), false)
            recurrenceCountEditText.setText(it.recurrenceCount.toString())

            it.courts.forEach { scheduleCourt ->
                val courtView = courtsContainer.children.find { view -> view.findViewById<CheckBox>(
                    R.id.court_checkbox).tag == scheduleCourt.courtId }
                courtView?.let {
                    it.findViewById<CheckBox>(R.id.court_checkbox).isChecked = true
                    val gameTypeIndex = scheduleCourt.gameType.toIntOrNull() ?: 0
                    it.findViewById<AutoCompleteTextView>(R.id.game_type_spinner).setText(gameTypes.getOrNull(gameTypeIndex), false)
                }
            }
        }

        val dialogTitle = if (schedule == null) "Create New Schedule" else "Edit Schedule"
        val dialog = AlertDialog.Builder(requireContext())
            .setTitle(dialogTitle)
            .setView(dialogView)
            .setPositiveButton(if (schedule == null) "Create" else "Save", null)
            .setNegativeButton("Cancel", null)
            .create()

        dialog.setOnShowListener { _ ->
            val positiveButton = dialog.getButton(AlertDialog.BUTTON_POSITIVE)
            positiveButton.setOnClickListener { 
                var isValid = true
                val selectedCourts = courtsContainer.children.mapNotNull { courtView ->
                    val checkBox = courtView.findViewById<CheckBox>(R.id.court_checkbox)
                    val gameTypeLayout = courtView.findViewById<TextInputLayout>(R.id.game_type_layout)
                    val gameTypeSpinner = courtView.findViewById<AutoCompleteTextView>(R.id.game_type_spinner)
                    if (checkBox.isChecked) {
                        if (gameTypeSpinner.text.toString().isBlank() || !gameTypes.contains(gameTypeSpinner.text.toString())) {
                            gameTypeLayout.error = "Required"
                            isValid = false
                            null
                        } else {
                            gameTypeLayout.error = null
                            val gameTypeIndex = gameTypes.indexOf(gameTypeSpinner.text.toString()).toString()
                            ScheduleCourtInfo(courtId = checkBox.tag.toString(), gameType = gameTypeIndex)
                        }
                    } else null
                }.toList()

                if (!isValid) return@setOnClickListener

                val name = nameEditText.text.toString().trim()
                val day = daySpinner.text.toString()
                val time = timeEditText.text.toString().trim()
                val duration = durationEditText.text.toString().toDoubleOrNull()
                val isRecurring = recurringCheckbox.isChecked
                val recurrence = recurrenceSpinner.text.toString()
                val recurrenceCount = recurrenceCountEditText.text.toString().toIntOrNull() ?: 1

                if (name.isBlank() || day.isBlank() || time.isBlank() || duration == null || selectedCourts.isEmpty()) {
                    Toast.makeText(context, "Please fill all required fields and select at least one court.", Toast.LENGTH_LONG).show()
                    return@setOnClickListener
                }

                val maxPlayers = selectedCourts.map { if (it.gameType == "1") 4 else 2 }.sum()

                val rawToken = SessionManager.getAuthToken(requireContext())
                if (rawToken != null) {
                    val token = "Bearer $rawToken"
                    if (schedule == null) {
                        val request = CreateScheduleRequest(
                            name = name,
                            groupId = currentGroup.id,
                            day = daysOfWeek.indexOf(day).toString(),
                            time = time,
                            duration = duration,
                            courts = selectedCourts,
                            recurring = isRecurring,
                            frequency = recurrenceOptions.indexOf(recurrence),
                            recurrenceCount = recurrenceCount,
                            maxPlayersCount = maxPlayers)
                        homeViewModel.createSchedule(token, request, loadingViewModel)
                    } else {
                        val request = UpdateScheduleRequest(
                            name = name,
                            groupId = currentGroup.id,
                            day = daysOfWeek.indexOf(day).toString(),
                            time = time,
                            duration = duration,
                            courts = selectedCourts,
                            recurring = isRecurring,
                            frequency = recurrenceOptions.indexOf(recurrence),
                            recurrenceCount = recurrenceCount,
                            maxPlayersCount = maxPlayers)
                        homeViewModel.updateSchedule(token, schedule.id, request, loadingViewModel)
                    }
                    dialog.dismiss()
                }
            }
        }
        dialog.show()
    }
    
    private fun showDeleteScheduleConfirmation(schedule: Schedule) { 
        AlertDialog.Builder(requireContext())
            .setTitle("Delete Schedule")
            .setMessage("Are you sure you want to delete '${schedule.name}'?")
            .setPositiveButton("Delete") { _, _ ->
                val rawToken = SessionManager.getAuthToken(requireContext())
                if (rawToken != null) {
                    homeViewModel.deleteSchedule("Bearer $rawToken", schedule.id, loadingViewModel)
                }
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun showScheduleStatsDialog(schedule: Schedule) {
        val rawToken = SessionManager.getAuthToken(requireContext())
        if (rawToken == null) {
            Toast.makeText(context, "Authentication error", Toast.LENGTH_SHORT).show()
            return
        }

        homeViewModel.fetchScheduleStats("Bearer $rawToken", schedule.id, loadingViewModel)

        val dialogView = LayoutInflater.from(requireContext()).inflate(R.layout.dialog_schedule_stats, null)
        val statsTitle = dialogView.findViewById<TextView>(R.id.stats_title)
        val statsRecyclerView = dialogView.findViewById<RecyclerView>(R.id.stats_recycler_view)
        val closeButton = dialogView.findViewById<Button>(R.id.close_button)

        statsTitle.text = "Stats for ${schedule.name}"
        val statsAdapter = ScheduleStatsAdapter()
        statsRecyclerView.adapter = statsAdapter
        statsRecyclerView.layoutManager = LinearLayoutManager(context)

        val dialog = AlertDialog.Builder(requireContext())
            .setView(dialogView)
            .create()

        closeButton.setOnClickListener {
            dialog.dismiss()
            homeViewModel.scheduleStats.removeObservers(viewLifecycleOwner)
        }

        homeViewModel.scheduleStats.observe(viewLifecycleOwner) { stats ->
            if (stats != null) {
                val formattedStats = stats.mapNotNull { scheduleStat ->
                    // The playerId is already populated with the player object from the backend
                    val player = scheduleStat.playerId
                    val availability = player.availability.find { it.scheduleId == schedule.id }?.type ?: "N/A"
                    val timesPlayed = scheduleStat.stats.count { it.status == "played" }
                    val timesOnBench = scheduleStat.stats.count { it.status == "benched" }
                    val isPlayerOut = availability.equals("out", ignoreCase = true)

                    FormattedScheduleStat(
                        playerName = player.user.name,
                        availability = availability,
                        timesPlayed = timesPlayed,
                        timesOnBench = timesOnBench,
                        isPlayerOut = isPlayerOut
                    )
                }
                statsAdapter.submitList(formattedStats)
            }
        }

        dialog.show()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }

    private fun showScheduleSignupsDialog(schedule: Schedule) {
        val rawToken = SessionManager.getAuthToken(requireContext())
        if (rawToken == null) {
            Toast.makeText(context, "Authentication error", Toast.LENGTH_SHORT).show()
            return
        }
        val token = "Bearer $rawToken"

        homeViewModel.getScheduleSignups(token, schedule.id, loadingViewModel)

        val dialogView = LayoutInflater.from(requireContext()).inflate(R.layout.dialog_schedule_signups, null)
        val dialogTitle = dialogView.findViewById<TextView>(R.id.signups_title)
        val signupsRecyclerView = dialogView.findViewById<RecyclerView>(R.id.signups_recycler_view)
        val completeButton = dialogView.findViewById<Button>(R.id.complete_planning_button)
        val deleteButton = dialogView.findViewById<Button>(R.id.delete_schedule_button)
        val closeButton = dialogView.findViewById<Button>(R.id.close_button)

        dialogTitle.text = "Sign-ups for ${schedule.name}"

        val signUpAdapter = ScheduleSignUpAdapter()
        signupsRecyclerView.adapter = signUpAdapter
        signupsRecyclerView.layoutManager = LinearLayoutManager(context)

        val dialog = AlertDialog.Builder(requireContext())
            .setView(dialogView)
            .create()

        homeViewModel.scheduleSignups.observe(viewLifecycleOwner) { signups ->
            signUpAdapter.submitList(signups)
        }

        completeButton.setOnClickListener {
            homeViewModel.completeSchedulePlanning(token, schedule.id, loadingViewModel)
            dialog.dismiss()
        }

        deleteButton.setOnClickListener {
            dialog.dismiss() // Dismiss the sign-up dialog first
            showDeleteScheduleConfirmation(schedule)
        }

        closeButton.setOnClickListener {
            dialog.dismiss()
        }

        dialog.setOnDismissListener {
            homeViewModel.scheduleSignups.removeObservers(viewLifecycleOwner)
        }

        dialog.show()
    }
}
