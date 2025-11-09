package dev.ramjin.mytennisteam

import android.graphics.Color
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.cardview.widget.CardView
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import dev.ramjin.mytennisteam.databinding.ItemPlayerLineupBinding

class PlayerLineupAdapter(
    private val isBench: Boolean,
    private val onSwapClicked: (Player) -> Unit,
    private val onStatsClicked: (Player) -> Unit,
    private val currentUserId: String?,
    private val isSuperAdmin: Boolean,
    private val groupAdmins: List<String>
) : ListAdapter<Player, PlayerLineupAdapter.PlayerViewHolder>(PlayerDiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): PlayerViewHolder {
        val binding = ItemPlayerLineupBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return PlayerViewHolder(binding)
    }

    override fun onBindViewHolder(holder: PlayerViewHolder, position: Int) {
        val player = getItem(position)
        holder.bind(player, isBench, onSwapClicked, onStatsClicked, currentUserId, isSuperAdmin, groupAdmins)
    }

    class PlayerViewHolder(private val binding: ItemPlayerLineupBinding) : RecyclerView.ViewHolder(binding.root) {
        fun bind(player: Player, isBench: Boolean, onSwapClicked: (Player) -> Unit, onStatsClicked: (Player) -> Unit, currentUserId: String?, isSuperAdmin: Boolean, groupAdmins: List<String>) {
            binding.playerNameTextView.text = player.user.name

            val isGroupAdmin = groupAdmins.contains(currentUserId)
            val canSwap = isSuperAdmin || isGroupAdmin || player.userId == currentUserId
            binding.swapButton.visibility = if (canSwap) View.VISIBLE else View.GONE

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
