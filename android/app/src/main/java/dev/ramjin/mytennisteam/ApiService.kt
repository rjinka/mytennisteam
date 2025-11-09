package dev.ramjin.mytennisteam

import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Path

interface ApiService {

    // --- Auth ---
    @POST("api/auth/google/mobile")
    suspend fun authenticateWithGoogle(@Body request: AuthRequest): AuthResponse

    // --- Groups ---
    @GET("api/groups/player")
    suspend fun getGroups(@Header("Authorization") token: String): List<Group>

    @POST("api/groups")
    suspend fun createGroup(@Header("Authorization") token: String, @Body request: CreateGroupRequest): Group

    @PUT("api/groups/{id}")
    suspend fun updateGroup(@Header("Authorization") token: String, @Path("id") groupId: String, @Body request: UpdateGroupRequest): Group

    @DELETE("api/groups/{id}")
    suspend fun deleteGroup(@Header("Authorization") token: String, @Path("id") groupId: String)

    @POST("api/groups/{groupId}/invite")
    suspend fun invitePlayer(@Header("Authorization") token: String, @Path("groupId") groupId: String, @Body request: InvitePlayerRequest)

    @PUT("api/groups/{id}/admins")
    suspend fun updateGroupAdmins(@Header("Authorization") token: String, @Path("id") groupId: String, @Body request: UpdateGroupAdminsRequest)

    // --- Players ---
    @GET("api/players/{groupId}")
    suspend fun getPlayers(@Header("Authorization") token: String, @Path("groupId") groupId: String): List<Player>

    @PUT("api/players/{id}")
    suspend fun updatePlayer(@Header("Authorization") token: String, @Path("id") playerId: String, @Body request: UpdatePlayerRequest): Player

    @DELETE("api/players/{id}")
    suspend fun deletePlayer(@Header("Authorization") token: String, @Path("id") playerId: String)

    // --- Courts ---
    @GET("api/courts/{groupId}")
    suspend fun getCourts(@Header("Authorization") token: String, @Path("groupId") groupId: String): List<Court>

    @POST("api/courts")
    suspend fun createCourt(@Header("Authorization") token: String, @Body request: CreateCourtRequest): Court

    @PUT("api/courts/{id}")
    suspend fun updateCourt(@Header("Authorization") token: String, @Path("id") courtId: String, @Body request: UpdateCourtRequest): Court

    @DELETE("api/courts/{id}")
    suspend fun deleteCourt(@Header("Authorization") token: String, @Path("id") courtId: String)

    // --- Schedules ---
    @GET("api/schedules/{groupId}")
    suspend fun getSchedules(@Header("Authorization") token: String, @Path("groupId") groupId: String): List<Schedule>

    @POST("api/schedules")
    suspend fun createSchedule(@Header("Authorization") token: String, @Body request: CreateScheduleRequest): Schedule

    @PUT("api/schedules/{id}")
    suspend fun updateSchedule(@Header("Authorization") token: String, @Path("id") scheduleId: String, @Body request: UpdateScheduleRequest): Schedule

    @DELETE("api/schedules/{id}")
    suspend fun deleteSchedule(@Header("Authorization") token: String, @Path("id") scheduleId: String)

    // --- Rotation & Swapping ---
    @GET("api/schedules/{id}/rotation-button-state")
    suspend fun getRotationButtonState(@Header("Authorization") token: String, @Path("id") scheduleId: String): RotationButtonState

    @POST("api/schedules/{scheduleId}/generate")
    suspend fun generateRotation(@Header("Authorization") token: String, @Path("scheduleId") scheduleId: String): Schedule

    @PUT("api/schedules/{id}/swap")
    suspend fun swapPlayers(@Header("Authorization") token: String, @Path("id") scheduleId: String, @Body request: SwapPlayerRequest): Schedule

    // --- Stats ---
    @GET("api/stats/player/{playerId}")
    suspend fun getPlayerStats(@Header("Authorization") token: String, @Path("playerId") playerId: String): List<PlayerStat>

    @GET("api/stats/schedule/{scheduleId}")
    suspend fun getScheduleStats(@Header("Authorization") token: String, @Path("scheduleId") scheduleId: String): List<ScheduleStat>

    // --- Invitations ---
    @POST("api/invitations/accept/{join_token}")
    suspend fun acceptInvitation(@Header("Authorization") token: String, @Path("join_token") joinToken: String)

    @POST("/api/groups/{groupId}/join")
    suspend fun joinGroup(
        @Header("Authorization") token: String,
        @Path("groupId") groupId: String
    ): JoinGroupResponse

}