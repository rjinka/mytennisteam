package com.ramjin.mytennisteam

import android.app.AlertDialog
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ArrayAdapter
import android.widget.AutoCompleteTextView
import android.widget.Button
import android.widget.CheckBox
import android.widget.TextView
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.fragment.app.activityViewModels
import androidx.recyclerview.widget.GridLayoutManager
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.google.android.material.textfield.TextInputLayout
import com.ramjin.mytennisteam.databinding.FragmentScheduleDetailBinding

class ScheduleDetailFragment : Fragment() {

    private var _binding: FragmentScheduleDetailBinding? = null
    private val binding get() = _binding!!

    private val homeViewModel: HomeViewModel by activityViewModels()
    private val loadingViewModel: LoadingViewModel by activityViewModels()

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentScheduleDetailBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        homeViewModel.selectedSchedule.observe(viewLifecycleOwner) { schedule ->
            if (schedule != null) {
                val frequencyText = when (schedule.frequency) {
                    0 -> "None"
                    1 -> "Day"
                    2 -> "Week"
                    3 -> "Bi-Week"
                    4 -> "Month"
                    else -> "Period"
                }
                binding.lineupTitleTextView.text = "${schedule.name} Lineup ($frequencyText ${schedule.week})"
                val allPlayers = homeViewModel.homeData.value?.players ?: emptyList()

                updatePlayerList(binding.playingPlayersRecyclerView, schedule.playingPlayersIds, allPlayers, isBench = false)
                updatePlayerList(binding.benchPlayersRecyclerView, schedule.benchPlayersIds, allPlayers, isBench = true)

                binding.generateRotationButton.setOnClickListener {
                    val rawToken = SessionManager.getAuthToken(requireContext())
                    if (rawToken != null) {
                        homeViewModel.generateRotation("Bearer $rawToken", schedule.id, loadingViewModel)
                    }
                }
            }
        }

        homeViewModel.rotationButtonState.observe(viewLifecycleOwner) { state ->
            if(state != null) {
                binding.generateRotationButton.visibility = if (state.visible) View.VISIBLE else View.GONE
                binding.generateRotationButton.isEnabled = !state.disabled
                binding.generateRotationButton.text = state.text
            }
        }

