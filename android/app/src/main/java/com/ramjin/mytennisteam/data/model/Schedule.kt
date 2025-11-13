package com.ramjin.mytennisteam.data.model

import com.google.gson.annotations.SerializedName

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
    @SerializedName("occurrenceNumber") val occurrenceNumber: Int,
    @SerializedName("playingPlayersIds") val playingPlayersIds: List<String>,
    @SerializedName("benchPlayersIds") val benchPlayersIds: List<String>,
    @SerializedName("status") val status: String
)

data class ScheduleSignup(
    @SerializedName("playerId") val playerId: String,
    @SerializedName("playerName") val playerName: String,
    @SerializedName("availabilityType") val availabilityType: String
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

data class SwapPlayerRequest(val playerInId: String, val playerOutId: String)

data class RotationButtonState(val visible: Boolean, val text: String, val disabled: Boolean)