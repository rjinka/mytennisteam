package com.example.mytennisteam

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.example.mytennisteam.databinding.ItemPlayerBinding

class PlayerAdapter(
    private val onEditClicked: (Player) -> Unit,
    private val onDeleteClicked: (Player) -> Unit
) : ListAdapter<Player, PlayerAdapter.PlayerViewHolder>(PlayerDiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): PlayerViewHolder {
        val binding = ItemPlayerBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return PlayerViewHolder(binding)
    }

    override fun onBindViewHolder(holder: PlayerViewHolder, position: Int) {
        val player = getItem(position)
        holder.bind(player, onEditClicked, onDeleteClicked)
    }

    class PlayerViewHolder(private val binding: ItemPlayerBinding) : RecyclerView.ViewHolder(binding.root) {
        fun bind(player: Player, onEditClicked: (Player) -> Unit, onDeleteClicked: (Player) -> Unit) {
            binding.playerNameTextView.text = player.user.name // Corrected to use nested user object

            binding.editPlayerButton.setOnClickListener {
                onEditClicked(player)
            }

            binding.deletePlayerButton.setOnClickListener {
                onDeleteClicked(player)
            }
        }
    }
}

class PlayerDiffCallback : DiffUtil.ItemCallback<Player>() {
    override fun areItemsTheSame(oldItem: Player, newItem: Player): Boolean {
        return oldItem.id == newItem.id
    }

    override fun areContentsTheSame(oldItem: Player, newItem: Player): Boolean {
        // This more specific check ensures the UI updates correctly.
        return oldItem == newItem
    }
}
