package com.ramjin.mytennisteam.ui.adapter

import androidx.fragment.app.Fragment
import androidx.fragment.app.FragmentActivity
import androidx.viewpager2.adapter.FragmentStateAdapter
import com.ramjin.mytennisteam.ui.fragment.GroupsFragment
import com.ramjin.mytennisteam.ui.fragment.PlayersFragment
import com.ramjin.mytennisteam.ui.fragment.SchedulesFragment

class ViewPagerAdapter(fragmentActivity: FragmentActivity) : FragmentStateAdapter(fragmentActivity) {

    override fun getItemCount(): Int = 3

    override fun createFragment(position: Int): Fragment {
        return when (position) {
            0 -> GroupsFragment()
            1 -> SchedulesFragment()
            2 -> PlayersFragment()
            else -> throw IllegalArgumentException("Invalid position")
        }
    }
}
