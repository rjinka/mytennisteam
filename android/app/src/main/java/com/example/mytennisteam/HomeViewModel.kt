package com.example.mytennisteam

import android.util.Log
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.launch

// Data class for the main screen's entire state
data class HomeData(
    val selectedGroup: Group,
    val schedules: List<Schedule>,
    val players: List<Player>,
    val courts: List<Court>
)

class HomeViewModel : ViewModel() {

    private val _allGroups = MutableLiveData<List<Group>>()
    val allGroups: LiveData<List<Group>> = _allGroups

    private val _homeData = MutableLiveData<HomeData>()
    val homeData: LiveData<HomeData> = _homeData

    private val _selectedSchedule = MutableLiveData<Schedule?>()
    val selectedSchedule: LiveData<Schedule?> = _selectedSchedule

    private val _rotationButtonState = MutableLiveData<RotationButtonState>()
    val rotationButtonState: LiveData<RotationButtonState> = _rotationButtonState

    fun onScheduleSelected(schedule: Schedule, token: String) {
        _selectedSchedule.value = schedule
        fetchRotationButtonState(token, schedule.id)
    }

    fun onScheduleDeselected() {
        _selectedSchedule.value = null
    }

    fun fetchInitialGroups(token: String) {
        viewModelScope.launch {
            try {
                val groups = RetrofitClient.instance.getGroups(token)
                _allGroups.value = groups
                groups.firstOrNull()?.let {
                    loadDataForGroup(token, it)
                }
            } catch (e: Exception) {
                Log.e("HomeViewModel", "Failed to fetch groups", e)
            }
        }
    }

    fun loadDataForGroup(token: String, group: Group) {
        viewModelScope.launch {
            try {
                coroutineScope {
                    val schedulesDeferred = async { RetrofitClient.instance.getSchedules(token, group.id) }
                    val playersDeferred = async { RetrofitClient.instance.getPlayers(token, group.id) }
                    val courtsDeferred = async { RetrofitClient.instance.getCourts(token, group.id) }

                    val schedules = schedulesDeferred.await()
                    val players = playersDeferred.await()
                    val courts = courtsDeferred.await()

                    _homeData.value = HomeData(group, schedules, players, courts)
                }
            } catch (e: Exception) {
                Log.e("HomeViewModel", "Failed to load data for group ${group.name}", e)
            }
        }
    }

    fun createGroup(token: String, groupName: String) {
        viewModelScope.launch {
            try {
                RetrofitClient.instance.createGroup(token, CreateGroupRequest(name = groupName))
                fetchInitialGroups(token)
            } catch (e: Exception) {
                Log.e("HomeViewModel", "Failed to create group", e)
            }
        }
    }

    fun updateGroup(token: String, groupId: String, newName: String) {
        viewModelScope.launch {
            try {
                RetrofitClient.instance.updateGroup(token, groupId, UpdateGroupRequest(name = newName))
                fetchInitialGroups(token)
            } catch (e: Exception) {
                Log.e("HomeViewModel", "Failed to update group", e)
            }
        }
    }

    fun deleteGroup(token: String, groupId: String) {
        viewModelScope.launch {
            try {
                RetrofitClient.instance.deleteGroup(token, groupId)
                fetchInitialGroups(token)
            } catch (e: Exception) {
                Log.e("HomeViewModel", "Failed to delete group", e)
            }
        }
    }

    fun createCourt(token: String, courtName: String, groupId: String) {
        viewModelScope.launch {
            try {
                RetrofitClient.instance.createCourt(token, CreateCourtRequest(name = courtName, groupid = groupId))
                _homeData.value?.selectedGroup?.let { loadDataForGroup(token, it) }
            } catch (e: Exception) {
                Log.e("HomeViewModel", "Failed to create court", e)
            }
        }
    }

    fun updateCourt(token: String, courtId: String, newName: String, groupId: String) {
        viewModelScope.launch {
            try {
                RetrofitClient.instance.updateCourt(token, courtId, UpdateCourtRequest(name = newName, groupid = groupId))
                _homeData.value?.selectedGroup?.let { loadDataForGroup(token, it) }
            } catch (e: Exception) {
                Log.e("HomeViewModel", "Failed to update court", e)
            }
        }
    }

