package com.ramjin.mytennisteam

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.ramjin.mytennisteam.databinding.ItemSignupBinding

class ScheduleSignUpAdapter(private val signups: List<ScheduleSignup>) :
    RecyclerView.Adapter<ScheduleSignUpAdapter.ViewHolder>() {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val binding = ItemSignupBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return ViewHolder(binding)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val signup = signups[position]
        holder.binding.playerNameTextView.text = signup.playerName
        holder.binding.availabilityTypeTextView.text = signup.availabilityType
    }

    override fun getItemCount() = signups.size

    class ViewHolder(val binding: ItemSignupBinding) : RecyclerView.ViewHolder(binding.root)
}
