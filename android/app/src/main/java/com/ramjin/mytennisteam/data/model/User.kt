package com.ramjin.mytennisteam.data.model

import com.google.gson.annotations.SerializedName

data class User(
    @SerializedName("id") val id: String,
    @SerializedName("name") val name: String,
    @SerializedName("picture") val picture: String?,
    @SerializedName("isSuperAdmin") val isSuperAdmin: Boolean = false
)

data class AuthRequest(val token: String)

data class AuthResponse(val token: String, val user: User)

data class SubmitSupportRequest(val groupId: String?, val message: String)