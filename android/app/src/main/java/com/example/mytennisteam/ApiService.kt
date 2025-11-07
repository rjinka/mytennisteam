package com.example.mytennisteam

import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Path

interface ApiService {
    @POST("/api/auth/google/mobile")
    suspend fun authenticateWithGoogle(@Body body: AuthRequest): AuthResponse

    @GET("/api/groups/player")
    suspend fun getGroups(@Header("Authorization") token: String): List<Group>

    @GET("/api/schedules/{groupid}")
    suspend fun getSchedules(@Header("Authorization") token: String, @Path("groupid") groupId: String): List<Schedule>

    @GET("/api/players/{groupid}")
    suspend fun getPlayers(@Header("Authorization") token: String, @Path("groupid") groupId: String): List<Player>

    @GET("/api/courts/{groupid}")
    suspend fun getCourts(@Header("Authorization") token: String, @Path("groupid") groupId: String): List<Court>

    @PUT("/api/groups/{id}")
    suspend fun updateGroup(
        @Header("Authorization") token: String,
        @Path("id") groupId: String,
        @Body body: UpdateGroupRequest
    ): Group

    @DELETE("/api/groups/{id}")
    suspend fun deleteGroup(
        @Header("Authorization") token: String,
        @Path("id") groupId: String
    )

    @POST("/api/groups")
    suspend fun createGroup(
        @Header("Authorization") token: String,
        @Body body: CreateGroupRequest
    ): Group

    @POST("/api/courts")
    suspend fun createCourt(
        @Header("Authorization") token: String,
        @Body body: CreateCourtRequest
    ): Court

    @PUT("/api/courts/{id}")
    suspend fun updateCourt(
        @Header("Authorization") token: String,
        @Path("id") courtId: String,
        @Body body: UpdateCourtRequest
    ): Court

    @DELETE("/api/courts/{id}")
    suspend fun deleteCourt(
        @Header("Authorization") token: String,
        @Path("id") courtId: String
    )

    @POST("/api/schedules")
    suspend fun createSchedule(
        @Header("Authorization") token: String,
        @Body body: CreateScheduleRequest
    ): Schedule

    @PUT("/api/schedules/{id}")
    suspend fun updateSchedule(
        @Header("Authorization") token: String,
        @Path("id") scheduleId: String,
        @Body body: UpdateScheduleRequest
    ): Schedule

    @DELETE("/api/schedules/{id}")
    suspend fun deleteSchedule(
        @Header("Authorization") token: String,
        @Path("id") scheduleId: String
    )

    @POST("/api/groups/{groupId}/invite")
    suspend fun invitePlayer(
        @Header("Authorization") token: String,
        @Path("groupId") groupId: String,
        @Body body: InvitePlayerRequest
    )

    @PUT("/api/players/{id}")
    suspend fun updatePlayer(
        @Header("Authorization") token: String,
        @Path("id") playerId: String,
        @Body body: UpdatePlayerRequest
    ): Player

    @DELETE("/api/players/{id}")
    suspend fun deletePlayer(
        @Header("Authorization") token: String,
        @Path("id") playerId: String
    )

    @POST("/api/invitations/accept/{join_token}")
    suspend fun acceptInvitation(
        @Header("Authorization") authToken: String,
        @Path("join_token") joinToken: String
    )

    @GET("/api/schedules/{id}/rotation-button-state")
    suspend fun getRotationButtonState(
        @Header("Authorization") token: String,
        @Path("id") scheduleId: String
    ): RotationButtonState

    @POST("/api/schedules/{id}/generate-rotation")
    suspend fun generateRotation(
        @Header("Authorization") token: String,
        @Path("id") scheduleId: String
    )

    @PUT("/api/schedules/{id}/swapPlayers")
    suspend fun swapPlayers(
        @Header("Authorization") token: String,
        @Path("id") scheduleId: String,
        @Body body: SwapPlayerRequest
    )

    @GET("/api/stats/player/{playerId}")
    suspend fun getPlayerStats(
        @Header("Authorization") token: String,
        @Path("playerId") playerId: String
    ): List<PlayerStat>

    @GET("/api/stats/schedule/{scheduleId}")
    suspend fun getScheduleStats(
        @Header("Authorization") token: String,
        @Path("scheduleId") scheduleId: String
    ): List<ScheduleStatResponse>
}
