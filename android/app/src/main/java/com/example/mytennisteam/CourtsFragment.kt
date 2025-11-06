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
import com.example.mytennisteam.databinding.FragmentCourtsBinding
import com.google.android.material.textfield.TextInputLayout

class CourtsFragment : Fragment() {

    private var _binding: FragmentCourtsBinding? = null
    private val binding get() = _binding!!

    private val homeViewModel: HomeViewModel by activityViewModels()
    private val loadingViewModel: LoadingViewModel by activityViewModels()
    private lateinit var courtAdapter: CourtAdapter

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentCourtsBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        setupRecyclerView()
        observeViewModel()

        binding.fabAddCourt.setOnClickListener {
            showCreateCourtDialog()
        }
    }

    private fun setupRecyclerView() {
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
        }
    }

    private fun observeViewModel() {
        homeViewModel.homeData.observe(viewLifecycleOwner) { data ->
            if (data != null) {
                courtAdapter.submitList(data.courts)
            }
        }
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
                        homeViewModel.createCourt("Bearer $rawToken", courtName, currentGroup.id, loadingViewModel)
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
                            homeViewModel.updateCourt("Bearer $rawToken", court.id, newName, court.groupid, loadingViewModel)
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
                    homeViewModel.deleteCourt("Bearer $rawToken", court.id, loadingViewModel)
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
