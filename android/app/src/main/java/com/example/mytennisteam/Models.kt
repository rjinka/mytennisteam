package com.example.mytennisteam

// --- Data Models based on the provided schemas ---

data class Group(
    val id: String,
    val name: String,
    val createdBy: String,
    val admins: List<String>
)

data class Player(
    val id: String,
    val name: String, // Populated from User details by the backend
    val userId: String,
    val groupid: String,
    val availability: List<PlayerAvailability>,
    val scheduleStats: Map<String, List<String>>
)

data class PlayerAvailability(
    val scheduleId: String,
    val type: String
)

data class Schedule(
    val id: String,
    val name: String,
    val groupid: String,
    val courts: List<String>,
    val day: String,
    val time: String,
    val duration: Double,
    val gameType: String,
    val recurring: Boolean,
    val frequency: Int,
    val recurrenceCount: Int,
    val maxPlayersCount: Int,
    val week: Int,
    val lastGeneratedWeek: Int,
    val isRotationGenerated: Boolean,
    val playingPlayersIds: List<String>,
    val benchPlayersIds: List<String>,
    val isCompleted: Boolean
)

data class Court(
    val id: String,
    val name: String,
    val groupid: String
)
