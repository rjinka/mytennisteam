package dev.ramjin.mytennisteam

import android.graphics.Color
import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import dev.ramjin.mytennisteam.databinding.ItemScheduleStatRowBinding

class ScheduleStatsAdapter : ListAdapter<FormattedScheduleStat, ScheduleStatsAdapter.StatsViewHolder>(StatsDiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): StatsViewHolder {
        val binding = ItemScheduleStatRowBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return StatsViewHolder(binding)
    }

    override fun onBindViewHolder(holder: StatsViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    class StatsViewHolder(private val binding: ItemScheduleStatRowBinding) : RecyclerView.ViewHolder(binding.root) {
        fun bind(stat: FormattedScheduleStat) {
            binding.playerNameTextView.text = stat.playerName
            binding.availabilityTextView.text = stat.availability
            binding.timesPlayedTextView.text = stat.timesPlayed.toString()
            binding.timesOnBenchTextView.text = stat.timesOnBench.toString()

            if (stat.isPlayerOut) {
                binding.root.setBackgroundColor(Color.parseColor("#FFEBEE"))
            }
        }
    }

    class StatsDiffCallback : DiffUtil.ItemCallback<FormattedScheduleStat>() {
        override fun areItemsTheSame(oldItem: FormattedScheduleStat, newItem: FormattedScheduleStat): Boolean {
            return oldItem.playerName == newItem.playerName
        }

        override fun areContentsTheSame(oldItem: FormattedScheduleStat, newItem: FormattedScheduleStat): Boolean {
            return oldItem == newItem
        }
    }
}

data class FormattedScheduleStat(
    val playerName: String,
    val availability: String,
    val timesPlayed: Int,
    val timesOnBench: Int,
    val isPlayerOut: Boolean
)
