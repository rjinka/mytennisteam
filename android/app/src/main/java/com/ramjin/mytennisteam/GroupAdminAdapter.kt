package com.ramjin.mytennisteam

import android.view.LayoutInflater
import android.view.ViewGroup
import android.widget.CheckBox
import androidx.recyclerview.widget.RecyclerView
import com.ramjin.mytennisteam.R

class GroupAdminAdapter(
    private val players: List<Player>,
    initialAdmins: Set<String>
) : RecyclerView.Adapter<GroupAdminAdapter.AdminViewHolder>() {

    private val selectedAdminIds = initialAdmins.toMutableSet()

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): AdminViewHolder {
        val checkbox = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_admin_selection, parent, false) as CheckBox
        return AdminViewHolder(checkbox)
    }

    override fun onBindViewHolder(holder: AdminViewHolder, position: Int) {
        val player = players[position]
        holder.bind(player, selectedAdminIds)
    }

    override fun getItemCount(): Int = players.size

    fun getSelectedAdminIds(): List<String> {
        return selectedAdminIds.toList()
    }

    class AdminViewHolder(private val checkbox: CheckBox) : RecyclerView.ViewHolder(checkbox) {
        fun bind(player: Player, selectedAdminIds: MutableSet<String>) {
            checkbox.text = player.user.name
            checkbox.isChecked = selectedAdminIds.contains(player.userId)

            // Prevent the listener from firing during initial binding
            checkbox.setOnCheckedChangeListener(null)

            checkbox.isChecked = selectedAdminIds.contains(player.userId)

            checkbox.setOnCheckedChangeListener { _, isChecked ->
                if (isChecked) {
                    selectedAdminIds.add(player.userId)
                } else {
                    // Safety check: Don't allow removing the last admin
                    if (selectedAdminIds.size > 1) {
                        selectedAdminIds.remove(player.userId)
                    } else {
                        checkbox.isChecked = true // Re-check the box
                    }
                }
            }
        }
    }
}