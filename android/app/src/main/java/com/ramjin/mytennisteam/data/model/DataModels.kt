package com.ramjin.mytennisteam.data.model


data class HomeData(
    val selectedGroup: Group,
    val schedules: List<Schedule>,
    val players: List<Player>,
    val courts: List<Court>
)