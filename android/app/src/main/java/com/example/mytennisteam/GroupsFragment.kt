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
            showCreateOrEditGroupDialog(null)
        }
    }

    private fun setupRecyclerView() {
        groupAdapter = GroupAdapter(
            onGroupSelected = { group ->
                val rawToken = SessionManager.getAuthToken(requireContext())
                if (rawToken != null) {
                    homeViewModel.loadDataForGroup("Bearer $rawToken", group, loadingViewModel)
                }
            },
            onEditClicked = { group ->
                showCreateOrEditGroupDialog(group)
            },
            onDeleteClicked = { group ->
                showDeleteGroupConfirmation(group)
            }
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

    private fun showCreateOrEditGroupDialog(group: Group?) {
        val dialogView = LayoutInflater.from(requireContext()).inflate(R.layout.dialog_create_group, null as ViewGroup?)
        val groupNameEditText = dialogView.findViewById<EditText>(R.id.group_name_edit_text)
        if (group != null) {
            groupNameEditText.setText(group.name)
        }

        val dialogTitle = if (group == null) "Create New Group" else "Edit Group Name"
        val dialog = AlertDialog.Builder(requireContext())
            .setTitle(dialogTitle)
            .setView(dialogView)
            .setPositiveButton(if (group == null) "Create" else "Save") { _, _ ->
                val groupName = groupNameEditText.text.toString().trim()
                if (groupName.isNotEmpty()) {
                    val rawToken = SessionManager.getAuthToken(requireContext())
                    if (rawToken != null) {
                        val token = "Bearer $rawToken"
                        if (group == null) {
                            homeViewModel.createGroup(token, groupName, loadingViewModel)
                        } else {
                            homeViewModel.updateGroup(token, group.id, groupName, loadingViewModel)
                        }
                    } else {
                        Toast.makeText(requireContext(), "Authentication error", Toast.LENGTH_SHORT).show()
                    }
                } else {
                    Toast.makeText(requireContext(), "Group name cannot be empty", Toast.LENGTH_SHORT).show()
                }
            }
            .setNegativeButton("Cancel", null)
            .create()
        dialog.show()
    }

    private fun showDeleteGroupConfirmation(group: Group) {
        AlertDialog.Builder(requireContext())
            .setTitle("Delete Group")
            .setMessage("Are you sure you want to delete '${group.name}'? All associated data will be lost.")
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
