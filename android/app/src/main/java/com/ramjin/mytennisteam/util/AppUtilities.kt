package com.ramjin.mytennisteam.util

object AppUtilities {
    // return the day in string
    fun getDayString(day: String): String {
        return when (day.toIntOrNull()) {
            0 -> "Sunday"
            1 -> "Monday"
            2 -> "Tuesday"
            3 -> "Wednesday"
            4 -> "Thursday"
            5 -> "Friday"
            6 -> "Saturday"
            else -> day // Fallback to the original string if it's not a number
        }
    }
}