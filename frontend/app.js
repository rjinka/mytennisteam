import { renderGroupsList, renderSchedulesList, renderCourtsList, renderAllPlayers, showScheduleDetails, showMessageBox, showLoading } from './ui.js';
import { showGroupSelectionModal, hideEditScheduleModal } from './modals.js';
import { setupGlobalEventListeners } from './events.js';
import * as api from './api.js';
import { generateRotationForSchedule } from './rotation.js';

export let groups = {};
export let playerGroups = {};
export let schedules = {};
export let players = {};
export let courts = {};

export const selection = {
    currentGroupId: null,
    selectedSchedule: null,
};

export const ui = {
    playerBeingSwapped: null,
    courtBeingEdited: null,
    scheduleBeingEdited: null,
    swapActionDirection: '',
    playerBeingEdited: null,
    groupBeingEdited: null,
};

export function isCurrentUserAdminOfSelectedGroup() {
    if (!selection.currentGroupId) return false;
    const token = localStorage.getItem('token');
    if (token) {
        const user = parseJwt(token);
        if (user.isSuperAdmin) return true;
    }
    return !!groups[selection.currentGroupId]; // Is a regular admin of the selected group
}

export async function reloadData() {
    showLoading(true);
    try {
        // Fetch all data from their respective endpoints
        // We only fetch groups initially. Other data is loaded when a group is selected.
        const [adminGroupsData, playerGroupsData] = await Promise.all([
            api.getAdminGroups(),
            api.getPlayerGroups()
        ]);
        handleDataUpdate({ groups: adminGroupsData, playerGroups: playerGroupsData }, false);
    } catch (error) {
        console.error("Failed to reload data:", error);
        if (error.status === 401) {
            logout(); // If unauthorized, log out immediately.
        } else {
            showMessageBox("Error", "Could not refresh data from the server.");
        }
        throw error; // Re-throw to stop further execution in initializeApp.
    } finally {
        showLoading(false);
    }
}

export function handleDataUpdate(apiData, isInitialLoad = false) {
    if (apiData) {
        // Keep admin groups and player groups separate.
        // `groups` is used for the admin tab, `playerGroups` is for selection by non-admins.
        groups = (apiData.groups || []).reduce((acc, group) => ({ ...acc, [group.id]: group }), {});
        playerGroups = (apiData.playerGroups || []).reduce((acc, group) => ({ ...acc, [group.id]: group }), {});

        if (isInitialLoad) {
            showGroupSelectionModal();
        } else {
            refreshDataForCurrentGroup();
        }
    }
}

export async function setCurrentGroup(groupId, isInitialLoad = false) {
    selection.currentGroupId = groupId;

    // Find and display the group name
    // The selected group could be an admin group or a player group. Check both.
    const group = groups[groupId] || playerGroups[groupId];
    document.getElementById('currentGroupNameDisplay').textContent = group ? group.name : '';

    document.getElementById('schedulesList').innerHTML = '';
    document.getElementById('playingPlayersContainer').innerHTML = '<p class="col-span-full text-center text-gray-500">No schedule selected.</p>';
    document.getElementById('benchPlayersContainer').innerHTML = '';
    document.getElementById('allPlayersGrid').innerHTML = '';
    document.getElementById('courtsList').innerHTML = '';
    document.getElementById('schedule-actions-container')?.remove();
    const scheduleDetailsContainer = document.getElementById('scheduleDetailsContainer');
    scheduleDetailsContainer.classList.add('hidden');
    scheduleDetailsContainer.classList.remove('flex', 'flex-col');
    selection.selectedSchedule = null;
    
    // Fetch data specific to the selected group
    if (groupId) {
        const [schedulesData, playersData, courtsData] = await Promise.all([
            api.getSchedules(groupId),
            api.getPlayers(groupId),
            api.getCourts(groupId)
        ]);
        schedules = (schedulesData || []).reduce((acc, schedule) => ({ ...acc, [schedule.id]: schedule }), {});
        players = (playersData || []).reduce((acc, player) => ({ ...acc, [player.id]: player }), {});
        courts = (courtsData || []).reduce((acc, court) => ({ ...acc, [court.id]: court }), {});
    } else {
        schedules = {};
        players = {};
        courts = {};
    }

    // Re-render all components with the new group-specific data
    renderGroupsList();
    renderSchedulesList();
    renderCourtsList();
    renderAllPlayers();

    if (group && !isInitialLoad) { // Only proceed if a valid group is selected
        const groupSchedules = Object.values(schedules).filter(s => s.groupid === group.id);
        if (groupSchedules.length > 0) {
            showScheduleDetails(groupSchedules[0]);
        }
    }

    showLoading(false);
}

