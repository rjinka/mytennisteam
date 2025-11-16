package com.ramjin.mytennisteam.viewmodel

import android.util.Log
import androidx.lifecycle.*
import androidx.lifecycle.viewmodel.CreationExtras
import com.ramjin.mytennisteam.data.api.RetrofitClient
import com.ramjin.mytennisteam.data.model.*
import com.ramjin.mytennisteam.util.Event
import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.launch
import retrofit2.HttpException

class HomeViewModel(private val savedStateHandle: SavedStateHandle) : ViewModel() {

    private val _allGroups = MutableLiveData<List<Group>>()
    val allGroups: LiveData<List<Group>> = _allGroups

    private val _homeData = MutableLiveData<HomeData?>()
    val homeData: LiveData<HomeData?> = _homeData

    private val _selectedSchedule = MutableLiveData<Schedule?>()
    val selectedSchedule: LiveData<Schedule?> = _selectedSchedule

    private val _rotationButtonState = MutableLiveData<RotationButtonState>()
    val rotationButtonState: LiveData<RotationButtonState> = _rotationButtonState

    private val _playerStats = MutableLiveData<List<PlayerStat>?>()
    val playerStats: LiveData<List<PlayerStat>?> = _playerStats

    private val _scheduleStats = MutableLiveData<List<ScheduleStat>?>()
    val scheduleStats: LiveData<List<ScheduleStat>?> = _scheduleStats

    private val _forceLogout = MutableLiveData<Event<Unit>>()
    val forceLogout: LiveData<Event<Unit>> = _forceLogout

    private val _joinGroupStatus = MutableLiveData<Event<String>>()
    val joinGroupStatus: LiveData<Event<String>> = _joinGroupStatus

    private val _acceptInvitationStatus = MutableLiveData<Event<String>>()
    val acceptInvitationStatus: LiveData<Event<String>> = _acceptInvitationStatus

    private val _scheduleSignups = MutableLiveData<List<ScheduleSignup>>()
    val scheduleSignups: LiveData<List<ScheduleSignup>> = _scheduleSignups

    private val _deleteAccountStatus = MutableLiveData<Event<Boolean>>()
    val deleteAccountStatus: LiveData<Event<Boolean>> = _deleteAccountStatus

    private val _contactSupportStatus = MutableLiveData<Event<Boolean>>()
    val contactSupportStatus: LiveData<Event<Boolean>> = _contactSupportStatus

    companion object {
    private const val SELECTED_GROUP_ID_KEY = "selected_group_id"
        val Factory: ViewModelProvider.Factory = object : ViewModelProvider.Factory {
            @Suppress("UNCHECKED_CAST")
            override fun <T : ViewModel> create(
                modelClass: Class<T>,
                extras: CreationExtras
            ): T {
                // Get the SavedStateHandle from the CreationExtras
                val savedStateHandle = extras.createSavedStateHandle()
                return HomeViewModel(savedStateHandle) as T
            }
        }
    }

    fun submitSupportRequest(token: String, groupId: String?, message: String, loadingViewModel: LoadingViewModel) {
        loadingViewModel.showLoading()
        viewModelScope.launch {
            try {
                val request = SubmitSupportRequest(groupId, message)
                val response = RetrofitClient.instance.supportContact(token, request)
                _contactSupportStatus.postValue(Event(response.isSuccessful))
            } catch (e: Exception) {
                Log.e("HomeViewModel", "Failed to submit support contact", e)
            } finally {
                loadingViewModel.hideLoading()
            }
        }
    }

    fun deleteAccount(token: String, loadingViewModel: LoadingViewModel) {
        loadingViewModel.showLoading()
        viewModelScope.launch {
            try {
                val response = RetrofitClient.instance.deleteSelf(token)
                _deleteAccountStatus.postValue(Event(response.isSuccessful))
            } catch (e: Exception) {
                _deleteAccountStatus.postValue(Event(false))
            } finally {
                loadingViewModel.hideLoading()
            }
        }
    }

    fun onScheduleSelected(schedule: Schedule, token: String, loadingViewModel: LoadingViewModel) {
        _selectedSchedule.value = schedule
        fetchRotationButtonState(token, schedule.id, loadingViewModel)
    }

    fun onScheduleDeselected() {
        _selectedSchedule.value = null
    }

