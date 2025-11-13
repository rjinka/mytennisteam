package com.ramjin.mytennisteam.ui.adapter

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.ramjin.mytennisteam.data.model.Player
import com.ramjin.mytennisteam.databinding.ItemPlayerBinding

class PlayerAdapter(
    private val onEditClicked: (Player) -> Unit,
    private val onDeleteClicked: (Player) -> Unit,
    private val onStatsClicked: (Player) -> Unit,
    private val currentUserId: String?,
    private val isSuperAdmin: Boolean,
    private var groupAdmins: List<String>
) : ListAdapter<Player, PlayerAdapter.PlayerViewHolder>(PlayerDiffCallback()) {

    fun updateGroupAdmins(newAdmins: List<String>) {
        groupAdmins = newAdmins
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): PlayerViewHolder {
        val binding = ItemPlayerBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return PlayerViewHolder(binding)
    }

    override fun onBindViewHolder(holder: PlayerViewHolder, position: Int) {
        val player = getItem(position)
        holder.bind(player, onEditClicked, onDeleteClicked, onStatsClicked, currentUserId, isSuperAdmin, groupAdmins)
    }

    class PlayerViewHolder(private val binding: ItemPlayerBinding) : RecyclerView.ViewHolder(binding.root) {
        fun bind(player: Player, onEditClicked: (Player) -> Unit, onDeleteClicked: (Player) -> Unit, onStatsClicked: (Player) -> Unit, currentUserId: String?, isSuperAdmin: Boolean, groupAdmins: List<String>) {
            binding.playerNameTextView.text = player.user.name
            Glide.with(binding.root.context).load(player.user.picture).into(binding.playerImageView)

            val isGroupAdmin = groupAdmins.contains(currentUserId)
            val isOwnProfile = player.userId == currentUserId

            val canDelete = isSuperAdmin || isGroupAdmin
            val canEdit = isSuperAdmin || isGroupAdmin || isOwnProfile


            binding.deletePlayerButton.visibility = if (canDelete) View.VISIBLE else View.GONE
            binding.editPlayerButton.visibility = if (canEdit) View.VISIBLE else View.GONE


            binding.editPlayerButton.setOnClickListener {
                onEditClicked(player)
            }

            binding.deletePlayerButton.setOnClickListener {
                onDeleteClicked(player)
            }

            binding.statsButton.setOnClickListener {
                onStatsClicked(player)
            }
        }
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