    fun deleteCourt(token: String, courtId: String) {
        viewModelScope.launch {
            try {
                RetrofitClient.instance.deleteCourt(token, courtId)
                _homeData.value?.selectedGroup?.let { loadDataForGroup(token, it) }
            } catch (e: Exception) {
                Log.e("HomeViewModel", "Failed to delete court", e)
            }
        }
    }

    fun createSchedule(token: String, request: CreateScheduleRequest) {
        viewModelScope.launch {
            try {
                RetrofitClient.instance.createSchedule(token, request)
                _homeData.value?.selectedGroup?.let { loadDataForGroup(token, it) }
            } catch (e: Exception) {
                Log.e("HomeViewModel", "Failed to create schedule", e)
            }
        }
    }

    fun updateSchedule(token: String, scheduleId: String, request: UpdateScheduleRequest) {
        viewModelScope.launch {
            try {
                RetrofitClient.instance.updateSchedule(token, scheduleId, request)
                _homeData.value?.selectedGroup?.let { loadDataForGroup(token, it) }
            } catch (e: Exception) {
                Log.e("HomeViewModel", "Failed to update schedule", e)
            }
        }
    }

    fun deleteSchedule(token: String, scheduleId: String) {
        viewModelScope.launch {
            try {
                RetrofitClient.instance.deleteSchedule(token, scheduleId)
                _homeData.value?.selectedGroup?.let { loadDataForGroup(token, it) }
            } catch (e: Exception) {
                Log.e("HomeViewModel", "Failed to delete schedule", e)
            }
        }
    }

    fun invitePlayer(token: String, groupId: String, email: String) {
        viewModelScope.launch {
            try {
                RetrofitClient.instance.invitePlayer(token, groupId, InvitePlayerRequest(email = email))
            } catch (e: Exception) {
                Log.e("HomeViewModel", "Failed to send invitation", e)
            }
        }
    }

    fun updatePlayer(token: String, playerId: String, newName: String, newAvailability: List<PlayerAvailability>) {
        viewModelScope.launch {
            try {
                RetrofitClient.instance.updatePlayer(token, playerId, UpdatePlayerRequest(name = newName, availability = newAvailability))
                _homeData.value?.selectedGroup?.let { loadDataForGroup(token, it) }
            } catch (e: Exception) {
                Log.e("HomeViewModel", "Failed to update player", e)
            }
        }
    }

    fun deletePlayer(token: String, playerId: String) {
        viewModelScope.launch {
            try {
                RetrofitClient.instance.deletePlayer(token, playerId)
                _homeData.value?.selectedGroup?.let { loadDataForGroup(token, it) }
            } catch (e: Exception) {
                Log.e("HomeViewModel", "Failed to delete player", e)
            }
        }
    }

    fun fetchRotationButtonState(token: String, scheduleId: String) {
        viewModelScope.launch {
            try {
                val state = RetrofitClient.instance.getRotationButtonState(token, scheduleId)
                _rotationButtonState.value = state
            } catch (e: Exception) {
                Log.e("HomeViewModel", "Failed to fetch rotation button state", e)
            }
        }
    }

    fun generateRotation(token: String, scheduleId: String) {
        viewModelScope.launch {
            try {
                RetrofitClient.instance.generateRotation(token, scheduleId)
                _homeData.value?.selectedGroup?.let {
                    loadDataForGroup(token, it)
                }
                fetchRotationButtonState(token, scheduleId)
            } catch (e: Exception) {
                Log.e("HomeViewModel", "Failed to generate rotation", e)
            }
        }
    }

    fun swapPlayer(token: String, scheduleId: String, playerInId: String, playerOutId: String) {
        viewModelScope.launch {
            try {
                val request = SwapPlayerRequest(playerInId = playerInId, playerOutId = playerOutId)
                RetrofitClient.instance.swapPlayers(token, scheduleId, request)
                _homeData.value?.selectedGroup?.let { loadDataForGroup(token, it) }
            } catch (e: Exception) {
                Log.e("HomeViewModel", "Failed to swap player", e)
            }
        }
    }
}
