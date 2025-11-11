package com.ramjin.mytennisteam.adapter

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.ramjin.mytennisteam.R
import com.ramjin.mytennisteam.ScheduleSignup

class ScheduleSignUpAdapter : ListAdapter<ScheduleSignup, ScheduleSignUpAdapter.SignUpViewHolder>(SignUpDiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): SignUpViewHolder {
        val view = LayoutInflater.from(parent.context).inflate(R.layout.item_signup, parent, false)
        return SignUpViewHolder(view)
    }

    override fun onBindViewHolder(holder: SignUpViewHolder, position: Int) {
        val signup = getItem(position)
        holder.bind(signup)
    }

    class SignUpViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        private val playerNameTextView: TextView = itemView.findViewById(R.id.player_name_text_view)
        private val availabilityTypeTextView: TextView = itemView.findViewById(R.id.availability_type_text_view)

        fun bind(signup: ScheduleSignup) {
            playerNameTextView.text = signup.playerName
            availabilityTypeTextView.text = signup.availabilityType
        }
    }

    class SignUpDiffCallback : DiffUtil.ItemCallback<ScheduleSignup>() {
        override fun areItemsTheSame(oldItem: ScheduleSignup, newItem: ScheduleSignup): Boolean {
            return oldItem.playerId == newItem.playerId
        }

        override fun areContentsTheSame(oldItem: ScheduleSignup, newItem: ScheduleSignup): Boolean {
            return oldItem == newItem
        }
    }
}
