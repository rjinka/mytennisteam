package com.ramjin.mytennisteam.data.model

import com.google.gson.annotations.SerializedName

// Used for the response from /api/stats/player/{playerId}
data class PlayerStat(
    @SerializedName("playerId") val playerId: String,
    @SerializedName("scheduleId") val scheduleId: Schedule, // Backend populates this with {id, name}
    @SerializedName("stats") val stats: List<GameHistory>
)

data class FormattedPlayerStat(
    val scheduleName: String,
    val totalPlayed: Int,
    val totalBenched: Int,
    val history: List<GameHistory>,
    val scheduleFrequency: Int
)