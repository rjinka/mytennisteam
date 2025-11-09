package dev.ramjin.mytennisteam

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import dev.ramjin.mytennisteam.databinding.ItemCourtBinding

class CourtAdapter(
    private val onEditClicked: (Court) -> Unit,
    private val onDeleteClicked: (Court) -> Unit
) : ListAdapter<Court, CourtAdapter.CourtViewHolder>(CourtDiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): CourtViewHolder {
        val binding = ItemCourtBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return CourtViewHolder(binding)
    }

    override fun onBindViewHolder(holder: CourtViewHolder, position: Int) {
        val court = getItem(position)
        holder.bind(court, onEditClicked, onDeleteClicked)
    }

    class CourtViewHolder(private val binding: ItemCourtBinding) : RecyclerView.ViewHolder(binding.root) {
        fun bind(court: Court, onEditClicked: (Court) -> Unit, onDeleteClicked: (Court) -> Unit) {
            binding.courtNameTextView.text = court.name

            binding.editCourtButton.setOnClickListener {
                onEditClicked(court)
            }

            binding.deleteCourtButton.setOnClickListener {
                onDeleteClicked(court)
            }
        }
    }
}

class CourtDiffCallback : DiffUtil.ItemCallback<Court>() {
    override fun areItemsTheSame(oldItem: Court, newItem: Court): Boolean {
        return oldItem.id == newItem.id
    }

    override fun areContentsTheSame(oldItem: Court, newItem: Court): Boolean {
        return oldItem.name == newItem.name && oldItem.groupId == newItem.groupId
    }
}
