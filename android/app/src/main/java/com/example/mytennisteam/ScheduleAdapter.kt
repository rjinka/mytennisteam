package com.example.mytennisteam

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.example.mytennisteam.databinding.ItemScheduleBinding

class ScheduleAdapter(
    private val onItemClicked: (Schedule) -> Unit,
    private val onEditClicked: (Schedule) -> Unit,
    private val onDeleteClicked: (Schedule) -> Unit
) : ListAdapter<Schedule, ScheduleAdapter.ScheduleViewHolder>(ScheduleDiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ScheduleViewHolder {
        val binding = ItemScheduleBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return ScheduleViewHolder(binding)
    }

    override fun onBindViewHolder(holder: ScheduleViewHolder, position: Int) {
        val schedule = getItem(position)
        holder.bind(schedule, onItemClicked, onEditClicked, onDeleteClicked)
    }

    class ScheduleViewHolder(private val binding: ItemScheduleBinding) : RecyclerView.ViewHolder(binding.root) {
        fun bind(schedule: Schedule, onItemClicked: (Schedule) -> Unit, onEditClicked: (Schedule) -> Unit, onDeleteClicked: (Schedule) -> Unit) {
            binding.scheduleNameTextView.text = schedule.name
            binding.scheduleDayTextView.text = getDayString(schedule.day)
            binding.scheduleTimeTextView.text = schedule.time

            itemView.setOnClickListener {
                onItemClicked(schedule)
            }

            binding.editScheduleButton.setOnClickListener {
                onEditClicked(schedule)
            }

            binding.deleteScheduleButton.setOnClickListener {
                onDeleteClicked(schedule)
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
