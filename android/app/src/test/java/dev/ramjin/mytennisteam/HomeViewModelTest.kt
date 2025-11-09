package dev.ramjin.mytennisteam

import androidx.arch.core.executor.testing.InstantTaskExecutorRule
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.SavedStateHandle
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.setMain
import kotlinx.coroutines.test.runTest
import okhttp3.ResponseBody.Companion.toResponseBody
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.Mock
import org.mockito.junit.MockitoJUnitRunner
import org.mockito.kotlin.any
import org.mockito.kotlin.mock
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import retrofit2.HttpException
import retrofit2.Response

@ExperimentalCoroutinesApi
@RunWith(MockitoJUnitRunner::class)
class HomeViewModelTest {

    @get:Rule
    val instantExecutorRule = InstantTaskExecutorRule()

    private val testDispatcher = UnconfinedTestDispatcher()

    @Mock
    private lateinit var apiService: ApiService

    private lateinit var viewModel: HomeViewModel

    @Before
    fun setup() {
        Dispatchers.setMain(testDispatcher)
        RetrofitClient.instance = apiService
        viewModel = HomeViewModel(SavedStateHandle())
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun `fetchInitialGroups success`() = runTest {
        val groups = listOf(Group("1", "Group 1", emptyList()))
        whenever(apiService.getGroups(any())).thenReturn(groups)
        val loadingViewModel = mock<LoadingViewModel>()

        viewModel.fetchInitialGroups("token", loadingViewModel)

        assertEquals(groups, viewModel.allGroups.value)
    }

    @Test
    fun `fetchInitialGroups failure`() = runTest {
        val exception = RuntimeException("Network error")
        whenever(apiService.getGroups(any())).thenThrow(exception)
        val loadingViewModel = mock<LoadingViewModel>()

        viewModel.fetchInitialGroups("token", loadingViewModel)

        assertEquals(null, viewModel.allGroups.value)
    }

    @Test
    fun `createGroup success`() = runTest {
        val newGroup = Group("2", "New Group", emptyList())
        val updatedGroups = listOf(Group("1", "Group 1", emptyList()), newGroup)
        whenever(apiService.createGroup(any(), any())).thenReturn(newGroup)
        whenever(apiService.getGroups(any())).thenReturn(updatedGroups)
        val loadingViewModel = mock<LoadingViewModel>()

        viewModel.createGroup("token", "New Group", loadingViewModel)

        verify(apiService).createGroup(any(), any())
        verify(apiService).getGroups(any())
        assertEquals(updatedGroups, viewModel.allGroups.value)
    }

    @Test
    fun `createGroup failure 401`() = runTest {
        val exception = HttpException(Response.error<Any>(401, "Unauthorized".toResponseBody()))
        whenever(apiService.createGroup(any(), any())).thenThrow(exception)
        val loadingViewModel = mock<LoadingViewModel>()

        viewModel.createGroup("token", "New Group", loadingViewModel)

        assertEquals(true, viewModel.forceLogout.value?.getContentIfNotHandled() != null)
    }

    @Test
    fun `createGroup failure generic`() = runTest {
        val exception = RuntimeException("Network error")
        whenever(apiService.createGroup(any(), any())).thenThrow(exception)
        val loadingViewModel = mock<LoadingViewModel>()

        viewModel.createGroup("token", "New Group", loadingViewModel)

        assertEquals(null, viewModel.allGroups.value)
    }

    @Test
    fun `updateGroup success`() = runTest {
        val updatedGroup = Group("1", "Updated Group", emptyList())
        val updatedGroups = listOf(updatedGroup)
        whenever(apiService.updateGroup(any(), any(), any())).thenReturn(updatedGroup)
        whenever(apiService.getGroups(any())).thenReturn(updatedGroups)
        val loadingViewModel = mock<LoadingViewModel>()

        viewModel.updateGroup("token", "1", "Updated Group", loadingViewModel)

        verify(apiService).updateGroup(any(), any(), any())
        verify(apiService).getGroups(any())
        assertEquals(updatedGroups, viewModel.allGroups.value)
    }

    @Test
    fun `updateGroup failure 401`() = runTest {
        val exception = HttpException(Response.error<Any>(401, "Unauthorized".toResponseBody()))
        whenever(apiService.updateGroup(any(), any(), any())).thenThrow(exception)
        val loadingViewModel = mock<LoadingViewModel>()

        viewModel.updateGroup("token", "1", "Updated Group", loadingViewModel)

        assertEquals(true, viewModel.forceLogout.value?.getContentIfNotHandled() != null)
    }

    @Test
    fun `updateGroup failure generic`() = runTest {
        val exception = RuntimeException("Network error")
        whenever(apiService.updateGroup(any(), any(), any())).thenThrow(exception)
        val loadingViewModel = mock<LoadingViewModel>()

        viewModel.updateGroup("token", "1", "Updated Group", loadingViewModel)

        assertEquals(null, viewModel.allGroups.value)
    }

    @Test
    fun `deleteGroup success`() = runTest {
        whenever(apiService.deleteGroup(any(), any())).thenReturn(Unit)
        whenever(apiService.getGroups(any())).thenReturn(emptyList())
        val loadingViewModel = mock<LoadingViewModel>()

        viewModel.deleteGroup("token", "1", loadingViewModel)

        verify(apiService).deleteGroup(any(), any())
        verify(apiService).getGroups(any())
        assertEquals(emptyList<Group>(), viewModel.allGroups.value)
    }

    @Test
    fun `deleteGroup failure 401`() = runTest {
        val exception = HttpException(Response.error<Any>(401, "Unauthorized".toResponseBody()))
        whenever(apiService.deleteGroup(any(), any())).thenThrow(exception)
        val loadingViewModel = mock<LoadingViewModel>()

        viewModel.deleteGroup("token", "1", loadingViewModel)

        assertEquals(true, viewModel.forceLogout.value?.getContentIfNotHandled() != null)
    }

    @Test
    fun `deleteGroup failure generic`() = runTest {
        val exception = RuntimeException("Network error")
        whenever(apiService.deleteGroup(any(), any())).thenThrow(exception)
        val loadingViewModel = mock<LoadingViewModel>()

        viewModel.deleteGroup("token", "1", loadingViewModel)

        assertEquals(null, viewModel.allGroups.value)
    }

    @Test
    fun `updateGroupAdmins success`() = runTest {
        val updatedGroup = Group("1", "Group 1", listOf("admin1"))
        val updatedGroups = listOf(updatedGroup)
        whenever(apiService.updateGroupAdmins(any(), any(), any())).thenReturn(Unit)
        whenever(apiService.getGroups(any())).thenReturn(updatedGroups)
        val loadingViewModel = mock<LoadingViewModel>()

        viewModel.updateGroupAdmins("token", "1", listOf("admin1"), loadingViewModel)

        verify(apiService).updateGroupAdmins(any(), any(), any())
        verify(apiService).getGroups(any())
        assertEquals(updatedGroups, viewModel.allGroups.value)
    }

    @Test
    fun `updateGroupAdmins failure 401`() = runTest {
        val exception = HttpException(Response.error<Any>(401, "Unauthorized".toResponseBody()))
        whenever(apiService.updateGroupAdmins(any(), any(), any())).thenThrow(exception)
        val loadingViewModel = mock<LoadingViewModel>()

        viewModel.updateGroupAdmins("token", "1", listOf("admin1"), loadingViewModel)

        assertEquals(true, viewModel.forceLogout.value?.getContentIfNotHandled() != null)
    }

    @Test
    fun `updateGroupAdmins failure generic`() = runTest {
        val exception = RuntimeException("Network error")
        whenever(apiService.updateGroupAdmins(any(), any(), any())).thenThrow(exception)
        val loadingViewModel = mock<LoadingViewModel>()

        viewModel.updateGroupAdmins("token", "1", listOf("admin1"), loadingViewModel)

        assertEquals(null, viewModel.allGroups.value)
    }

    @Test
    fun `loadDataForGroup success`() = runTest {
        val group = Group("1", "Group 1", emptyList())
        val schedules = listOf(Schedule("s1", "Schedule 1", "1", "Mon", "10", 1.0, false, 0, 0, emptyList(), 1, emptyList(), emptyList()))
        val players = listOf(Player("p1", "u1", "1", User("u1", "User 1", null, false), emptyList()))
        val courts = listOf(Court("c1", "Court 1", "1"))

        whenever(apiService.getSchedules(any(), any())).thenReturn(schedules)
        whenever(apiService.getPlayers(any(), any())).thenReturn(players)
        whenever(apiService.getCourts(any(), any())).thenReturn(courts)

        val loadingViewModel = mock<LoadingViewModel>()
        viewModel.loadDataForGroup("token", group, loadingViewModel)

        val expectedHomeData = HomeData(group, schedules, players, courts)
        assertEquals(expectedHomeData, viewModel.homeData.value)
    }

    @Test
    fun `loadDataForGroup failure 401`() = runTest {
        val group = Group("1", "Group 1", emptyList())
        val exception = HttpException(Response.error<Any>(401, "Unauthorized".toResponseBody()))
        whenever(apiService.getSchedules(any(), any())).thenThrow(exception)

        val loadingViewModel = mock<LoadingViewModel>()
        viewModel.loadDataForGroup("token", group, loadingViewModel)

        assertEquals(true, viewModel.forceLogout.value?.getContentIfNotHandled() != null)
    }

    @Test
    fun `loadDataForGroup failure generic`() = runTest {
        val group = Group("1", "Group 1", emptyList())
        val exception = RuntimeException("Network Error")
        whenever(apiService.getSchedules(any(), any())).thenThrow(exception)

        val loadingViewModel = mock<LoadingViewModel>()
        viewModel.loadDataForGroup("token", group, loadingViewModel)

        assertEquals(null, viewModel.homeData.value)
    }

    @Test
    fun `createCourt success`() = runTest {
        val loadingViewModel = mock<LoadingViewModel>()
        val group = Group("1", "Group 1", emptyList())
        val homeData = HomeData(group, emptyList(), emptyList(), emptyList())
        (viewModel.homeData as MutableLiveData).value = homeData
        whenever(apiService.createCourt(any(), any())).thenReturn(Court("c1", "New Court", "1"))
        whenever(apiService.getSchedules(any(), any())).thenReturn(emptyList())
        whenever(apiService.getPlayers(any(), any())).thenReturn(emptyList())
        whenever(apiService.getCourts(any(), any())).thenReturn(listOf(Court("c1", "New Court", "1")))

        viewModel.createCourt("token", "New Court", "1", loadingViewModel)

        verify(apiService).createCourt(any(), any())
        verify(apiService).getCourts(any(), any())
        assertEquals(1, viewModel.homeData.value?.courts?.size)
    }

    @Test
    fun `updateCourt success`() = runTest {
        val loadingViewModel = mock<LoadingViewModel>()
        val group = Group("1", "Group 1", emptyList())
        val homeData = HomeData(group, emptyList(), emptyList(), listOf(Court("c1", "Court 1", "1")))
        (viewModel.homeData as MutableLiveData).value = homeData
        whenever(apiService.updateCourt(any(), any(), any())).thenReturn(Court("c1", "Updated Court", "1"))
        whenever(apiService.getSchedules(any(), any())).thenReturn(emptyList())
        whenever(apiService.getPlayers(any(), any())).thenReturn(emptyList())
        whenever(apiService.getCourts(any(), any())).thenReturn(listOf(Court("c1", "Updated Court", "1")))

        viewModel.updateCourt("token", "c1", "Updated Court", "1", loadingViewModel)

        verify(apiService).updateCourt(any(), any(), any())
        verify(apiService).getCourts(any(), any())
        assertEquals("Updated Court", viewModel.homeData.value?.courts?.first()?.name)
    }

    @Test
    fun `deleteCourt success`() = runTest {
        val loadingViewModel = mock<LoadingViewModel>()
        val group = Group("1", "Group 1", emptyList())
        val homeData = HomeData(group, emptyList(), emptyList(), listOf(Court("c1", "Court 1", "1")))
        (viewModel.homeData as MutableLiveData).value = homeData
        whenever(apiService.deleteCourt(any(), any())).thenReturn(Unit)
        whenever(apiService.getSchedules(any(), any())).thenReturn(emptyList())
        whenever(apiService.getPlayers(any(), any())).thenReturn(emptyList())
        whenever(apiService.getCourts(any(), any())).thenReturn(emptyList())

        viewModel.deleteCourt("token", "c1", loadingViewModel)

        verify(apiService).deleteCourt(any(), any())
        verify(apiService).getCourts(any(), any())
        assertEquals(0, viewModel.homeData.value?.courts?.size)
    }

    @Test
    fun `createSchedule success`() = runTest {
        val loadingViewModel = mock<LoadingViewModel>()
        val group = Group("1", "Group 1", emptyList())
        val homeData = HomeData(group, emptyList(), emptyList(), emptyList())
        val newSchedule = Schedule("s1", "New Schedule", "1", "Mon", "10", 1.0, false, 0, 0, emptyList(), 1, emptyList(), emptyList())
        val request = CreateScheduleRequest("New Schedule", "1", emptyList(), "Mon", "10", 1.0, false, 0, 0, 4)

        (viewModel.homeData as MutableLiveData).value = homeData
        whenever(apiService.createSchedule(any(), any())).thenReturn(newSchedule)
        whenever(apiService.getSchedules(any(), any())).thenReturn(listOf(newSchedule))
        whenever(apiService.getPlayers(any(), any())).thenReturn(emptyList())
        whenever(apiService.getCourts(any(), any())).thenReturn(emptyList())

        viewModel.createSchedule("token", request, loadingViewModel)

        verify(apiService).createSchedule(any(), any())
        verify(apiService).getSchedules(any(), any())
        assertEquals(1, viewModel.homeData.value?.schedules?.size)
    }

    @Test
    fun `updateSchedule success`() = runTest {
        val loadingViewModel = mock<LoadingViewModel>()
        val group = Group("1", "Group 1", emptyList())
        val schedule = Schedule("s1", "Schedule 1", "1", "Mon", "10", 1.0, false, 0, 0, emptyList(), 1, emptyList(), emptyList())
        val homeData = HomeData(group, listOf(schedule), emptyList(), emptyList())
        val updatedSchedule = schedule.copy(name = "Updated Schedule")
        val request = UpdateScheduleRequest("Updated Schedule", "1", emptyList(), "Mon", "10", 1.0, false, 0, 0, 4)

        (viewModel.homeData as MutableLiveData).value = homeData
        whenever(apiService.updateSchedule(any(), any(), any())).thenReturn(updatedSchedule)
        whenever(apiService.getSchedules(any(), any())).thenReturn(listOf(updatedSchedule))
        whenever(apiService.getPlayers(any(), any())).thenReturn(emptyList())
        whenever(apiService.getCourts(any(), any())).thenReturn(emptyList())

        viewModel.updateSchedule("token", "s1", request, loadingViewModel)

        verify(apiService).updateSchedule(any(), any(), any())
        verify(apiService).getSchedules(any(), any())
        assertEquals("Updated Schedule", viewModel.homeData.value?.schedules?.first()?.name)
    }

    @Test
    fun `deleteSchedule success`() = runTest {
        val loadingViewModel = mock<LoadingViewModel>()
        val group = Group("1", "Group 1", emptyList())
        val schedule = Schedule("s1", "Schedule 1", "1", "Mon", "10", 1.0, false, 0, 0, emptyList(), 1, emptyList(), emptyList())
        val homeData = HomeData(group, listOf(schedule), emptyList(), emptyList())

        (viewModel.homeData as MutableLiveData).value = homeData
        whenever(apiService.deleteSchedule(any(), any())).thenReturn(Unit)
        whenever(apiService.getSchedules(any(), any())).thenReturn(emptyList())
        whenever(apiService.getPlayers(any(), any())).thenReturn(emptyList())
        whenever(apiService.getCourts(any(), any())).thenReturn(emptyList())

        viewModel.deleteSchedule("token", "s1", loadingViewModel)

        verify(apiService).deleteSchedule(any(), any())
        verify(apiService).getSchedules(any(), any())
        assertEquals(0, viewModel.homeData.value?.schedules?.size)
    }
    @Test
    fun `invitePlayer success`() = runTest {
        val loadingViewModel = mock<LoadingViewModel>()
        whenever(apiService.invitePlayer(any(), any(), any())).thenReturn(Unit)

        viewModel.invitePlayer("token", "1", "test@test.com", loadingViewModel)

        verify(apiService).invitePlayer(any(), any(), any())
    }

    @Test
    fun `updatePlayer success`() = runTest {
        val loadingViewModel = mock<LoadingViewModel>()
        val group = Group("1", "Group 1", emptyList())
        val user = User("u1", "User 1", null, false)
        val player = Player("p1", "u1", "1", user, emptyList())
        val homeData = HomeData(group, emptyList(), listOf(player), emptyList())
        val updatedPlayer = player.copy(user = user.copy(name = "Updated Player"))

        (viewModel.homeData as MutableLiveData).value = homeData
        whenever(apiService.updatePlayer(any(), any(), any())).thenReturn(updatedPlayer)
        whenever(apiService.getSchedules(any(), any())).thenReturn(emptyList())
        whenever(apiService.getPlayers(any(), any())).thenReturn(listOf(updatedPlayer))
        whenever(apiService.getCourts(any(), any())).thenReturn(emptyList())

        viewModel.updatePlayer("token", "p1", "Updated Player", emptyList(), loadingViewModel)

        verify(apiService).updatePlayer(any(), any(), any())
        verify(apiService).getPlayers(any(), any())
        assertEquals("Updated Player", viewModel.homeData.value?.players?.first()?.user?.name)
    }

    @Test
    fun `deletePlayer success`() = runTest {
        val loadingViewModel = mock<LoadingViewModel>()
        val group = Group("1", "Group 1", emptyList())
        val user = User("u1", "User 1", null, false)
        val player = Player("p1", "u1", "1", user, emptyList())
        val homeData = HomeData(group, emptyList(), listOf(player), emptyList())

        (viewModel.homeData as MutableLiveData).value = homeData
        whenever(apiService.deletePlayer(any(), any())).thenReturn(Unit)
        whenever(apiService.getSchedules(any(), any())).thenReturn(emptyList())
        whenever(apiService.getPlayers(any(), any())).thenReturn(emptyList())
        whenever(apiService.getCourts(any(), any())).thenReturn(emptyList())

        viewModel.deletePlayer("token", "p1", loadingViewModel)

        verify(apiService).deletePlayer(any(), any())
        verify(apiService).getPlayers(any(), any())
        assertEquals(0, viewModel.homeData.value?.players?.size)
    }

    @Test
    fun `fetchRotationButtonState success`() = runTest {
        val loadingViewModel = mock<LoadingViewModel>()
        val buttonState = RotationButtonState(true, "Generate Rotation", false)
        whenever(apiService.getRotationButtonState(any(), any())).thenReturn(buttonState)

        viewModel.fetchRotationButtonState("token", "s1", loadingViewModel)

        verify(apiService).getRotationButtonState(any(), any())
        assertEquals(buttonState, viewModel.rotationButtonState.value)
    }

    @Test
    fun `generateRotation success`() = runTest {
        val loadingViewModel = mock<LoadingViewModel>()
        val group = Group("1", "Group 1", emptyList())
        val homeData = HomeData(group, emptyList(), emptyList(), emptyList())
        val schedule = Schedule("s1", "Schedule 1", "1", "Mon", "10", 1.0, false, 0, 0, emptyList(), 1, emptyList(), emptyList())
        (viewModel.homeData as MutableLiveData).value = homeData
        whenever(apiService.generateRotation(any(), any())).thenReturn(schedule)
        whenever(apiService.getSchedules(any(), any())).thenReturn(emptyList())
        whenever(apiService.getPlayers(any(), any())).thenReturn(emptyList())
        whenever(apiService.getCourts(any(), any())).thenReturn(emptyList())
        whenever(apiService.getRotationButtonState(any(), any())).thenReturn(RotationButtonState(true, "", false))

        viewModel.generateRotation("token", "s1", loadingViewModel)

        verify(apiService).generateRotation(any(), any())
        verify(apiService).getSchedules(any(), any())
    }

    @Test
    fun `swapPlayer success`() = runTest {
        val loadingViewModel = mock<LoadingViewModel>()
        val group = Group("1", "Group 1", emptyList())
        val homeData = HomeData(group, emptyList(), emptyList(), emptyList())
        val schedule = Schedule("s1", "Schedule 1", "1", "Mon", "10", 1.0, false, 0, 0, emptyList(), 1, emptyList(), emptyList())
        (viewModel.homeData as MutableLiveData).value = homeData
        whenever(apiService.swapPlayers(any(), any(), any())).thenReturn(schedule)
        whenever(apiService.getSchedules(any(), any())).thenReturn(emptyList())
        whenever(apiService.getPlayers(any(), any())).thenReturn(emptyList())
        whenever(apiService.getCourts(any(), any())).thenReturn(emptyList())

        viewModel.swapPlayer("token", "s1", "p1", "p2", loadingViewModel)

        verify(apiService).swapPlayers(any(), any(), any())
        verify(apiService).getSchedules(any(), any())
    }
}