    fun fetchInitialGroups(token: String, loadingViewModel: LoadingViewModel) {
        viewModelScope.launch {
            loadingViewModel.showLoading()
            try {
                val groups = RetrofitClient.instance.getGroups(token)
                _allGroups.value = groups
                val savedGroupId = savedStateHandle.get<String>(SELECTED_GROUP_ID_KEY)
                val groupToLoad = groups.find { it.id == savedGroupId } ?: groups.firstOrNull()
                groupToLoad?.let {
                    loadDataForGroup(token, it, loadingViewModel)
                }
            } catch (e: Exception) {
                if (e is HttpException && e.code() == 401) {
                    _forceLogout.value = Event(Unit)
                } else {
                    Log.e("HomeViewModel", "Failed to fetch groups", e)
                }
            } finally {
                loadingViewModel.hideLoading()
            }
        }
    }

    fun loadDataForGroup(token: String, group: Group, loadingViewModel: LoadingViewModel) {
        viewModelScope.launch {
            loadingViewModel.showLoading()
            try {
                val schedules: List<Schedule>
                val players: List<Player>
                val courts: List<Court>

                coroutineScope {
                    val schedulesDeferred = async { RetrofitClient.instance.getSchedules(token, group.id) }
                    val playersDeferred = async { RetrofitClient.instance.getPlayers(token, group.id) }
                    val courtsDeferred = async { RetrofitClient.instance.getCourts(token, group.id) }

                    schedules = schedulesDeferred.await()
                    players = playersDeferred.await()
                    courts = courtsDeferred.await()
                }

                _homeData.value = HomeData(group, schedules, players, courts)
                savedStateHandle[SELECTED_GROUP_ID_KEY] = group.id
                _selectedSchedule.value?.let {
                    val updatedSchedule = schedules.find { s -> s.id == it.id }
                    _selectedSchedule.value = updatedSchedule
                }
            } catch (e: Exception) {
                if (e is HttpException && e.code() == 401) {
                    _forceLogout.value = Event(Unit)
                } else {
                    Log.e("HomeViewModel", "Failed to load data for group ${group.name}", e)
                }
            } finally {
                loadingViewModel.hideLoading()
            }
        }
    }

    fun refreshHomeData(token: String, loadingViewModel: LoadingViewModel) {
        viewModelScope.launch {
            _homeData.value?.selectedGroup?.let { group ->
                try {
                    val updatedGroups = RetrofitClient.instance.getGroups(token)
                    _allGroups.value = updatedGroups

                    val groupToRefresh = updatedGroups.find { it.id == group.id } ?: updatedGroups.firstOrNull()

                    if (groupToRefresh != null) {
                        val schedules: List<Schedule>
                        val players: List<Player>
                        val courts: List<Court>

                        coroutineScope {
                            val schedulesDeferred = async { RetrofitClient.instance.getSchedules(token, groupToRefresh.id) }
                            val playersDeferred = async { RetrofitClient.instance.getPlayers(token, groupToRefresh.id) }
                            val courtsDeferred = async { RetrofitClient.instance.getCourts(token, groupToRefresh.id) }

                            schedules = schedulesDeferred.await()
                            players = playersDeferred.await()
                            courts = courtsDeferred.await()
                        }

                        _homeData.value = HomeData(groupToRefresh, schedules, players, courts)
                        savedStateHandle[SELECTED_GROUP_ID_KEY] = groupToRefresh.id
                        _selectedSchedule.value?.let {
                            val updatedSchedule = schedules.find { s -> s.id == it.id }
                            _selectedSchedule.value = updatedSchedule
                        }
                    } else {
                        _allGroups.value = emptyList()
                        _homeData.value = null
                    }
                } catch (e: Exception) {
                    if (e is HttpException && e.code() == 401) {
                        _forceLogout.value = Event(Unit)
                    } else {
                        Log.e("HomeViewModel", "Failed to refresh data for group ${group.name}", e)
                    }
                }
            }
        }
    }

    fun fetchPlayerStats(token: String, playerId: String, loadingViewModel: LoadingViewModel) {
        viewModelScope.launch {
            loadingViewModel.showLoading()
            try {
                _playerStats.value = RetrofitClient.instance.getPlayerStats(token, playerId)
            } catch (e: Exception) {
                if (e is HttpException && e.code() == 401) {
                    _forceLogout.value = Event(Unit)
                } else {
                    Log.e("HomeViewModel", "Failed to fetch player stats", e)
                }
            } finally {
                loadingViewModel.hideLoading()
            }
        }
    }

    fun fetchScheduleStats(token: String, scheduleId: String, loadingViewModel: LoadingViewModel) {
        viewModelScope.launch {
            loadingViewModel.showLoading()
            try {
                _scheduleStats.value = RetrofitClient.instance.getScheduleStats(token, scheduleId)
            } catch (e: Exception) {
                if (e is HttpException && e.code() == 401) {
                    _forceLogout.value = Event(Unit)
                } else {
                    Log.e("HomeViewModel", "Failed to fetch schedule stats", e)
                }
            } finally {
                loadingViewModel.hideLoading()
            }
        }
    }

