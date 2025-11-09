package com.example.mytennisteam

// Represents the stats for a single player for a single schedule
data class ScheduleStatResponse(
    val playerId: String,
    val stats: List<ScheduleGameHistory>
)

// Represents a single game status for a player in a given week
data class ScheduleGameHistory(
    val week: Int,
    val status: String, // e.g., "played" or "benched"
    val date: String
)
