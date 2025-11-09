package dev.ramjin.mytennisteam

import org.junit.Assert.assertEquals
import org.junit.Test

class ModelsTest {

    @Test
    fun testGroup() {
        val group = Group("1", "Group 1", "owner1", emptyList())
        assertEquals("1", group.id)
        assertEquals("Group 1", group.name)
        assertEquals("owner1", group.createdBy)
        assertEquals(emptyList<String>(), group.admins)
    }

    @Test
    fun testPlayer() {
        val user = User("Test User", "picture")
        val player = Player("1", user, "userId", "groupId", emptyList())
        assertEquals("1", player.id)
        assertEquals(user, player.user)
        assertEquals("userId", player.userId)
        assertEquals("groupId", player.groupid)
        assertEquals(emptyList<PlayerAvailability>(), player.availability)
    }

    @Test
    fun testUser() {
        val user = User("Test User", "picture")
        assertEquals("Test User", user.name)
        assertEquals("picture", user.picture)
    }

    @Test
    fun testPlayerAvailability() {
        val availability = PlayerAvailability("scheduleId", "type")
        assertEquals("scheduleId", availability.scheduleId)
        assertEquals("type", availability.type)
    }

    @Test
    fun testSchedule() {
        val schedule = Schedule("1", "Schedule 1", "groupId", emptyList(), "Monday", "10:00", 1.5, "Singles", false, 0, 0, 4, 1, 0, false, emptyList(), emptyList(), false)
        assertEquals("1", schedule.id)
        assertEquals("Schedule 1", schedule.name)
        assertEquals("groupId", schedule.groupid)
        assertEquals(emptyList<ScheduleCourt>(), schedule.courts)
        assertEquals("Monday", schedule.day)
        assertEquals("10:00", schedule.time)
        assertEquals(1.5, schedule.duration, 0.0)
        assertEquals("Singles", schedule.gameType)
        assertEquals(false, schedule.recurring)
        assertEquals(0, schedule.frequency)
        assertEquals(0, schedule.recurrenceCount)
        assertEquals(4, schedule.maxPlayersCount)
        assertEquals(1, schedule.week)
        assertEquals(0, schedule.lastGeneratedWeek)
        assertEquals(false, schedule.isRotationGenerated)
        assertEquals(emptyList<String>(), schedule.playingPlayersIds)
        assertEquals(emptyList<String>(), schedule.benchPlayersIds)
        assertEquals(false, schedule.isCompleted)
    }

    @Test
    fun testScheduleCourt() {
        val scheduleCourt = ScheduleCourt("courtId", "Doubles")
        assertEquals("courtId", scheduleCourt.courtId)
        assertEquals("Doubles", scheduleCourt.gameType)
    }

    @Test
    fun testCourt() {
        val court = Court("1", "Court 1", "groupId")
        assertEquals("1", court.id)
        assertEquals("Court 1", court.name)
        assertEquals("groupId", court.groupid)
    }

    @Test
    fun testHomeData() {
        val group = Group("1", "Group 1", "owner1", emptyList())
        val homeData = HomeData(group, emptyList(), emptyList(), emptyList())
        assertEquals(group, homeData.selectedGroup)
        assertEquals(emptyList<Schedule>(), homeData.schedules)
        assertEquals(emptyList<Player>(), homeData.players)
        assertEquals(emptyList<Court>(), homeData.courts)
    }

    @Test
    fun testUserPrincipal() {
        val userPrincipal = UserPrincipal("1", true)
        assertEquals("1", userPrincipal.id)
        assertEquals(true, userPrincipal.isSuperAdmin)
    }

    @Test
    fun testAuthRequest() {
        val authRequest = AuthRequest("token")
        assertEquals("token", authRequest.token)
    }

    @Test
    fun testAuthResponse() {
        val userPrincipal = UserPrincipal("1", true)
        val authResponse = AuthResponse("token", userPrincipal)
        assertEquals("token", authResponse.token)
        assertEquals(userPrincipal, authResponse.user)
    }

    @Test
    fun testUpdateGroupRequest() {
        val updateGroupRequest = UpdateGroupRequest("New Name")
        assertEquals("New Name", updateGroupRequest.name)
    }

    @Test
    fun testCreateGroupRequest() {
        val createGroupRequest = CreateGroupRequest("New Group")
        assertEquals("New Group", createGroupRequest.name)
    }

    @Test
    fun testCreateCourtRequest() {
        val createCourtRequest = CreateCourtRequest("New Court", "groupId")
        assertEquals("New Court", createCourtRequest.name)
        assertEquals("groupId", createCourtRequest.groupid)
    }

    @Test
    fun testUpdateCourtRequest() {
        val updateCourtRequest = UpdateCourtRequest("New Name", "groupId")
        assertEquals("New Name", updateCourtRequest.name)
        assertEquals("groupId", updateCourtRequest.groupid)
    }

    @Test
    fun testCreateScheduleRequest() {
        val createScheduleRequest = CreateScheduleRequest("New Schedule", "groupId", "Monday", "10:00", 1.5, emptyList(), false, 0, 0, 4)
        assertEquals("New Schedule", createScheduleRequest.name)
        assertEquals("groupId", createScheduleRequest.groupid)
        assertEquals("Monday", createScheduleRequest.day)
        assertEquals("10:00", createScheduleRequest.time)
        assertEquals(1.5, createScheduleRequest.duration, 0.0)
        assertEquals(emptyList<ScheduleCourt>(), createScheduleRequest.courts)
        assertEquals(false, createScheduleRequest.recurring)
        assertEquals(0, createScheduleRequest.frequency)
        assertEquals(0, createScheduleRequest.recurrenceCount)
        assertEquals(4, createScheduleRequest.maxPlayersCount)
    }

    @Test
    fun testUpdateScheduleRequest() {
        val updateScheduleRequest = UpdateScheduleRequest("New Name", "Monday", "10:00", 1.5, emptyList(), false, 0, 0, 4)
        assertEquals("New Name", updateScheduleRequest.name)
        assertEquals("Monday", updateScheduleRequest.day)
        assertEquals("10:00", updateScheduleRequest.time)
        assertEquals(1.5, updateScheduleRequest.duration, 0.0)
        assertEquals(emptyList<ScheduleCourt>(), updateScheduleRequest.courts)
        assertEquals(false, updateScheduleRequest.recurring)
        assertEquals(0, updateScheduleRequest.frequency)
        assertEquals(0, updateScheduleRequest.recurrenceCount)
        assertEquals(4, updateScheduleRequest.maxPlayersCount)
    }

    @Test
    fun testInvitePlayerRequest() {
        val invitePlayerRequest = InvitePlayerRequest("test@example.com")
        assertEquals("test@example.com", invitePlayerRequest.email)
    }

    @Test
    fun testUpdatePlayerRequest() {
        val updatePlayerRequest = UpdatePlayerRequest("New Name", emptyList())
        assertEquals("New Name", updatePlayerRequest.name)
        assertEquals(emptyList<PlayerAvailability>(), updatePlayerRequest.availability)
    }

    @Test
    fun testSwapPlayerRequest() {
        val swapPlayerRequest = SwapPlayerRequest("playerInId", "playerOutId")
        assertEquals("playerInId", swapPlayerRequest.playerInId)
        assertEquals("playerOutId", swapPlayerRequest.playerOutId)
    }

    @Test
    fun testRotationButtonState() {
        val rotationButtonState = RotationButtonState(true, false, "Generate Rotation")
        assertEquals(true, rotationButtonState.visible)
        assertEquals(false, rotationButtonState.disabled)
        assertEquals("Generate Rotation", rotationButtonState.text)
    }
}