async function refreshDataForCurrentGroup() {
    if (!selection.currentGroupId) return;
    const selectedScheduleId = selection.selectedSchedule ? selection.selectedSchedule.id : null;
    await setCurrentGroup(selection.currentGroupId, true);
    if (selectedScheduleId) {
        const reselectedSchedule = Object.values(schedules).find(s => s.id === selectedScheduleId);
        if (reselectedSchedule) {
            showScheduleDetails(reselectedSchedule);
        }
    }
}

export async function loadSchedulesForGroup() {
    const allSchedules = await api.getSchedules(selection.currentGroupId);
    const groupSchedules = allSchedules.filter(s => s.groupid === selection.currentGroupId) || [];
    schedules = groupSchedules.reduce((acc, schedule) => {
        acc[schedule.id] = schedule; // Assuming schedule has a unique '_id'
        return acc;
    }, {});
    renderSchedulesList();
    const scheduleArray = Object.values(schedules);
    if (scheduleArray.length > 0) {
        showScheduleDetails(scheduleArray[0]);
    }
}

export async function loadCourtsForGroup() {
    try {
        const allCourts = await api.getCourts(selection.currentGroupId);
        const groupCourts = allCourts.filter(c => c.groupid === selection.currentGroupId) || [];
        courts = groupCourts.reduce((acc, court) => {
            acc[court.id] = court; // Assuming court has a unique '_id'
            return acc;
        }, {});
        renderCourtsList();
    } catch (error) {
        console.error('Error loading courts:', error);
    }
}

// CRUD Operations
export async function createNewGroup() {
    const newGroupNameInput = document.getElementById('newGroupNameInput');
    const groupName = newGroupNameInput.value.trim();
    if (!groupName) {
        showMessageBox('Error', 'Please enter a group name.');
        return;
    }

    showLoading(true);
    try {
        const newGroup = await api.createGroup({ name: groupName });
        await reloadData(); // Reload all data to get the new group
        
        // Explicitly re-render the group list in the admin tab
        renderGroupsList();

        await setCurrentGroup(newGroup.id);
        document.body.classList.remove('modal-open');

        await refreshDataForCurrentGroup();
        document.getElementById('createGroupModalOverlay').classList.remove('show');
        showMessageBox('Success', `Group "${newGroup.name}" created.`);
    } catch (error) {
        console.error('Error creating group:', error);
        if (error.status === 401) {
            logout();
        } else {
            showMessageBox('Error', 'Failed to create new group.');
        }
    } finally {
        showLoading(false);
    }
}

export async function createNewCourt() {
    const newCourtNameInput = document.getElementById('newCourtNameInput');
    const courtName = newCourtNameInput.value.trim();
    if (!courtName) {
        showMessageBox('Error', 'Please enter a court name.');
        return;
    }
    const newCourt = { name: courtName, groupid: selection.currentGroupId };
    showLoading(true);
    try {
        await api.createCourt(newCourt);
        await loadCourtsForGroup();
        document.body.classList.remove('modal-open');
        document.getElementById('newCourtNameInput').value = '';
        document.getElementById('createCourtModalOverlay').classList.remove('show');
    } catch (error) {
        console.error('Error creating court:', error);
        if (error.status === 401) {
            logout();
        } else {
            showMessageBox('Error', 'Failed to create court.');
        }
    } finally {
        showLoading(false);
    }
}

export async function createNewSchedule() {
    const nameInput = document.getElementById('createScheduleNameInput');
    const name = nameInput.value.trim();
    if (!name) {
        showMessageBox('Input Required', 'Please enter a schedule name.');
        return;
    }
    const day = document.getElementById('createScheduleDayInput').value;
    const time = document.getElementById('createScheduleTimeInput').value;
    const duration = parseInt(document.getElementById('createScheduleDurationInput').value);
    const recurring = document.getElementById('createScheduleIsRecurringSelect').checked;
    const frequency = document.getElementById('createScheduleFrequencySelect').value;
    const courtsDiv = document.getElementById('createScheduleCourtsInput');
    
    const selectedCourts = Array.from(courtsDiv.querySelectorAll('input[type="checkbox"]:checked')).map(cb => {
        const gameTypeSelect = cb.closest('div').querySelector('.court-gametype-select');
        return {
            courtId: cb.value,
            gameType: gameTypeSelect.value
        };
    });

    let recurrenceCount = 0;
    if (recurring && frequency > 0) {
        recurrenceCount = parseInt(document.getElementById('createScheduleRecurrenceCountInput').value);
    }

    const maxPlayersCount = selectedCourts.reduce((sum, court) => {
        return sum + (court.gameType === '0' ? 2 : 4);
    }, 0);
    const newSchedule = { name, groupid: selection.currentGroupId, courts: selectedCourts, day, time, duration, recurring, frequency, recurrenceCount, maxPlayersCount, week: 1, lastGeneratedWeek: 0, isRotationGenerated: false, playingPlayersIds: [], benchPlayersIds: [] };

    showLoading(true);
    try {
        await api.createSchedule(newSchedule);
        await reloadData(); // Reload all data to get the new schedule
        await refreshDataForCurrentGroup();
        document.body.classList.remove('modal-open');
        document.getElementById('createScheduleModalOverlay').classList.remove('show');
    } catch (error) {
        console.error('Error creating schedule:', error);
        if (error.status === 401) {
            logout();
        } else {
            showMessageBox('Error', 'Failed to create new schedule.');
        }
    } finally {
        showLoading(false);
    }
}