    fun createGroup(token: String, groupName: String, loadingViewModel: LoadingViewModel) {
        viewModelScope.launch {
            loadingViewModel.showLoading()
            try {
                RetrofitClient.instance.createGroup(token, CreateGroupRequest(name = groupName))
                fetchInitialGroups(token, loadingViewModel)
            } catch (e: Exception) {
                if (e is HttpException && e.code() == 401) {
                    _forceLogout.value = Event(Unit)
                } else {
                    Log.e("HomeViewModel", "Failed to create group", e)
                }
                loadingViewModel.hideLoading()
            }
        }
    }

    fun updateGroup(token: String, groupId: String, newName: String, loadingViewModel: LoadingViewModel) {
        viewModelScope.launch {
            loadingViewModel.showLoading()
            try {
                RetrofitClient.instance.updateGroup(token, groupId, UpdateGroupRequest(name = newName))
                fetchInitialGroups(token, loadingViewModel)
            } catch (e: Exception) {
                if (e is HttpException && e.code() == 401) {
                    _forceLogout.value = Event(Unit)
                } else {
                    Log.e("HomeViewModel", "Failed to update group", e)
                }
                loadingViewModel.hideLoading()
            }
        }
    }

    fun updateGroupAdmins(token: String, groupId: String, adminUserIds: List<String>, loadingViewModel: LoadingViewModel) {
        viewModelScope.launch {
            loadingViewModel.showLoading()
            try {
                RetrofitClient.instance.updateGroupAdmins(token, groupId, UpdateGroupAdminsRequest(adminUserIds = adminUserIds))
                fetchInitialGroups(token, loadingViewModel)
            } catch (e: Exception) {
                if (e is HttpException && e.code() == 401) {
                    _forceLogout.value = Event(Unit)
                } else {
                    Log.e("HomeViewModel", "Failed to update group admins", e)
                }
                loadingViewModel.hideLoading() // Only hide loading on error, success will be handled by the calling function's refresh
            } finally {
                loadingViewModel.hideLoading()
            }
        }
    }

    fun deleteGroup(token: String, groupId: String, loadingViewModel: LoadingViewModel) {
        viewModelScope.launch {
            loadingViewModel.showLoading()
            try {
                RetrofitClient.instance.deleteGroup(token, groupId)
                fetchInitialGroups(token, loadingViewModel)
            } catch (e: Exception) {
                if (e is HttpException && e.code() == 401) {
                    _forceLogout.value = Event(Unit)
                } else {
                    Log.e("HomeViewModel", "Failed to delete group", e)
                }
                loadingViewModel.hideLoading()
            }
        }
    }

    fun createCourt(token: String, courtName: String, groupId: String, loadingViewModel: LoadingViewModel) {
        viewModelScope.launch {
            loadingViewModel.showLoading()
            try {
                RetrofitClient.instance.createCourt(token, CreateCourtRequest(name = courtName, groupId = groupId))
                _homeData.value?.selectedGroup?.let { loadDataForGroup(token, it, loadingViewModel) }
            } catch (e: Exception) {
                if (e is HttpException && e.code() == 401) {
                    _forceLogout.value = Event(Unit)
                } else {
                    Log.e("HomeViewModel", "Failed to create court", e)
                }
                loadingViewModel.hideLoading()
            }
        }
    }

    fun updateCourt(token: String, courtId: String, newName: String, groupId: String, loadingViewModel: LoadingViewModel) {
        viewModelScope.launch {
            loadingViewModel.showLoading()
            try {
                RetrofitClient.instance.updateCourt(token, courtId, UpdateCourtRequest(name = newName, groupId = groupId))
                _homeData.value?.selectedGroup?.let { loadDataForGroup(token, it, loadingViewModel) }
            } catch (e: Exception) {
                if (e is HttpException && e.code() == 401) {
                    _forceLogout.value = Event(Unit)
                } else {
                    Log.e("HomeViewModel", "Failed to update court", e)
                }
                loadingViewModel.hideLoading()
            }
        }
    }

    fun deleteCourt(token: String, courtId: String, loadingViewModel: LoadingViewModel) {
        viewModelScope.launch {
            loadingViewModel.showLoading()
            try {
                RetrofitClient.instance.deleteCourt(token, courtId)
                _homeData.value?.selectedGroup?.let { loadDataForGroup(token, it, loadingViewModel) }
            } catch (e: Exception) {
                if (e is HttpException && e.code() == 401) {
                    _forceLogout.value = Event(Unit)
                } else {
                    Log.e("HomeViewModel", "Failed to delete court", e)
                }
                loadingViewModel.hideLoading()
            }
        }
    }

