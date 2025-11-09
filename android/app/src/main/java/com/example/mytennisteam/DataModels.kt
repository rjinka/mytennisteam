package com.example.mytennisteam

import com.google.gson.annotations.SerializedName

// --- Core Data Models ---

data class User(
    @SerializedName("id") val id: String,
    @SerializedName("name") val name: String,
    @SerializedName("picture") val picture: String?,
    @SerializedName("isSuperAdmin") val isSuperAdmin: Boolean = false
)

data class Group(
    @SerializedName("id") val id: String,
    @SerializedName("name") val name: String,
    @SerializedName("admins") val admins: List<String>
)

data class Court(
    @SerializedName("id") val id: String,
    @SerializedName("name") val name: String,
    @SerializedName("groupId") val groupId: String
)

data class Player(
    @SerializedName("id") val id: String,
    @SerializedName("userId") val userId: String,
    @SerializedName("groupId") val groupId: String,
    @SerializedName("user") val user: User,
    @SerializedName("availability") val availability: List<PlayerAvailability>
)

data class Schedule(
    @SerializedName("id") val id: String,
    @SerializedName("name") val name: String,
    @SerializedName("groupId") val groupId: String,
    @SerializedName("day") val day: String,
    @SerializedName("time") val time: String,
    @SerializedName("duration") val duration: Double,
    @SerializedName("recurring") val recurring: Boolean,
    @SerializedName("frequency") val frequency: Int,
    @SerializedName("recurrenceCount") val recurrenceCount: Int,
    @SerializedName("courts") val courts: List<ScheduleCourtInfo>,
    @SerializedName("week") val week: Int,
    @SerializedName("playingPlayersIds") val playingPlayersIds: List<String>,
    @SerializedName("benchPlayersIds") val benchPlayersIds: List<String>
)

data class PlayerAvailability(
    @SerializedName("scheduleId") val scheduleId: String,
    @SerializedName("type") val type: String
)

// Used for the response from /api/stats/schedule/{scheduleId}
data class ScheduleStat(
    @SerializedName("playerId") val playerId: Player,
    @SerializedName("scheduleId") val scheduleId: String,
    @SerializedName("stats") val stats: List<GameHistory>
)

// Used for the response from /api/stats/player/{playerId}
data class PlayerStat(
    @SerializedName("playerId") val playerId: String,
    @SerializedName("scheduleId") val scheduleId: Schedule, // Backend populates this with {id, name}
    @SerializedName("stats") val stats: List<GameHistory>
)

data class GameHistory(
    @SerializedName("week") val week: Int,
    @SerializedName("status") val status: String,
    @SerializedName("date") val date: String
)

// --- API Request/Response Models ---

data class AuthRequest(val token: String)

data class AuthResponse(val token: String, val user: User)

data class CreateGroupRequest(val name: String)

data class UpdateGroupRequest(val name: String)

data class CreateCourtRequest(
    val name: String,
    @SerializedName("groupId") val groupId: String
)

data class UpdateCourtRequest(
    val name: String,
    @SerializedName("groupId") val groupId: String
)

data class InvitePlayerRequest(val email: String)

data class UpdatePlayerRequest(
    val name: String,
    val availability: List<PlayerAvailability>
)

data class CreateScheduleRequest(
    val name: String,
    @SerializedName("groupId") val groupId: String,
    val courts: List<ScheduleCourtInfo>,
    val day: String,
    val time: String,
    val duration: Double,
    val recurring: Boolean,
    val frequency: Int,
    val recurrenceCount: Int,
    val maxPlayersCount: Int
)

data class UpdateScheduleRequest(
    val name: String,
    @SerializedName("groupId") val groupId: String,
    val courts: List<ScheduleCourtInfo>,
    val day: String,
    val time: String,
    val duration: Double,
    val recurring: Boolean,
    val frequency: Int,
    val recurrenceCount: Int,
    val maxPlayersCount: Int
)

data class ScheduleCourtInfo(@SerializedName("courtId") val courtId: String, @SerializedName("gameType") val gameType: String)

data class SwapPlayerRequest(val playerInId: String, val playerOutId: String)

data class RotationButtonState(val visible: Boolean, val text: String, val disabled: Boolean)

data class JoinGroupResponse(val message: String)

data class UpdateGroupAdminsRequest(val adminUserIds: List<String>)