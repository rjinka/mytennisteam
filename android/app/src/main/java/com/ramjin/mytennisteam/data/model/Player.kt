package com.ramjin.mytennisteam.data.model

import com.google.gson.annotations.SerializedName

data class Player(
    @SerializedName("id") val id: String,
    @SerializedName("userId") val userId: String,
    @SerializedName("groupId") val groupId: String,
    @SerializedName("user") val user: User,
    @SerializedName("availability") val availability: List<PlayerAvailability>
)

data class PlayerAvailability(
    @SerializedName("scheduleId") val scheduleId: String,
    @SerializedName("type") val type: String
)

data class UpdatePlayerRequest(
    val name: String,
    val availability: List<PlayerAvailability>
)