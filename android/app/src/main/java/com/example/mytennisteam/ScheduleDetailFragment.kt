package com.example.mytennisteam

import android.app.AlertDialog
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ArrayAdapter
import android.widget.AutoCompleteTextView
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.fragment.app.activityViewModels
import androidx.recyclerview.widget.GridLayoutManager
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.mytennisteam.databinding.FragmentScheduleDetailBinding

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
                binding.lineupTitleTextView.text = "${schedule.name} Lineup (Week ${schedule.week})"
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
            }
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

        title.text = "Swap ${playerToSwapOut.user.name}"
        subtitle.text = "Swap ${playerToSwapOut.user.name} with:"

        val swapCandidates = if (isBench) {
            allPlayers.filter { it.id in schedule.playingPlayersIds }
        } else {
            allPlayers.filter { it.id in schedule.benchPlayersIds }
        }

        val adapter = ArrayAdapter(requireContext(), android.R.layout.simple_spinner_item, swapCandidates.map { it.user.name })
        spinner.setAdapter(adapter)

        AlertDialog.Builder(requireContext())
            .setTitle("Confirm Swap")
            .setView(dialogView)
            .setPositiveButton("Confirm Swap") { _, _ ->
                val selectedPlayerName = spinner.text.toString()
                val playerToSwapIn = swapCandidates.find { it.user.name == selectedPlayerName }

                if (playerToSwapIn != null) {
                    val rawToken = SessionManager.getAuthToken(requireContext())
                    if (rawToken != null) {
                        homeViewModel.swapPlayer("Bearer $rawToken", schedule.id, playerToSwapIn.id, playerToSwapOut.id, loadingViewModel)
                    }
                } else {
                    Toast.makeText(context, "Please select a player to swap with.", Toast.LENGTH_SHORT).show()
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
