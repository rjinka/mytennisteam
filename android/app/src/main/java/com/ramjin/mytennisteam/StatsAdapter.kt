package com.ramjin.mytennisteam

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.google.android.flexbox.FlexDirection
import com.google.android.flexbox.FlexboxLayoutManager
import com.google.android.flexbox.JustifyContent
import com.ramjin.mytennisteam.databinding.ItemHistoryBinding
import com.ramjin.mytennisteam.databinding.ItemScheduleStatBinding

class StatsAdapter : ListAdapter<FormattedPlayerStat, StatsAdapter.StatsViewHolder>(StatsDiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): StatsViewHolder {
        val binding = ItemScheduleStatBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return StatsViewHolder(binding)
    }

    override fun onBindViewHolder(holder: StatsViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    class StatsViewHolder(private val binding: ItemScheduleStatBinding) : RecyclerView.ViewHolder(binding.root) {
        fun bind(stat: FormattedPlayerStat) {
            binding.scheduleNameTextView.text = stat.scheduleName
            binding.totalPlayedTextView.text = stat.totalPlayed.toString()
            binding.totalBenchedTextView.text = stat.totalBenched.toString()

            val historyAdapter = HistoryAdapter(stat.scheduleFrequency)
            val historyLayoutManager = FlexboxLayoutManager(binding.root.context).apply {
                flexDirection = FlexDirection.ROW
                justifyContent = JustifyContent.FLEX_START
            }
            binding.historyRecyclerView.layoutManager = historyLayoutManager
            binding.historyRecyclerView.adapter = historyAdapter
            historyAdapter.submitList(stat.history)
        }
    }

    class StatsDiffCallback : DiffUtil.ItemCallback<FormattedPlayerStat>() {
        override fun areItemsTheSame(oldItem: FormattedPlayerStat, newItem: FormattedPlayerStat): Boolean {
            return oldItem.scheduleName == newItem.scheduleName
        }

        override fun areContentsTheSame(oldItem: FormattedPlayerStat, newItem: FormattedPlayerStat): Boolean {
            return oldItem == newItem
        }
    }
}

class HistoryAdapter(private val scheduleFrequency: Int) : ListAdapter<GameHistory, HistoryAdapter.HistoryViewHolder>(HistoryDiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): HistoryViewHolder {
        val binding = ItemHistoryBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return HistoryViewHolder(binding)
    }

    override fun onBindViewHolder(holder: HistoryViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    inner class HistoryViewHolder(private val binding: ItemHistoryBinding) : RecyclerView.ViewHolder(binding.root) {
        fun bind(history: GameHistory) {
            val prefix = when (scheduleFrequency) {
                1 -> "D" // Daily
                2 -> "W" // Weekly
                3 -> "B" // Bi-Weekly
                4 -> "M" // Monthly
                else -> "W" // Default
            }
            binding.weekTextView.text = "$prefix${history.week}"
            val iconRes = if (history.status == "played") R.drawable.ic_status_played else R.drawable.ic_status_benched
            binding.statusIconImageView.setImageResource(iconRes)
        }
    }

    class HistoryDiffCallback : DiffUtil.ItemCallback<GameHistory>() {
        override fun areItemsTheSame(oldItem: GameHistory, newItem: GameHistory): Boolean {
            return oldItem.week == newItem.week
        }

        override fun areContentsTheSame(oldItem: GameHistory, newItem: GameHistory): Boolean {
            return oldItem == newItem
        }
    }
}

data class FormattedPlayerStat(
    val scheduleName: String,
    val totalPlayed: Int,
    val totalBenched: Int,
    val history: List<GameHistory>,
    val scheduleFrequency: Int
)
