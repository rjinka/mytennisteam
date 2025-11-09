package dev.ramjin.mytennisteam

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import dev.ramjin.mytennisteam.databinding.ItemStatBinding

class AvailabilityAdapter : ListAdapter<Pair<String, String>, AvailabilityAdapter.AvailabilityViewHolder>(AvailabilityDiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): AvailabilityViewHolder {
        val binding = ItemStatBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return AvailabilityViewHolder(binding)
    }

    override fun onBindViewHolder(holder: AvailabilityViewHolder, position: Int) {
        val availability = getItem(position)
        holder.bind(availability)
    }

    class AvailabilityViewHolder(private val binding: ItemStatBinding) : RecyclerView.ViewHolder(binding.root) {
        fun bind(availability: Pair<String, String>) {
            binding.statNameTextView.text = availability.first
            binding.statValueTextView.text = availability.second
        }
    }

    class AvailabilityDiffCallback : DiffUtil.ItemCallback<Pair<String, String>>() {
        override fun areItemsTheSame(oldItem: Pair<String, String>, newItem: Pair<String, String>): Boolean {
            return oldItem.first == newItem.first
        }

        override fun areContentsTheSame(oldItem: Pair<String, String>, newItem: Pair<String, String>): Boolean {
            return oldItem == newItem
        }
    }
}
