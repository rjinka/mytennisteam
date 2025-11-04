package com.example.mytennisteam

import android.os.Bundle
import android.util.Patterns
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.EditText
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.widget.SearchView
import androidx.fragment.app.Fragment
import androidx.fragment.app.activityViewModels
import androidx.recyclerview.widget.LinearLayoutManager
import com.example.mytennisteam.databinding.FragmentPlayersBinding
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
                    player.name.contains(newText ?: "", ignoreCase = true)
                }
                playerAdapter.submitList(filteredList)
                return true
            }
        })
    }

    private fun showInvitePlayerDialog() {
        val currentGroup = homeViewModel.homeData.value?.selectedGroup
        if (currentGroup == null) {
            Toast.makeText(context, "Please select a group first", Toast.LENGTH_SHORT).show()
            return
        }

        val dialogView = LayoutInflater.from(context).inflate(R.layout.dialog_invite_player, null)
        val emailInputLayout = dialogView.findViewById<TextInputLayout>(R.id.player_email_input_layout)
        val emailEditText = dialogView.findViewById<EditText>(R.id.player_email_edit_text)

        val dialog = AlertDialog.Builder(requireContext())
            .setTitle("Invite Player")
            .setView(dialogView)
            .setPositiveButton("Send Invite", null)
            .setNegativeButton("Cancel", null)
            .create()

        dialog.setOnShowListener { _ ->
            val positiveButton = dialog.getButton(AlertDialog.BUTTON_POSITIVE)
            positiveButton.setOnClickListener { 
                val email = emailEditText.text.toString().trim()
                if (email.isNotBlank() && Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
                    val rawToken = SessionManager.getAuthToken(requireContext())
                    if (rawToken != null) {
                        homeViewModel.invitePlayer("Bearer $rawToken", currentGroup.id, email)
                        Toast.makeText(context, "Invitation sent to $email", Toast.LENGTH_SHORT).show()
                        dialog.dismiss()
                    }
                } else {
                    emailInputLayout.error = "Invalid email address"
                }
            }
        }
        dialog.show()
    }

    private fun showEditPlayerDialog(player: Player) {
        val dialogView = LayoutInflater.from(context).inflate(R.layout.dialog_edit_group, null)
        val textInputLayout = dialogView.findViewById<TextInputLayout>(R.id.new_group_name_input_layout)
        val newNameEditText = dialogView.findViewById<EditText>(R.id.new_group_name_edit_text)
        newNameEditText.setText(player.name)
        textInputLayout.hint = "Player Name"

        val dialog = AlertDialog.Builder(requireContext())
            .setTitle("Edit Player Name")
            .setView(dialogView)
            .setPositiveButton("Save", null)
            .setNegativeButton("Cancel", null)
            .create()

        dialog.setOnShowListener { _ ->
            val positiveButton = dialog.getButton(AlertDialog.BUTTON_POSITIVE)
            positiveButton.setOnClickListener { 
                val newName = newNameEditText.text.toString().trim()
                if (newName.isNotBlank()) {
                    if (newName != player.name) {
                        val rawToken = SessionManager.getAuthToken(requireContext())
                        if (rawToken != null) {
                            homeViewModel.updatePlayer("Bearer $rawToken", player.id, newName)
                        }
                    }
                    dialog.dismiss()
                } else {
                    textInputLayout.error = "Required field"
                }
            }
        }
        dialog.show()
    }

    private fun showDeletePlayerConfirmation(player: Player) {
        AlertDialog.Builder(requireContext())
            .setTitle("Delete Player")
            .setMessage("Are you sure you want to remove '${player.name}' from this group?")
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