    fun createSchedule(token: String, request: CreateScheduleRequest, loadingViewModel: LoadingViewModel) {
        viewModelScope.launch {
            loadingViewModel.showLoading()
            try {
                RetrofitClient.instance.createSchedule(token, request)
                _homeData.value?.selectedGroup?.let { loadDataForGroup(token, it, loadingViewModel) }
            } catch (e: Exception) {
                if (e is HttpException && e.code() == 401) {
                    _forceLogout.value = Event(Unit)
                } else {
                    Log.e("HomeViewModel", "Failed to create schedule", e)
                }
                loadingViewModel.hideLoading()
            }
        }
    }

    fun updateSchedule(token: String, scheduleId: String, request: UpdateScheduleRequest, loadingViewModel: LoadingViewModel) {
        viewModelScope.launch {
            loadingViewModel.showLoading()
            try {
                RetrofitClient.instance.updateSchedule(token, scheduleId, request)
                _homeData.value?.selectedGroup?.let { loadDataForGroup(token, it, loadingViewModel) }
            } catch (e: Exception) {
                if (e is HttpException && e.code() == 401) {
                    _forceLogout.value = Event(Unit)
                } else {
                    Log.e("HomeViewModel", "Failed to update schedule", e)
                }
                loadingViewModel.hideLoading()
            }
        }
    }

    fun deleteSchedule(token: String, scheduleId: String, loadingViewModel: LoadingViewModel) {
        viewModelScope.launch {
            loadingViewModel.showLoading()
            try {
                RetrofitClient.instance.deleteSchedule(token, scheduleId)
                _homeData.value?.selectedGroup?.let { loadDataForGroup(token, it, loadingViewModel) }
            } catch (e: Exception) {
                if (e is HttpException && e.code() == 401) {
                    _forceLogout.value = Event(Unit)
                } else {
                    Log.e("HomeViewModel", "Failed to delete schedule", e)
                }
                loadingViewModel.hideLoading()
            }
        }
    }

    fun invitePlayer(token: String, groupId: String, email: String, loadingViewModel: LoadingViewModel) {
        viewModelScope.launch {
            loadingViewModel.showLoading()
            try {
                RetrofitClient.instance.invitePlayer(token, groupId, InvitePlayerRequest(email = email))
            } catch (e: Exception) {
                if (e is HttpException && e.code() == 401) {
                    _forceLogout.value = Event(Unit)
                } else {
                    Log.e("HomeViewModel", "Failed to send invitation", e)
                }
            } finally {
                loadingViewModel.hideLoading()
            }
        }
    }

    fun updatePlayer(token: String, playerId: String, newName: String, newAvailability: List<PlayerAvailability>, loadingViewModel: LoadingViewModel) {
        viewModelScope.launch {
            loadingViewModel.showLoading()
            try {
                RetrofitClient.instance.updatePlayer(token, playerId, UpdatePlayerRequest(name = newName, availability = newAvailability))
                _homeData.value?.selectedGroup?.let { loadDataForGroup(token, it, loadingViewModel) }
            } catch (e: Exception) {
                if (e is HttpException && e.code() == 401) {
                    _forceLogout.value = Event(Unit)
                } else {
                    Log.e("HomeViewModel", "Failed to update player", e)
                }
                loadingViewModel.hideLoading()
            }
        }
    }

    fun deletePlayer(token: String, playerId: String, loadingViewModel: LoadingViewModel) {
        viewModelScope.launch {
            loadingViewModel.showLoading()
            try {
                RetrofitClient.instance.deletePlayer(token, playerId)
                _homeData.value?.selectedGroup?.let { loadDataForGroup(token, it, loadingViewModel) }
            } catch (e: Exception) {
                if (e is HttpException && e.code() == 401) {
                    _forceLogout.value = Event(Unit)
                } else {
                    Log.e("HomeViewModel", "Failed to delete player", e)
                }
                loadingViewModel.hideLoading()
            }
        }
    }

    fun fetchRotationButtonState(token: String, scheduleId: String, loadingViewModel: LoadingViewModel) {
        viewModelScope.launch {
            loadingViewModel.showLoading()
            try {
                val state = RetrofitClient.instance.getRotationButtonState(token, scheduleId)
                _rotationButtonState.value = state
            } catch (e: Exception) {
                if (e is HttpException && e.code() == 401) {
                    _forceLogout.value = Event(Unit)
                } else {
                    Log.e("HomeViewModel", "Failed to fetch rotation button state", e)
                }
            } finally {
                loadingViewModel.hideLoading()
            }
        }
    }

