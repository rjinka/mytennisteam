package com.ramjin.mytennisteam.data.model

import com.google.gson.annotations.SerializedName


data class Group(
    @SerializedName("id") val id: String,
    @SerializedName("name") val name: String,
    @SerializedName("admins") val admins: List<String>
)

data class CreateGroupRequest(val name: String)

data class UpdateGroupRequest(val name: String)

data class JoinGroupResponse(val message: String)

data class UpdateGroupAdminsRequest(val adminUserIds: List<String>)

data class InvitePlayerRequest(val email: String)