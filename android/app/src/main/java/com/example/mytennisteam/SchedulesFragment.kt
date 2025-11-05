package com.example.mytennisteam

import android.app.TimePickerDialog
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ArrayAdapter
import android.widget.AutoCompleteTextView
import android.widget.CheckBox
import android.widget.LinearLayout
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.core.view.children
import androidx.core.view.isVisible
import androidx.fragment.app.Fragment
import androidx.fragment.app.activityViewModels
import androidx.recyclerview.widget.LinearLayoutManager
import com.example.mytennisteam.databinding.FragmentSchedulesBinding
import com.google.android.material.textfield.TextInputEditText
import com.google.android.material.textfield.TextInputLayout
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale

class SchedulesFragment : Fragment() {

    private var _binding: FragmentSchedulesBinding? = null
    private val binding get() = _binding!!

    private val homeViewModel: HomeViewModel by activityViewModels()
    private lateinit var scheduleAdapter: ScheduleAdapter

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentSchedulesBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        setupRecyclerView()
        observeViewModel()

        binding.fabAddSchedule.setOnClickListener {
            showCreateOrEditScheduleDialog(null)
        }

        // Add the detail fragment to the container, but hide it initially
        if (childFragmentManager.findFragmentById(R.id.schedule_detail_container) == null) {
            childFragmentManager.beginTransaction()
                .add(R.id.schedule_detail_container, ScheduleDetailFragment())
                .commit()
        }
    }

    private fun setupRecyclerView() {
        scheduleAdapter = ScheduleAdapter(
            onItemClicked = { schedule ->
                val rawToken = SessionManager.getAuthToken(requireContext())
                if (rawToken != null) {
                    homeViewModel.onScheduleSelected(schedule, "Bearer $rawToken")
                }
            },
            onEditClicked = { schedule ->
                showCreateOrEditScheduleDialog(schedule)
            },
            onDeleteClicked = { schedule ->
                showDeleteScheduleConfirmation(schedule)
            }
        )
        binding.schedulesRecyclerView.apply {
            adapter = scheduleAdapter
            layoutManager = LinearLayoutManager(context)
        }
    }

    private fun observeViewModel() {
        homeViewModel.homeData.observe(viewLifecycleOwner) { data ->
            data?.schedules?.let { scheduleAdapter.submitList(it) }
        }

        homeViewModel.selectedSchedule.observe(viewLifecycleOwner) { schedule ->
            val isScheduleSelected = schedule != null
            binding.scheduleDetailContainer.isVisible = isScheduleSelected
            binding.schedulesRecyclerView.isVisible = !isScheduleSelected
            binding.fabAddSchedule.isVisible = !isScheduleSelected
        }
    }

    private fun showCreateOrEditScheduleDialog(schedule: Schedule?) {
        // ... (implementation remains the same) ...
    }
    
    private fun showDeleteScheduleConfirmation(schedule: Schedule) {
        // ... (implementation remains the same) ...
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
