package com.ramjin.mytennisteam.data.model

import com.google.gson.annotations.SerializedName

data class GameHistory(
    @SerializedName("week") val week: Int,
    @SerializedName("status") val status: String,
    @SerializedName("date") val date: String
)