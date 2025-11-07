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
import androidx.recyclerview.widget.GridLayoutManager
import com.example.mytennisteam.databinding.FragmentGroupsBinding

class GroupsFragment : Fragment() {

    private var _binding: FragmentGroupsBinding? = null
    private val binding get() = _binding!!

    private val homeViewModel: HomeViewModel by activityViewModels()
    private val loadingViewModel: LoadingViewModel by activityViewModels()

    private lateinit var groupAdapter: GroupAdapter

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentGroupsBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        setupRecyclerView()
        observeViewModel()

        binding.fabAddGroup.setOnClickListener {
            showCreateGroupDialog()
        }
    }

    private fun setupRecyclerView() {
        groupAdapter = GroupAdapter(
            onGroupSelected = { group ->
                val rawToken = SessionManager.getAuthToken(requireContext())
                if (rawToken != null) {
                    homeViewModel.loadDataForGroup("Bearer $rawToken", group, loadingViewModel)
                } else {
                    Toast.makeText(context, "Authentication error", Toast.LENGTH_SHORT).show()
                }
            },
            onEditClicked = { group ->
                showEditGroupDialog(group)
            },
            onDeleteClicked = { group ->
                showDeleteGroupConfirmation(group)
            },
            currentUserId = SessionManager.getUserId(requireContext()),
            isSuperAdmin = SessionManager.isSuperAdmin(requireContext())
        )
        binding.groupsRecyclerView.apply {
            adapter = groupAdapter
            layoutManager = GridLayoutManager(context, 2)
        }
    }

    private fun observeViewModel() {
        homeViewModel.allGroups.observe(viewLifecycleOwner) { groups ->
            groupAdapter.submitList(groups)
        }

        homeViewModel.homeData.observe(viewLifecycleOwner) { data ->
            if (data != null) {
                groupAdapter.setSelectedGroup(data.selectedGroup)
            }
        }
    }

    private fun showCreateGroupDialog() {
        val editText = EditText(requireContext()).apply {
            hint = "Group Name"
        }

        AlertDialog.Builder(requireContext())
            .setTitle("Create New Group")
            .setView(editText)
            .setPositiveButton("Create") { _, _ ->
                val groupName = editText.text.toString()
                if (groupName.isNotBlank()) {
                    val rawToken = SessionManager.getAuthToken(requireContext())
                    if (rawToken != null) {
                        homeViewModel.createGroup("Bearer $rawToken", groupName, loadingViewModel)
                    }
                }
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun showEditGroupDialog(group: Group) {
        val editText = EditText(requireContext()).apply {
            hint = "Group Name"
            setText(group.name)
        }

        AlertDialog.Builder(requireContext())
            .setTitle("Edit Group Name")
            .setView(editText)
            .setPositiveButton("Save") { _, _ ->
                val newGroupName = editText.text.toString()
                if (newGroupName.isNotBlank() && newGroupName != group.name) {
                    val rawToken = SessionManager.getAuthToken(requireContext())
                    if (rawToken != null) {
                        homeViewModel.updateGroup("Bearer $rawToken", group.id, newGroupName, loadingViewModel)
                    }
                }
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun showDeleteGroupConfirmation(group: Group) {
        AlertDialog.Builder(requireContext())
            .setTitle("Delete Group")
            .setMessage("Are you sure you want to delete the group '${group.name}'? This action cannot be undone.")
            .setPositiveButton("Delete") { _, _ ->
                val rawToken = SessionManager.getAuthToken(requireContext())
                if (rawToken != null) {
                    homeViewModel.deleteGroup("Bearer $rawToken", group.id, loadingViewModel)
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
