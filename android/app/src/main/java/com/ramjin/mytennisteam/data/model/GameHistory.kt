package com.ramjin.mytennisteam.data.model

import com.google.gson.annotations.SerializedName

data class GameHistory(
    @SerializedName("occurrenceNumber") val occurrenceNumber: Int,
    @SerializedName("status") val status: String,
    @SerializedName("date") val date: String
)