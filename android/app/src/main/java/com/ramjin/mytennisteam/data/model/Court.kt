package com.ramjin.mytennisteam.data.model

import com.google.gson.annotations.SerializedName


data class Court(
    @SerializedName("id") val id: String,
    @SerializedName("name") val name: String,
    @SerializedName("groupId") val groupId: String
)

data class CreateCourtRequest(
    val name: String,
    @SerializedName("groupId") val groupId: String
)

data class UpdateCourtRequest(
    val name: String,
    @SerializedName("groupId") val groupId: String
)

data class ScheduleCourtInfo(@SerializedName("courtId") val courtId: String, @SerializedName("gameType") val gameType: String)

