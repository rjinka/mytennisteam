package dev.ramjin.mytennisteam

import androidx.arch.core.executor.testing.InstantTaskExecutorRule
import androidx.lifecycle.SavedStateHandle
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.setMain
import kotlinx.coroutines.test.runTest
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
import org.mockito.kotlin.whenever

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
}
