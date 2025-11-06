package com.example.mytennisteam

import android.graphics.Color
import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.cardview.widget.CardView
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.example.mytennisteam.databinding.ItemPlayerLineupBinding

class PlayerLineupAdapter(
    private val isBench: Boolean,
    private val onSwapClicked: (Player) -> Unit,
    private val onStatsClicked: (Player) -> Unit
) : ListAdapter<Player, PlayerLineupAdapter.PlayerViewHolder>(PlayerDiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): PlayerViewHolder {
        val binding = ItemPlayerLineupBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return PlayerViewHolder(binding)
    }

    override fun onBindViewHolder(holder: PlayerViewHolder, position: Int) {
        val player = getItem(position)
        holder.bind(player, isBench, onSwapClicked, onStatsClicked)
    }

    class PlayerViewHolder(private val binding: ItemPlayerLineupBinding) : RecyclerView.ViewHolder(binding.root) {
        fun bind(player: Player, isBench: Boolean, onSwapClicked: (Player) -> Unit, onStatsClicked: (Player) -> Unit) {
            binding.playerNameTextView.text = player.user.name
            binding.swapButton.setOnClickListener { onSwapClicked(player) }
            binding.statsButton.setOnClickListener { onStatsClicked(player) }

            val backgroundColor = if (isBench) Color.parseColor("#FFEBEE") else Color.parseColor("#E8F5E9")
            (binding.root as CardView).setCardBackgroundColor(backgroundColor)
        }
    }

    class PlayerDiffCallback : DiffUtil.ItemCallback<Player>() {
        override fun areItemsTheSame(oldItem: Player, newItem: Player): Boolean {
            return oldItem.id == newItem.id
        }

        override fun areContentsTheSame(oldItem: Player, newItem: Player): Boolean {
            return oldItem == newItem
        }
    }
}
