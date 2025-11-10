package com.ramjin.mytennisteam

import com.ramjin.mytennisteam.AuthRequest
import com.ramjin.mytennisteam.AuthResponse
import com.ramjin.mytennisteam.Court
import com.ramjin.mytennisteam.CreateCourtRequest
import com.ramjin.mytennisteam.CreateGroupRequest
import com.ramjin.mytennisteam.CreateScheduleRequest
import com.ramjin.mytennisteam.Group
import com.ramjin.mytennisteam.InvitePlayerRequest
import com.ramjin.mytennisteam.Player
import com.ramjin.mytennisteam.PlayerAvailability
import com.ramjin.mytennisteam.RotationButtonState
import com.ramjin.mytennisteam.Schedule
import com.ramjin.mytennisteam.ScheduleCourtInfo
import com.ramjin.mytennisteam.SwapPlayerRequest
import com.ramjin.mytennisteam.UpdateCourtRequest
import com.ramjin.mytennisteam.UpdateGroupRequest
import com.ramjin.mytennisteam.UpdatePlayerRequest
import com.ramjin.mytennisteam.UpdateScheduleRequest
import com.ramjin.mytennisteam.User
import org.junit.Assert.assertEquals
import org.junit.Test

class ModelsTest {

    @Test
    fun testGroup() {
        val group = Group("1", "Group 1", emptyList())
        assertEquals("1", group.id)
        assertEquals("Group 1", group.name)
        assertEquals(emptyList<String>(), group.admins)
    }

    @Test
    fun testPlayer() {
        val user = User("userId", "Test User", "picture")
        val player = Player("1", "userId", "groupId", user, emptyList())
        assertEquals("1", player.id)
        assertEquals(user, player.user)
        assertEquals("userId", player.userId)
        assertEquals("groupId", player.groupId)
        assertEquals(emptyList<PlayerAvailability>(), player.availability)
    }

    @Test
    fun testUser() {
        val user = User("id", "Test User", "picture", true)
        assertEquals("id", user.id)
        assertEquals("Test User", user.name)
        assertEquals("picture", user.picture)
        assertEquals(true, user.isSuperAdmin)
    }

    @Test
    fun testPlayerAvailability() {
        val availability = PlayerAvailability("scheduleId", "type")
        assertEquals("scheduleId", availability.scheduleId)
        assertEquals("type", availability.type)
    }

    @Test
    fun testSchedule() {
        val schedule = Schedule(
            "1",
            "Schedule 1",
            "groupId",
            "Monday",
            "10:00",
            1.5,
            false,
            0,
            0,
            emptyList(),
            1,
            emptyList(),
            emptyList()
        )
        assertEquals("1", schedule.id)
        assertEquals("Schedule 1", schedule.name)
        assertEquals("groupId", schedule.groupId)
        assertEquals("Monday", schedule.day)
        assertEquals("10:00", schedule.time)
        assertEquals(1.5, schedule.duration, 0.0)
        assertEquals(false, schedule.recurring)
        assertEquals(0, schedule.frequency)
        assertEquals(0, schedule.recurrenceCount)
        assertEquals(emptyList<ScheduleCourtInfo>(), schedule.courts)
        assertEquals(1, schedule.week)
        assertEquals(emptyList<String>(), schedule.playingPlayersIds)
        assertEquals(emptyList<String>(), schedule.benchPlayersIds)
    }

    @Test
    fun testScheduleCourtInfo() {
        val scheduleCourt = ScheduleCourtInfo("courtId", "Doubles")
        assertEquals("courtId", scheduleCourt.courtId)
        assertEquals("Doubles", scheduleCourt.gameType)
    }

    @Test
    fun testCourt() {
        val court = Court("1", "Court 1", "groupId")
        assertEquals("1", court.id)
        assertEquals("Court 1", court.name)
        assertEquals("groupId", court.groupId)
    }

    @Test
    fun testAuthRequest() {
        val authRequest = AuthRequest("token")
        assertEquals("token", authRequest.token)
    }

    @Test
    fun testAuthResponse() {
        val user = User("1", "test", "pic", true)
        val authResponse = AuthResponse("token", user)
        assertEquals("token", authResponse.token)
        assertEquals(user, authResponse.user)
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
        assertEquals("groupId", createCourtRequest.groupId)
    }

    @Test
    fun testUpdateCourtRequest() {
        val updateCourtRequest = UpdateCourtRequest("New Name", "groupId")
        assertEquals("New Name", updateCourtRequest.name)
        assertEquals("groupId", updateCourtRequest.groupId)
    }

    @Test
    fun testCreateScheduleRequest() {
        val createScheduleRequest = CreateScheduleRequest(
            "New Schedule",
            "groupId",
            emptyList(),
            "Monday",
            "10:00",
            1.5,
            false,
            0,
            0,
            4
        )
        assertEquals("New Schedule", createScheduleRequest.name)
        assertEquals("groupId", createScheduleRequest.groupId)
        assertEquals("Monday", createScheduleRequest.day)
        assertEquals("10:00", createScheduleRequest.time)
        assertEquals(1.5, createScheduleRequest.duration, 0.0)
        assertEquals(emptyList<ScheduleCourtInfo>(), createScheduleRequest.courts)
        assertEquals(false, createScheduleRequest.recurring)
        assertEquals(0, createScheduleRequest.frequency)
        assertEquals(0, createScheduleRequest.recurrenceCount)
        assertEquals(4, createScheduleRequest.maxPlayersCount)
    }

    @Test
    fun testUpdateScheduleRequest() {
        val updateScheduleRequest = UpdateScheduleRequest(
            "New Name",
            "groupId",
            emptyList(),
            "Monday",
            "10:00",
            1.5,
            false,
            0,
            0,
            4
        )
        assertEquals("New Name", updateScheduleRequest.name)
        assertEquals("groupId", updateScheduleRequest.groupId)
        assertEquals(emptyList<ScheduleCourtInfo>(), updateScheduleRequest.courts)
        assertEquals("Monday", updateScheduleRequest.day)
        assertEquals("10:00", updateScheduleRequest.time)
        assertEquals(1.5, updateScheduleRequest.duration, 0.0)
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
        val rotationButtonState = RotationButtonState(true, "Generate Rotation", false)
        assertEquals(true, rotationButtonState.visible)
        assertEquals("Generate Rotation", rotationButtonState.text)
        assertEquals(false, rotationButtonState.disabled)
    }
}