        binding.backButton.setOnClickListener {
            homeViewModel.onScheduleDeselected()
        }
    }

    private fun updatePlayerList(recyclerView: RecyclerView, playerIds: List<String>, allPlayers: List<Player>, isBench: Boolean) {
        val currentUserId = SessionManager.getUserId(requireContext())
        val isSuperAdmin = SessionManager.isSuperAdmin(requireContext())
        val groupAdmins = homeViewModel.homeData.value?.selectedGroup?.admins ?: emptyList()

        val adapter = PlayerLineupAdapter(
            isBench,
            onSwapClicked = { playerToSwapOut ->
                val rawToken = SessionManager.getAuthToken(requireContext())
                val schedule = homeViewModel.selectedSchedule.value
                if (rawToken != null && schedule != null) {
                    showSwapPlayerDialog(playerToSwapOut, isBench, allPlayers, schedule)
                }
            },
            onStatsClicked = { player ->
                showPlayerAvailabilityDialog(player)
            },
            currentUserId = currentUserId,
            isSuperAdmin = isSuperAdmin,
            groupAdmins = groupAdmins
        )
        recyclerView.adapter = adapter
        recyclerView.layoutManager = if (isBench) LinearLayoutManager(context) else GridLayoutManager(context, 2)
        
        val players = playerIds.mapNotNull { playerId -> allPlayers.find { it.id == playerId } }
        adapter.submitList(players)
    }

    private fun showPlayerAvailabilityDialog(player: Player) {
        val dialogView = LayoutInflater.from(context).inflate(R.layout.dialog_player_availability, null)
        val availabilityTitle = dialogView.findViewById<TextView>(R.id.availability_title)
        val availabilityRecyclerView = dialogView.findViewById<RecyclerView>(R.id.availability_recycler_view)
        val closeButton = dialogView.findViewById<Button>(R.id.close_button)

        availabilityTitle.text = "Availability for ${player.user.name}"
        val availabilityAdapter = AvailabilityAdapter()
        availabilityRecyclerView.adapter = availabilityAdapter
        availabilityRecyclerView.layoutManager = LinearLayoutManager(context)

        val dialog = AlertDialog.Builder(requireContext())
            .setView(dialogView)
            .create()

        closeButton.setOnClickListener {
            dialog.dismiss()
        }

        val allSchedules = homeViewModel.homeData.value?.schedules ?: emptyList()
        val availability = player.availability.mapNotNull { availability ->
            val schedule = allSchedules.find { it.id == availability.scheduleId }
            if (schedule != null) {
                Pair("${schedule.name} (${schedule.day} at ${schedule.time})", availability.type)
            } else {
                null
            }
        }
        availabilityAdapter.submitList(availability)

        dialog.show()
    }

    private fun showSwapPlayerDialog(playerToSwapOut: Player, isBench: Boolean, allPlayers: List<Player>, schedule: Schedule) {
        val dialogView = LayoutInflater.from(context).inflate(R.layout.dialog_swap_player, null)
        val title = dialogView.findViewById<TextView>(R.id.swap_title_text_view)
        val subtitle = dialogView.findViewById<TextView>(R.id.swap_subtitle_text_view)
        val spinner = dialogView.findViewById<AutoCompleteTextView>(R.id.player_to_swap_spinner)
        val swapWithBackupCheckbox = dialogView.findViewById<CheckBox>(R.id.swap_with_backup_checkbox)
        val backupSpinnerLayout = dialogView.findViewById<TextInputLayout>(R.id.backup_player_to_swap_layout)
        val backupSpinner = dialogView.findViewById<AutoCompleteTextView>(R.id.backup_player_to_swap_spinner)

        title.text = "Swap ${playerToSwapOut.user.name}"
        subtitle.text = if (isBench) "Move to Playing" else "Move to Bench"

        // Regular swap candidates (playing <-> bench)
        val regularSwapCandidates = if (isBench) {
            allPlayers.filter { it.id in schedule.playingPlayersIds }
        } else {
            allPlayers.filter { it.id in schedule.benchPlayersIds }
        }
        val regularAdapter = ArrayAdapter(requireContext(), android.R.layout.simple_spinner_item, regularSwapCandidates.map { it.user.name })
        spinner.setAdapter(regularAdapter)

        // Backup player candidates
        val backupPlayers = allPlayers.filter { player ->
            // A player cannot be swapped with themselves.
            player.id != playerToSwapOut.id && player.availability.any { it.scheduleId == schedule.id && it.type == "Backup" }
        }

        val backupAdapter = ArrayAdapter(requireContext(), android.R.layout.simple_spinner_item, backupPlayers.map { it.user.name })
        backupSpinner.setAdapter(backupAdapter)

        var selectedPlayer: Player? = null
        spinner.setOnItemClickListener { _, _, position, _ ->
            selectedPlayer = regularSwapCandidates.getOrNull(position)
        }
        backupSpinner.setOnItemClickListener { _, _, position, _ ->
            selectedPlayer = backupPlayers.getOrNull(position)
        }

        swapWithBackupCheckbox.setOnCheckedChangeListener { _, isChecked ->
            backupSpinnerLayout.visibility = if (isChecked) View.VISIBLE else View.GONE
            dialogView.findViewById<TextInputLayout>(R.id.player_to_swap_layout).visibility = if (isChecked) View.GONE else View.VISIBLE
            spinner.text.clear()
            backupSpinner.text.clear()
        }

        AlertDialog.Builder(requireContext())
            .setTitle("Confirm Swap")
            .setView(dialogView)
            .setPositiveButton("Confirm Swap") { _, _ ->
                val playerToSwapIn = selectedPlayer

                if (playerToSwapIn == null) {
                    Toast.makeText(context, "Please select a valid player to swap with.", Toast.LENGTH_SHORT).show()
                    return@setPositiveButton
                }

                val rawToken = SessionManager.getAuthToken(requireContext())
                if (rawToken != null) {
                    // The player being moved out of the rotation is always `playerOutId`.
                    // The player being moved into the rotation is always `playerInId`.
                    // If a player is on the bench, they are "out" and we are swapping them "in".
                    val finalPlayerInId = if (isBench) playerToSwapOut.id else playerToSwapIn.id
                    val finalPlayerOutId = if (isBench) playerToSwapIn.id else playerToSwapOut.id
                    homeViewModel.swapPlayer("Bearer $rawToken", schedule.id, finalPlayerInId, finalPlayerOutId, loadingViewModel)
                } else {
                    Toast.makeText(context, "Authentication error.", Toast.LENGTH_SHORT).show()
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