export async function saveScheduleChanges() {
    const { scheduleBeingEdited } = ui;
    if (!scheduleBeingEdited) return;
    
    // Store old values BEFORE they are updated from the form
    const oldCourts = [...(scheduleBeingEdited.courts || [])];
    const oldRecurrenceCount = scheduleBeingEdited.recurrenceCount;

    const nameInput = document.getElementById('editScheduleNameInput');
    const name = nameInput.value.trim();
    if (!name) {
        showMessageBox('Input Required', 'Please enter a schedule name.');
        return;
    }
    ui.scheduleBeingEdited.name = name;
    scheduleBeingEdited.day = document.getElementById('editScheduleDayInput').value;
    scheduleBeingEdited.time = document.getElementById('editScheduleTimeInput').value;
    scheduleBeingEdited.duration = parseInt(document.getElementById('editScheduleDurationInput').value);
    scheduleBeingEdited.recurring = document.getElementById('editIsRecurring').checked;

    const courtsDiv = document.getElementById('editScheduleCourtsInput');
    scheduleBeingEdited.courts = Array.from(courtsDiv.querySelectorAll('input[type="checkbox"]:checked')).map(cb => {
        const gameTypeSelect = cb.closest('div').querySelector('.court-gametype-select');
        return {
            courtId: cb.value,
            gameType: gameTypeSelect.value
        };
    });

    if (scheduleBeingEdited.recurring) {
        scheduleBeingEdited.frequency = document.getElementById('editScheduleFrequencySelect').value;
        scheduleBeingEdited.recurrenceCount = parseInt(document.getElementById('editScheduleRecurrenceCountInput').value);
    } else {
        scheduleBeingEdited.frequency = 0;
        scheduleBeingEdited.recurrenceCount = 1;
    }

    // Calculate new maxPlayersCount based on updated courts and gameType
    scheduleBeingEdited.maxPlayersCount = scheduleBeingEdited.courts.reduce((sum, court) => {
        return sum + (court.gameType === '0' ? 2 : 4);
    }, 0);

    // Check if courts or gameType (which affects maxPlayersCount) have changed
    const courtsChanged = JSON.stringify(oldCourts) !== JSON.stringify(scheduleBeingEdited.courts);
    const gameTypeChanged = courtsChanged; // If courts changed, game types might have too.

    // Determine if the schedule is being reactivated (was completed, now extended)
    const isBeingReactivated = scheduleBeingEdited.isCompleted && scheduleBeingEdited.recurring && parseInt(document.getElementById('editScheduleRecurrenceCountInput').value) > oldRecurrenceCount;

    if (courtsChanged || gameTypeChanged || isBeingReactivated) {
        // If courts, game type changed, or schedule is reactivated, we need to re-generate the lineup
        try {
            // Fetch player stats for the schedule before generating the rotation
            // Note: `players` is a global object in app.js
            const playerStats = await Promise.all(Object.values(players).map(p => api.getPlayerStats(p.id, scheduleBeingEdited.id)));
            generateRotationForSchedule(scheduleBeingEdited, playerStats);
            scheduleBeingEdited.isRotationGenerated = false; // Reset this so a new rotation can be generated
        } catch (error) {
            console.error('Error regenerating rotation after schedule change:', error);
            showMessageBox('Error', 'Failed to regenerate player rotation.');
            // Decide if you want to proceed with saving the schedule even if rotation failed
            // For now, we'll let it proceed to save other schedule changes.
        }
    }

    showLoading(true);
    try {
        // We only send the properties that were changed in the modal
        const updatedSchedule = await api.updateSchedule(scheduleBeingEdited.id, scheduleBeingEdited);
        
        // Update local data with the response from the server
        schedules[updatedSchedule.id] = updatedSchedule;
        selection.selectedSchedule = updatedSchedule;

        document.body.classList.remove('modal-open');
        hideEditScheduleModal();

        await refreshDataForCurrentGroup(); // Re-render UI components for the current group
    } catch (error) {
        console.error('Error saving schedule changes:', error);
        if (error.status === 401) {
            logout();
        } else {
            showMessageBox('Error', 'Failed to save schedule changes.');
        }
    } finally {
        showLoading(false);
    }
}

