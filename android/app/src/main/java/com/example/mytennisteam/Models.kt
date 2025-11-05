package com.example.mytennisteam

// --- Core Data Models ---

data class Group(
    val id: String,
    val name: String,
    val createdBy: String,
    val admins: List<String>
)

data class Player(
    val id: String,
    val user: User,
    val userId: String,
    val groupid: String,
    val availability: List<PlayerAvailability>
)

data class User(
    val name: String,
    val picture: String?
)

data class PlayerAvailability(
    val scheduleId: String,
    val type: String
)

data class Schedule(
    val id: String,
    val name: String,
    val groupid: String,
    val courts: List<ScheduleCourt>,
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

data class ScheduleCourt(
    val courtId: String,
    val gameType: String
)

data class Court(
    val id: String,
    val name: String,
    val groupid: String
)

// --- API Request/Response Models ---

data class AuthRequest(val token: String)
data class AuthResponse(val token: String)

data class UpdateGroupRequest(val name: String)
data class CreateGroupRequest(val name: String)

data class CreateCourtRequest(val name: String, val groupid: String)
data class UpdateCourtRequest(val name: String, val groupid: String)

data class CreateScheduleRequest(
    val name: String,
    val groupid: String,
    val day: String,
    val time: String,
    val duration: Double,
    val courts: List<ScheduleCourt>,
    val recurring: Boolean,
    val frequency: Int,
    val recurrenceCount: Int,
    val maxPlayersCount: Int
)

data class UpdateScheduleRequest(
    val name: String,
    val day: String,
    val time: String,
    val duration: Double,
    val courts: List<ScheduleCourt>,
    val recurring: Boolean,
    val frequency: Int,
    val recurrenceCount: Int,
    val maxPlayersCount: Int
)

data class InvitePlayerRequest(val email: String)
data class UpdatePlayerRequest(val name: String, val availability: List<PlayerAvailability>)

data class SwapPlayerRequest(
    val playerInId: String,
    val playerOutId: String
)

data class RotationButtonState(
    val visible: Boolean,
    val disabled: Boolean,
    val text: String
)
