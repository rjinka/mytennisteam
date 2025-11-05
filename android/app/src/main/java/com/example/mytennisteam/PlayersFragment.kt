package com.example.mytennisteam

import android.os.Bundle
import android.util.Patterns
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ArrayAdapter
import android.widget.AutoCompleteTextView
import android.widget.CheckBox
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.widget.SearchView
import androidx.core.view.children
import androidx.fragment.app.Fragment
import androidx.fragment.app.activityViewModels
import androidx.recyclerview.widget.LinearLayoutManager
import com.example.mytennisteam.databinding.FragmentPlayersBinding
import com.google.android.material.textfield.TextInputEditText
import com.google.android.material.textfield.TextInputLayout

class PlayersFragment : Fragment() {

    private var _binding: FragmentPlayersBinding? = null
    private val binding get() = _binding!!

    private val homeViewModel: HomeViewModel by activityViewModels()
    private lateinit var playerAdapter: PlayerAdapter
    private var allPlayers: List<Player> = emptyList()

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentPlayersBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        setupRecyclerView()
        observeViewModel()
        setupSearchView()

        binding.fabAddPlayer.setOnClickListener {
            showInvitePlayerDialog()
        }
    }

    private fun setupRecyclerView() {
        playerAdapter = PlayerAdapter(
            onEditClicked = { player ->
                showEditPlayerDialog(player)
            },
            onDeleteClicked = { player ->
                showDeletePlayerConfirmation(player)
            }
        )
        binding.playersRecyclerView.apply {
            adapter = playerAdapter
            layoutManager = LinearLayoutManager(context)
        }
    }

    private fun observeViewModel() {
        homeViewModel.homeData.observe(viewLifecycleOwner) { data ->
            if (data != null) {
                allPlayers = data.players
                playerAdapter.submitList(allPlayers)
            }
        }
    }

    private fun setupSearchView() {
        binding.playerSearchView.setOnQueryTextListener(object : SearchView.OnQueryTextListener {
            override fun onQueryTextSubmit(query: String?): Boolean {
                return false
            }

            override fun onQueryTextChange(newText: String?): Boolean {
                val filteredList = allPlayers.filter { player ->
                    player.user.name.contains(newText ?: "", ignoreCase = true)
                }
                playerAdapter.submitList(filteredList)
                return true
            }
        })
    }

    private fun showInvitePlayerDialog() {
        // ... (Implementation remains the same) ...
    }

    private fun showEditPlayerDialog(player: Player) {
        val dialogView = LayoutInflater.from(context).inflate(R.layout.dialog_edit_player, null)
        val nameEditText = dialogView.findViewById<TextInputEditText>(R.id.player_name_edit_text)
        val schedulesContainer = dialogView.findViewById<LinearLayout>(R.id.schedule_availability_container)
        
        nameEditText.setText(player.user.name)

        val availabilityOptions = resources.getStringArray(R.array.availability_options)
        val availabilityAdapter = ArrayAdapter(requireContext(), android.R.layout.simple_spinner_item, availabilityOptions)

        val availableSchedules = homeViewModel.homeData.value?.schedules ?: emptyList()
        availableSchedules.forEach { schedule ->
            val scheduleView = LayoutInflater.from(context).inflate(R.layout.item_schedule_availability, schedulesContainer, false)
            val checkBox = scheduleView.findViewById<CheckBox>(R.id.schedule_checkbox)
            val spinner = scheduleView.findViewById<AutoCompleteTextView>(R.id.availability_spinner)

            checkBox.text = "${schedule.name} (${schedule.day} at ${schedule.time})"
            checkBox.tag = schedule.id
            spinner.setAdapter(availabilityAdapter)

            player.availability.find { it.scheduleId == schedule.id }?.let {
                checkBox.isChecked = true
                spinner.setText(it.type, false)
            }

            schedulesContainer.addView(scheduleView)
        }

        AlertDialog.Builder(requireContext())
            .setTitle("Edit Player Details")
            .setView(dialogView)
            .setPositiveButton("Save Changes") { _, _ ->
                val newName = nameEditText.text.toString().trim()
                val newAvailability = schedulesContainer.children.mapNotNull { view ->
                    val checkBox = view.findViewById<CheckBox>(R.id.schedule_checkbox)
                    val spinner = view.findViewById<AutoCompleteTextView>(R.id.availability_spinner)
                    if (checkBox.isChecked) {
                        PlayerAvailability(scheduleId = checkBox.tag.toString(), type = spinner.text.toString())
                    } else null
                }.toList()

                if (newName.isNotBlank()) {
                    val rawToken = SessionManager.getAuthToken(requireContext())
                    if (rawToken != null) {
                        homeViewModel.updatePlayer("Bearer $rawToken", player.id, newName, newAvailability)
                    }
                }
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun showDeletePlayerConfirmation(player: Player) {
        AlertDialog.Builder(requireContext())
            .setTitle("Delete Player")
            .setMessage("Are you sure you want to remove '${player.user.name}' from this group?")
            .setPositiveButton("Delete") { _, _ ->
                val rawToken = SessionManager.getAuthToken(requireContext())
                if (rawToken != null) {
                    homeViewModel.deletePlayer("Bearer $rawToken", player.id)
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