export async function savePlayerChanges() {
    if (!ui.playerBeingEdited) return;

    const newPlayerName = document.getElementById('editPlayerNameInput').value.trim();
    if (newPlayerName === '') {
        showMessageBox("Input Error", "Player name cannot be empty.");
        return;
    }

    const newAvailability = [];
    document.querySelectorAll('#modifyAvailableSchedulesList .schedule-checkbox:checked').forEach(checkbox => {
        const scheduleId = checkbox.value;
        const select = checkbox.closest('label').nextElementSibling;
        newAvailability.push({
            scheduleId: scheduleId,
            type: select.value
        });
    });
    ui.playerBeingEdited.availability = newAvailability;
    let schedulesNeedUpdate = false;

    // The logic for updating schedules based on player availability is now handled on the backend.
    // The frontend only needs to update the player's own document.
    showLoading(true);
    try {

        // Pass the new name along with other player data to the API
        const payload = { ...ui.playerBeingEdited, name: newPlayerName };
        const updatedPlayer = await api.updatePlayer(ui.playerBeingEdited.id, payload);

        // Update local data with the response from the server
        players[updatedPlayer.id] = updatedPlayer;

        // Re-render UI components. We still need to reload all data here because
        // changing a player's schedule can affect other schedules' lineups.
        await reloadData();
    } catch (error) {
        console.error('Error saving player changes:', error);
        if (error.status === 401) {
            logout();
        } else {
            showMessageBox('Error', 'Failed to save player changes.');
        }
    } finally {
        showLoading(false);
    }

    document.body.classList.remove('modal-open');
    document.getElementById('editPlayerModalOverlay').classList.remove('show');
}

export async function deleteGroup(groupId) {
    showLoading(true);
    try {
        await api.deleteGroup(groupId);
        await reloadData();
    } catch (error) {
        console.error('Error deleting group:', error);
        if (error.status === 401) {
            logout();
        } else {
            showMessageBox('Error', 'Failed to delete group.');
        }
    } finally {
        showLoading(false);
    }
}

export function logout() {
    localStorage.removeItem('token');
    window.location.reload();
}

export function parseJwt (token) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
}

async function initializeApp() {
    try {
        // Hide sign-in and show main app
        document.getElementById('signInContainer').style.display = 'none';
        const mainContainer = document.getElementById('mainContainer');
        mainContainer.style.display = ''; // Remove the inline style
        mainContainer.classList.remove('hidden'); // Remove the class

        // Fetch all data first to prevent race conditions
        await reloadData();

        setupGlobalEventListeners();

        // Programmatically click the Groups tab to ensure it's the default view.
        document.getElementById('groupManagementTabBtn').click();

        // After all data is loaded and event listeners are set up,
        // prompt the user to select a group. This ensures the loading overlay is gone.
        showGroupSelectionModal();
    } catch (error) {
        console.error("Initialization failed, token might be invalid:", error);
        // If initialization fails (e.g., token expired), log the user out.
        logout();
    }
}

async function handleInvitationToken(params) {
    const token = params.get('join_token');
    if (token) {
        try {
            // First, ensure user is logged in
            if (!localStorage.getItem('token')) {
                // If not logged in, the normal sign-in flow will happen.
                // After login, this function will be called again.
                return;
            }
            const { msg } = await api.acceptInvitation(token);
            showMessageBox('Success!', msg, reloadData);
            // Clean the token from the URL
            sessionStorage.removeItem('join_token'); // Clean up session storage on success
            window.history.replaceState({}, document.title, window.location.pathname);
        } catch (error) {
            showMessageBox('Error', error.message || 'Could not accept invitation.');
            window.history.replaceState({}, document.title, window.location.pathname);
            sessionStorage.removeItem('join_token'); // Also clear from session storage on failure
        }
    }
}

// On page load, check for an existing token and initialize the app if found.
document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('token');

    // If a join_token is present, store it in sessionStorage before it gets lost in the auth redirect.
    if (urlParams.has('join_token')) {
        sessionStorage.setItem('join_token', urlParams.get('join_token'));
    }

    if (tokenFromUrl) {
        // If a token is found in the URL from the backend redirect, save it.
        localStorage.setItem('token', tokenFromUrl);
        // Clean the token from the URL for a cleaner user experience and to prevent reuse.
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    // After login, check sessionStorage for a pending invitation.
    const pendingJoinToken = sessionStorage.getItem('join_token');
    if (pendingJoinToken) {
        // Pass the token to the handler and clear it from storage.
        urlParams.set('join_token', pendingJoinToken); // Temporarily add it back for the handler
        await handleInvitationToken(urlParams); // Pass the params object to the function
    }

    if (localStorage.getItem('token')) { // Now, check if the user is logged in
        initializeApp();
    }
});
