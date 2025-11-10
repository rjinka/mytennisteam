package com.ramjin.mytennisteam

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.ramjin.mytennisteam.databinding.ItemScheduleBinding

class ScheduleAdapter(
    private val onItemClicked: (Schedule) -> Unit,
    private val onEditClicked: (Schedule) -> Unit,
    private val onDeleteClicked: (Schedule) -> Unit,
    private val onStatsClicked: (Schedule) -> Unit,
    private val currentUserId: String?,
    private val isSuperAdmin: Boolean,
    private val groupAdmins: List<String>
) : ListAdapter<Schedule, ScheduleAdapter.ScheduleViewHolder>(ScheduleDiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ScheduleViewHolder {
        val binding = ItemScheduleBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return ScheduleViewHolder(binding)
    }

    override fun onBindViewHolder(holder: ScheduleViewHolder, position: Int) {
        val schedule = getItem(position)
        holder.bind(schedule, onItemClicked, onEditClicked, onDeleteClicked, onStatsClicked, currentUserId, isSuperAdmin, groupAdmins)
    }

    class ScheduleViewHolder(private val binding: ItemScheduleBinding) : RecyclerView.ViewHolder(binding.root) {
        fun bind(schedule: Schedule, onItemClicked: (Schedule) -> Unit, onEditClicked: (Schedule) -> Unit, onDeleteClicked: (Schedule) -> Unit, onStatsClicked: (Schedule) -> Unit, currentUserId: String?, isSuperAdmin: Boolean, groupAdmins: List<String>) {
            binding.scheduleNameTextView.text = schedule.name
            binding.scheduleDayTimeTextView.text = "${getDayString(schedule.day)} ${schedule.time}"

            val isGroupAdmin = groupAdmins.contains(currentUserId)
            val canManage = isSuperAdmin || isGroupAdmin

            binding.editScheduleButton.visibility = if (canManage) View.VISIBLE else View.GONE
            binding.deleteScheduleButton.visibility = if (canManage) View.VISIBLE else View.GONE

            itemView.setOnClickListener {
                onItemClicked(schedule)
            }

            binding.editScheduleButton.setOnClickListener {
                onEditClicked(schedule)
            }

            binding.deleteScheduleButton.setOnClickListener {
                onDeleteClicked(schedule)
            }

            binding.statsButton.setOnClickListener {
                onStatsClicked(schedule)
            }
        }

        private fun getDayString(day: String): String {
            return when (day.toIntOrNull()) {
                0 -> "Sunday"
                1 -> "Monday"
                2 -> "Tuesday"
                3 -> "Wednesday"
                4 -> "Thursday"
                5 -> "Friday"
                6 -> "Saturday"
                else -> day // Fallback to the original string if it's not a number
            }
        }
    }
}

class ScheduleDiffCallback : DiffUtil.ItemCallback<Schedule>() {
    override fun areItemsTheSame(oldItem: Schedule, newItem: Schedule): Boolean {
        return oldItem.id == newItem.id
    }

    override fun areContentsTheSame(oldItem: Schedule, newItem: Schedule): Boolean {
        return oldItem == newItem
    }
}
