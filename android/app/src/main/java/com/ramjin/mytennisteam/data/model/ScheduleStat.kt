package com.ramjin.mytennisteam.data.model

import com.google.gson.annotations.SerializedName

// Used for the response from /api/stats/schedule/{scheduleId}
data class ScheduleStat(
    @SerializedName("playerId") val playerId: Player,
    @SerializedName("scheduleId") val scheduleId: String,
    @SerializedName("stats") val stats: List<GameHistory>
)

data class FormattedScheduleStat(
    val playerName: String,
    val availability: String,
    val timesPlayed: Int,
    val timesOnBench: Int,
    val isPlayerOut: Boolean
)

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
