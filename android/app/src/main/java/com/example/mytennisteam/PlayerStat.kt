package com.example.mytennisteam

// Represents the stats for a player for a single schedule, as returned by the API
data class PlayerStat(
    val scheduleId: String,
    val stats: List<GameHistory>
)

// Represents a single game status for a player in a given week
data class GameHistory(
    val week: Int,
    val status: String // e.g., "played" or "benched"
)
