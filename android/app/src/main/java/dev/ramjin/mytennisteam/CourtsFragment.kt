package dev.ramjin.mytennisteam

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
import dev.ramjin.mytennisteam.databinding.FragmentCourtsBinding
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
            showCreateOrEditCourtDialog(null)
        }
    }

    private fun setupRecyclerView() {
        courtAdapter = CourtAdapter(
            onEditClicked = { court ->
                showCreateOrEditCourtDialog(court)
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

                val currentUserId = SessionManager.getUserId(requireContext())
                val isSuperAdmin = SessionManager.isSuperAdmin(requireContext())
                val isGroupAdmin = data.selectedGroup.admins.contains(currentUserId)

                val canManageCourts = isSuperAdmin || isGroupAdmin
                binding.fabAddCourt.visibility = if (canManageCourts) View.VISIBLE else View.GONE
                (activity as? HomeActivity)?.setCourtsTabVisibility(canManageCourts)
            }
        }
    }

    private fun showCreateOrEditCourtDialog(court: Court?) {
        val currentGroup = homeViewModel.homeData.value?.selectedGroup
        if (currentGroup == null) {
            Toast.makeText(context, "Please select a group first", Toast.LENGTH_SHORT).show()
            return
        }

        val dialogView = LayoutInflater.from(requireContext()).inflate(R.layout.dialog_create_court, null)
        val courtNameInputLayout = dialogView.findViewById<TextInputLayout>(R.id.court_name_input_layout)
        val courtNameEditText = dialogView.findViewById<EditText>(R.id.court_name_edit_text)

        if (court != null) {
            courtNameEditText.setText(court.name)
        }

        val dialogTitle = if (court == null) "Create New Court" else "Edit Court Name"

        val dialog = AlertDialog.Builder(requireContext())
            .setTitle(dialogTitle)
            .setView(dialogView)
            .setPositiveButton(if (court == null) "Create" else "Save", null)
            .setNegativeButton("Cancel", null)
            .create()

        dialog.setOnShowListener { _ ->
            val positiveButton = dialog.getButton(AlertDialog.BUTTON_POSITIVE)
            positiveButton.setOnClickListener { 
                val courtName = courtNameEditText.text.toString().trim()
                if (courtName.isNotBlank()) {
                    val rawToken = SessionManager.getAuthToken(requireContext())
                    if (rawToken != null) {
                        if (court == null) {
                            homeViewModel.createCourt("Bearer $rawToken", courtName, currentGroup.id, loadingViewModel)
                        } else {
                            homeViewModel.updateCourt("Bearer $rawToken", court.id, courtName, court.groupId, loadingViewModel)
                        }
                        dialog.dismiss()
                    }
                } else {
                    courtNameInputLayout.error = "Court name cannot be empty"
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
