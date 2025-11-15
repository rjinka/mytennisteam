package com.ramjin.mytennisteam.ui.fragment

import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.EditText
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.fragment.app.Fragment
import androidx.fragment.app.activityViewModels
import androidx.recyclerview.widget.GridLayoutManager
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.ramjin.mytennisteam.BuildConfig
import com.ramjin.mytennisteam.R
import com.ramjin.mytennisteam.data.model.Group
import com.ramjin.mytennisteam.databinding.FragmentGroupsBinding
import com.ramjin.mytennisteam.ui.adapter.GroupAdapter
import com.ramjin.mytennisteam.ui.adapter.GroupAdminAdapter
import com.ramjin.mytennisteam.util.Event
import com.ramjin.mytennisteam.util.SessionManager
import com.ramjin.mytennisteam.viewmodel.HomeViewModel
import com.ramjin.mytennisteam.viewmodel.LoadingViewModel
import retrofit2.HttpException

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

        binding.swipeRefreshLayout.setOnRefreshListener {
            refreshData()
        }

        binding.fabAddGroup.setOnClickListener {
            showCreateGroupDialog()
        }
    }

    private fun refreshData() {
        try {
            val rawToken = SessionManager.getAuthToken(requireContext())
            if (rawToken != null) {
                homeViewModel.fetchInitialGroups("Bearer $rawToken", loadingViewModel)
            } else {
                Toast.makeText(context, "Authentication error", Toast.LENGTH_SHORT).show()
                binding.swipeRefreshLayout.isRefreshing = false
            }
        } catch(e: Exception) {
            Log.e("HomeViewModel", "Failed to fetch groups", e)
        } finally {
                binding.swipeRefreshLayout.isRefreshing = false
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
            onShareClicked = { group -> 
                shareGroupLink(group) 
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
            binding.swipeRefreshLayout.isRefreshing = false
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
        val dialogView = LayoutInflater.from(requireContext()).inflate(R.layout.dialog_edit_group, null)
        val groupNameEditText = dialogView.findViewById<EditText>(R.id.group_name_edit_text)
        val adminsRecyclerView = dialogView.findViewById<RecyclerView>(R.id.admins_recycler_view)

        groupNameEditText.setText(group.name)

        val allPlayersInGroup = homeViewModel.homeData.value?.players ?: emptyList()
        val currentAdmins = group.admins.toSet()

        val adminAdapter = GroupAdminAdapter(allPlayersInGroup, currentAdmins)
        adminsRecyclerView.apply {
            adapter = adminAdapter
            layoutManager = LinearLayoutManager(context)
        }

        AlertDialog.Builder(requireContext())
            .setTitle("Edit Group Name")
            .setView(dialogView)
            .setPositiveButton("Save") { _, _ ->
                val newGroupName = groupNameEditText.text.toString().trim()
                val newAdminUserIds = adminAdapter.getSelectedAdminIds()

                if (newAdminUserIds.isEmpty()) {
                    Toast.makeText(context, "A group must have at least one admin.", Toast.LENGTH_SHORT).show()
                    return@setPositiveButton
                }

                val rawToken = SessionManager.getAuthToken(requireContext())
                if (rawToken != null) {
                    // Update name if it has changed
                    if (newGroupName.isNotBlank() && newGroupName != group.name) {
                        homeViewModel.updateGroup("Bearer $rawToken", group.id, newGroupName, loadingViewModel)
                    }
                    // Update admins if they have changed
                    if (newAdminUserIds.toSet() != group.admins.toSet()) {
                        homeViewModel.updateGroupAdmins("Bearer $rawToken", group.id, newAdminUserIds, loadingViewModel)
                    }
                }
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun shareGroupLink(group: Group) {
        val joinUrl = "${BuildConfig.WEB_APP_BASE_URL}/?groupId=${group.id}"
        val shareIntent = Intent().apply {
            action = Intent.ACTION_SEND
            putExtra(Intent.EXTRA_TEXT, "Join my tennis group on MyTennisTeam: $joinUrl")
            type = "text/plain"
        }
        startActivity(Intent.createChooser(shareIntent, "Share Group Link"))
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
