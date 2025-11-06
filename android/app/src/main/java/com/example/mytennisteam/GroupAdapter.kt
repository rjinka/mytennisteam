package com.example.mytennisteam

import android.graphics.Color
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.example.mytennisteam.databinding.ItemGroupBinding
import com.google.android.material.card.MaterialCardView

class GroupAdapter(
    private val onGroupSelected: (Group) -> Unit,
    private val onEditClicked: (Group) -> Unit,
    private val onDeleteClicked: (Group) -> Unit,
    private val currentUserId: String?,
    private val isSuperAdmin: Boolean
) : ListAdapter<Group, GroupAdapter.GroupViewHolder>(GroupDiffCallback()) {

    private var selectedPosition = RecyclerView.NO_POSITION

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): GroupViewHolder {
        val binding = ItemGroupBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return GroupViewHolder(binding)
    }

    override fun onBindViewHolder(holder: GroupViewHolder, position: Int) {
        val group = getItem(position)
        holder.bind(group, position == selectedPosition, onGroupSelected, onEditClicked, onDeleteClicked, currentUserId, isSuperAdmin)
    }

    fun setSelectedGroup(group: Group) {
        val newPosition = currentList.indexOf(group)
        if (newPosition != RecyclerView.NO_POSITION) {
            notifyItemChanged(selectedPosition)
            selectedPosition = newPosition
            notifyItemChanged(selectedPosition)
        }
    }

    class GroupViewHolder(private val binding: ItemGroupBinding) : RecyclerView.ViewHolder(binding.root) {
        fun bind(
            group: Group,
            isSelected: Boolean,
            onGroupSelected: (Group) -> Unit,
            onEditClicked: (Group) -> Unit,
            onDeleteClicked: (Group) -> Unit,
            currentUserId: String?,
            isSuperAdmin: Boolean
        ) {
            binding.groupNameTextView.text = group.name

            val card = binding.root as MaterialCardView

            if (isSelected) {
                card.setCardBackgroundColor(ContextCompat.getColor(itemView.context, R.color.selected_group_color))
                binding.groupNameTextView.setTextColor(Color.WHITE)
                binding.editGroupButton.setColorFilter(Color.WHITE)
                binding.deleteGroupButton.setColorFilter(Color.WHITE)
            } else {
                card.setCardBackgroundColor(Color.WHITE)
                binding.groupNameTextView.setTextColor(Color.BLACK)
                binding.editGroupButton.setColorFilter(ContextCompat.getColor(itemView.context, R.color.default_icon_tint))
                binding.deleteGroupButton.setColorFilter(ContextCompat.getColor(itemView.context, R.color.default_icon_tint))
            }

            val isGroupAdmin = group.admins.contains(currentUserId)
            val canEdit = isSuperAdmin || isGroupAdmin
            val canDelete = isSuperAdmin || isGroupAdmin

            binding.editGroupButton.visibility = if (canEdit) View.VISIBLE else View.GONE
            binding.deleteGroupButton.visibility = if (canDelete) View.VISIBLE else View.GONE

            itemView.setOnClickListener {
                onGroupSelected(group)
            }

            binding.editGroupButton.setOnClickListener {
                onEditClicked(group)
            }

            binding.deleteGroupButton.setOnClickListener {
                onDeleteClicked(group)
            }
        }
    }
}

class GroupDiffCallback : DiffUtil.ItemCallback<Group>() {
    override fun areItemsTheSame(oldItem: Group, newItem: Group): Boolean {
        return oldItem.id == newItem.id
    }

    override fun areContentsTheSame(oldItem: Group, newItem: Group): Boolean {
        return oldItem == newItem
    }
}
