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
import com.example.mytennisteam.databinding.FragmentGroupsBinding
import com.google.android.material.textfield.TextInputLayout

class GroupsFragment : Fragment() {

    private var _binding: FragmentGroupsBinding? = null
    private val binding get() = _binding!!

    private val homeViewModel: HomeViewModel by activityViewModels()

    private lateinit var groupAdapter: GroupAdapter
    private lateinit var courtAdapter: CourtAdapter

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentGroupsBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        setupRecyclerViews()
        observeViewModel()

        binding.createNewGroupButton.setOnClickListener {
            showCreateGroupDialog()
        }

        binding.createNewCourtButton.setOnClickListener {
            showCreateCourtDialog()
        }
    }

    private fun setupRecyclerViews() {
        groupAdapter = GroupAdapter(
            onGroupSelected = { group ->
                val rawToken = SessionManager.getAuthToken(requireContext())
                if (rawToken != null) {
                    homeViewModel.loadDataForGroup("Bearer $rawToken", group)
                }
            },
            onEditClicked = { group ->
                showEditGroupDialog(group)
            },
            onDeleteClicked = { group ->
                showDeleteGroupConfirmation(group)
            }
        )
        binding.groupsRecyclerView.apply {
            adapter = groupAdapter
            layoutManager = LinearLayoutManager(context)
            isNestedScrollingEnabled = false
        }

        courtAdapter = CourtAdapter(
            onEditClicked = { court ->
                showEditCourtDialog(court)
            },
            onDeleteClicked = { court ->
                showDeleteCourtConfirmation(court)
            }
        )
        binding.courtsRecyclerView.apply {
            adapter = courtAdapter
            layoutManager = LinearLayoutManager(context)
            isNestedScrollingEnabled = false
        }
    }

    private fun observeViewModel() {
        homeViewModel.allGroups.observe(viewLifecycleOwner) { groups ->
            groupAdapter.submitList(groups)
        }

        homeViewModel.homeData.observe(viewLifecycleOwner) { data ->
            if (data != null) {
                groupAdapter.setSelectedGroup(data.selectedGroup)
                courtAdapter.submitList(data.courts)
            }
        }
    }

    private fun showCreateGroupDialog() {
        val dialogView = LayoutInflater.from(context).inflate(R.layout.dialog_edit_group, null)
        val textInputLayout = dialogView.findViewById<TextInputLayout>(R.id.new_group_name_input_layout)
        val groupNameEditText = dialogView.findViewById<EditText>(R.id.new_group_name_edit_text)

        val dialog = AlertDialog.Builder(requireContext())
            .setTitle("Create New Group")
            .setView(dialogView)
            .setPositiveButton("Create", null) 
            .setNegativeButton("Cancel", null)
            .create()

        dialog.setOnShowListener { _ ->
            val positiveButton = dialog.getButton(AlertDialog.BUTTON_POSITIVE)
            positiveButton.setOnClickListener { 
                val groupName = groupNameEditText.text.toString().trim()
                if (groupName.isNotBlank()) {
                    val rawToken = SessionManager.getAuthToken(requireContext())
                    if (rawToken != null) {
                        homeViewModel.createGroup("Bearer $rawToken", groupName)
                        dialog.dismiss()
                    }
                } else {
                    textInputLayout.error = "Required field"
                }
            }
        }
        dialog.show()
    }

    private fun showEditGroupDialog(group: Group) {
        val dialogView = LayoutInflater.from(context).inflate(R.layout.dialog_edit_group, null)
        val textInputLayout = dialogView.findViewById<TextInputLayout>(R.id.new_group_name_input_layout)
        val newGroupNameEditText = dialogView.findViewById<EditText>(R.id.new_group_name_edit_text)
        newGroupNameEditText.setText(group.name)

        val dialog = AlertDialog.Builder(requireContext())
            .setTitle("Edit Group Name")
            .setView(dialogView)
            .setPositiveButton("Save", null)
            .setNegativeButton("Cancel", null)
            .create()

        dialog.setOnShowListener { _ ->
            val positiveButton = dialog.getButton(AlertDialog.BUTTON_POSITIVE)
            positiveButton.setOnClickListener { 
                val newName = newGroupNameEditText.text.toString().trim()
                if (newName.isNotBlank()) {
                    if (newName != group.name) {
                        val rawToken = SessionManager.getAuthToken(requireContext())
                        if (rawToken != null) {
                            homeViewModel.updateGroup("Bearer $rawToken", group.id, newName)
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

    private fun showDeleteGroupConfirmation(group: Group) {
        AlertDialog.Builder(requireContext())
            .setTitle("Delete Group")
            .setMessage("Are you sure you want to delete '${group.name}'? This action cannot be undone.")
            .setPositiveButton("Delete") { _, _ ->
                val rawToken = SessionManager.getAuthToken(requireContext())
                if (rawToken != null) {
                    homeViewModel.deleteGroup("Bearer $rawToken", group.id)
                }
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun showCreateCourtDialog() {
        val currentGroup = homeViewModel.homeData.value?.selectedGroup
        if (currentGroup == null) {
            Toast.makeText(context, "Please select a group first", Toast.LENGTH_SHORT).show()
            return
        }

        val dialogView = LayoutInflater.from(context).inflate(R.layout.dialog_edit_group, null)
        val textInputLayout = dialogView.findViewById<TextInputLayout>(R.id.new_group_name_input_layout)
        val courtNameEditText = dialogView.findViewById<EditText>(R.id.new_group_name_edit_text)
        textInputLayout.hint = "Court Name"

        val dialog = AlertDialog.Builder(requireContext())
            .setTitle("Create New Court")
            .setView(dialogView)
            .setPositiveButton("Create", null)
            .setNegativeButton("Cancel", null)
            .create()

        dialog.setOnShowListener { _ ->
            val positiveButton = dialog.getButton(AlertDialog.BUTTON_POSITIVE)
            positiveButton.setOnClickListener { 
                val courtName = courtNameEditText.text.toString().trim()
                if (courtName.isNotBlank()) {
                    val rawToken = SessionManager.getAuthToken(requireContext())
                    if (rawToken != null) {
                        homeViewModel.createCourt("Bearer $rawToken", courtName, currentGroup.id)
                        dialog.dismiss()
                    }
                } else {
                    textInputLayout.error = "Required field"
                }
            }
        }
        dialog.show()
    }

    private fun showEditCourtDialog(court: Court) {
        val dialogView = LayoutInflater.from(context).inflate(R.layout.dialog_edit_group, null)
        val textInputLayout = dialogView.findViewById<TextInputLayout>(R.id.new_group_name_input_layout)
        val newCourtNameEditText = dialogView.findViewById<EditText>(R.id.new_group_name_edit_text)
        newCourtNameEditText.setText(court.name)
        textInputLayout.hint = "Court Name"

        val dialog = AlertDialog.Builder(requireContext())
            .setTitle("Edit Court Name")
            .setView(dialogView)
            .setPositiveButton("Save", null)
            .setNegativeButton("Cancel", null)
            .create()

        dialog.setOnShowListener { _ ->
            val positiveButton = dialog.getButton(AlertDialog.BUTTON_POSITIVE)
            positiveButton.setOnClickListener { 
                val newName = newCourtNameEditText.text.toString().trim()
                if (newName.isNotBlank()) {
                    if (newName != court.name) {
                        val rawToken = SessionManager.getAuthToken(requireContext())
                        if (rawToken != null) {
                            homeViewModel.updateCourt("Bearer $rawToken", court.id, newName, court.groupid)
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

    private fun showDeleteCourtConfirmation(court: Court) {
        AlertDialog.Builder(requireContext())
            .setTitle("Delete Court")
            .setMessage("Are you sure you want to delete '${court.name}'?")
            .setPositiveButton("Delete") { _, _ ->
                val rawToken = SessionManager.getAuthToken(requireContext())
                if (rawToken != null) {
                    homeViewModel.deleteCourt("Bearer $rawToken", court.id)
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
