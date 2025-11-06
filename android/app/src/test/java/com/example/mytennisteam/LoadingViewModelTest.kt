package com.example.mytennisteam

import androidx.arch.core.executor.testing.InstantTaskExecutorRule
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.junit.MockitoJUnitRunner

@RunWith(MockitoJUnitRunner::class)
class LoadingViewModelTest {

    @get:Rule
    val instantExecutorRule = InstantTaskExecutorRule()

    private lateinit var viewModel: LoadingViewModel

    @Before
    fun setup() {
        viewModel = LoadingViewModel()
    }

    @Test
    fun `showLoading sets isLoading to true`() {
        viewModel.showLoading()
        assertTrue(viewModel.isLoading.value ?: false)
    }

    @Test
    fun `hideLoading sets isLoading to false`() {
        viewModel.hideLoading()
        assertFalse(viewModel.isLoading.value ?: true)
    }
}