    fun generateRotation(token: String, scheduleId: String, loadingViewModel: LoadingViewModel) {
        viewModelScope.launch {
            loadingViewModel.showLoading()
            try {
                RetrofitClient.instance.generateRotation(token, scheduleId)
                _homeData.value?.selectedGroup?.let { group ->
                    loadDataForGroup(token, group, loadingViewModel)
                    fetchRotationButtonState(token, scheduleId, loadingViewModel)
                }
            } catch (e: Exception) {
                if (e is HttpException && e.code() == 401) {
                    _forceLogout.value = Event(Unit)
                } else {
                    Log.e("HomeViewModel", "Failed to generate rotation", e)
                }
                loadingViewModel.hideLoading()
            }
        }
    }

    fun swapPlayer(token: String, scheduleId: String, playerInId: String, playerOutId: String, loadingViewModel: LoadingViewModel) {
        viewModelScope.launch {
            loadingViewModel.showLoading()
            try {
                val request = SwapPlayerRequest(playerInId = playerInId, playerOutId = playerOutId)
                RetrofitClient.instance.swapPlayers(token, scheduleId, request)
                _homeData.value?.selectedGroup?.let { loadDataForGroup(token, it, loadingViewModel) }
            } catch (e: Exception) {
                if (e is HttpException && e.code() == 401) {
                    _forceLogout.value = Event(Unit)
                } else {
                    Log.e("HomeViewModel", "Failed to swap player", e)
                }
                loadingViewModel.hideLoading()
            }
        }
    }

    fun joinGroup(token: String, groupId: String, loadingViewModel: LoadingViewModel) {
        viewModelScope.launch {
            loadingViewModel.showLoading()
            try {
                val response = RetrofitClient.instance.joinGroup(token, groupId)
                _joinGroupStatus.value =
                    Event(response.message) // Assuming a simple response with a message
                fetchInitialGroups(token, loadingViewModel) // Refresh data
            } catch (e: Exception) {
                val errorMessage = if (e is HttpException) e.response()?.errorBody()?.string()
                    ?: "Failed to join group" else e.message ?: "An unknown error occurred"
                _joinGroupStatus.value = Event(errorMessage)
                loadingViewModel.hideLoading()
            }
            // loading is hidden in fetchInitialGroups on success
        }
    }

    fun acceptInvitation(token: String, joinToken: String, loadingViewModel: LoadingViewModel) {
        viewModelScope.launch {
            loadingViewModel.showLoading()
            try {
                RetrofitClient.instance.acceptInvitation(token, joinToken)
                _acceptInvitationStatus.value = Event("Invitation accepted successfully!")
                fetchInitialGroups(token, loadingViewModel) // Refresh data
            } catch (e: Exception) {
                val errorMessage = if (e is HttpException) e.response()?.errorBody()?.string()
                    ?: "Failed to accept invitation" else e.message ?: "An unknown error occurred"
                _acceptInvitationStatus.value = Event(errorMessage)
                if (e is HttpException && e.code() == 401) {
                    _forceLogout.value = Event(Unit)
                }
                loadingViewModel.hideLoading()
            }
        }
    }

    fun getScheduleSignups(token: String, scheduleId: String, loadingViewModel: LoadingViewModel) {
        viewModelScope.launch {
            loadingViewModel.showLoading()
            try {
                _scheduleSignups.value = RetrofitClient.instance.getScheduleSignups(token, scheduleId)
            } catch (e: Exception) {
                if (e is HttpException && e.code() == 401) {
                    _forceLogout.value = Event(Unit)
                } else {
                    Log.e("HomeViewModel", "Failed to fetch schedule signups", e)
                }
            } finally {
                loadingViewModel.hideLoading()
            }
        }
    }

    fun completeSchedulePlanning(token: String, scheduleId: String, loadingViewModel: LoadingViewModel) {
        viewModelScope.launch {
            loadingViewModel.showLoading()
            try {
                RetrofitClient.instance.completeSchedulePlanning(token, scheduleId)
                _homeData.value?.selectedGroup?.let { loadDataForGroup(token, it, loadingViewModel) }
            } catch (e: Exception) {
                if (e is HttpException && e.code() == 401) {
                    _forceLogout.value = Event(Unit)
                } else {
                    Log.e("HomeViewModel", "Failed to complete schedule planning", e)
                }
                loadingViewModel.hideLoading()
            }
        }
    }
}
