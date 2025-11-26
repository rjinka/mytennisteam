import { renderGroupsList, renderSchedulesList, renderCourtsList, renderAllPlayers, showScheduleDetails, showMessageBox, showLoading } from './ui.js';
import { showGroupSelectionModal, hideEditScheduleModal } from './modals.js';
import { setupGlobalEventListeners } from './events.js';
import * as api from './api.js';

export let groups = {};
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
    const userString = localStorage.getItem('user');
    if (!userString) return false;
    const user = JSON.parse(userString);

    if (user.isSuperAdmin) return true;
    if (!selection.currentGroupId) return false;

    return groups.filter(g => g.id === selection.currentGroupId && g.admins.includes(user.id)).length > 0;
}

export async function reloadData() {
    showLoading(true);
    try {
        // Fetch all data from their respective endpoints
        // We only fetch groups initially. Other data is loaded when a group is selected.
        const allGroupsData = await api.getPlayerGroups();
        handleDataUpdate({ allGroups: allGroupsData }, false);
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

async function setVersion() {
    try {
        const feVersion = `FE: v${process.env.APP_VERSION}`;
        const beVersion = await api.getVersion().then(res => `BE: v${res.version}`).catch(() => 'BE: unknown');
        document.getElementById('version-display').textContent = `${feVersion} | ${beVersion}`;
    } catch (error) {
        console.error('Failed to set version:', error);
        document.getElementById('version-display').textContent = 'FE: unknown | BE: unknown';
    }
}

export function copyToClipboard(text, successMessage) {
    navigator.clipboard.writeText(text).then(() => {
        showMessageBox('Success', successMessage);
    }).catch(err => {
        console.error('Could not copy text: ', err);
        showMessageBox('Error', 'Failed to copy link.');
    });
}

export function handleDataUpdate(apiData, isInitialLoad = false) {
    if (apiData) {
        groups = apiData.allGroups || [];

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
    const group = groups.find(g => g.id === groupId);
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

    const courtManagementTabBtn = document.getElementById('courtManagementTabBtn');
    const isAdmin = isCurrentUserAdminOfSelectedGroup();
    if (courtManagementTabBtn) {
        courtManagementTabBtn.style.display = isAdmin ? '' : 'none';

        if (!isAdmin && courtManagementTabBtn.classList.contains('active')) {
            document.getElementById('groupManagementTabBtn').click();
        }
    }


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

    renderGroupsList();
    renderSchedulesList();
    renderCourtsList();
    renderAllPlayers();

    if (group && !isInitialLoad) {
        const groupSchedules = Object.values(schedules).filter(s => s.groupId === group.id);
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
    const groupSchedules = allSchedules.filter(s => s.groupId === selection.currentGroupId) || [];
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
        const groupCourts = allCourts.filter(c => c.groupId === selection.currentGroupId) || [];
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
    const newCourt = { name: courtName, groupId: selection.currentGroupId };
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
    // Construct the schedule object with only the necessary fields.
    // Fields like 'occurrenceNumber', 'lastGeneratedOccurrenceNumber', 'isRotationGenerated',
    // 'playingPlayersIds', and 'benchPlayersIds' have defaults set in the backend model,
    // so they don't need to be explicitly sent from the client.
    const newSchedule = {
        name,
        groupId: selection.currentGroupId,
        courts: selectedCourts,
        day,
        time,
        duration,
        recurring,
        frequency,
        recurrenceCount,
        maxPlayersCount
    };

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
    const oldCourts = (scheduleBeingEdited.courts || []).map(c => ({
        courtId: c.courtId,
        gameType: c.gameType
    }));
    const oldRecurrenceCount = scheduleBeingEdited.recurrenceCount;

    const nameInput = document.getElementById('editScheduleNameInput');
    const name = nameInput.value.trim();
    if (!name) {
        showMessageBox('Input Required', 'Please enter a schedule name.');
        return;
    }
    const day = document.getElementById('editScheduleDayInput').value;
    const time = document.getElementById('editScheduleTimeInput').value;
    const duration = parseInt(document.getElementById('editScheduleDurationInput').value);
    const recurring = document.getElementById('editIsRecurring').checked;

    const courtsDiv = document.getElementById('editScheduleCourtsInput');
    const courts = Array.from(courtsDiv.querySelectorAll('input[type="checkbox"]:checked')).map(cb => {
        const gameTypeSelect = cb.closest('div').querySelector('.court-gametype-select');
        return {
            courtId: cb.value,
            gameType: gameTypeSelect.value
        };
    });

    let frequency, recurrenceCount;
    if (recurring) {
        frequency = document.getElementById('editScheduleFrequencySelect').value;
        recurrenceCount = parseInt(document.getElementById('editScheduleRecurrenceCountInput').value);
    } else {
        frequency = 0;
        recurrenceCount = 1;
    }

    // Calculate new maxPlayersCount based on updated courts and gameType
    const maxPlayersCount = courts.reduce((sum, court) => {
        return sum + (court.gameType === '0' ? 2 : 4);
    }, 0);

    // Check if courts or gameType (which affects maxPlayersCount) have changed
    const courtsChanged = JSON.stringify(oldCourts) !== JSON.stringify(scheduleBeingEdited.courts);
    const gameTypeChanged = courtsChanged; // If courts changed, game types might have too.

    // If courts changed, this might affect the lineup. Reset the generated flag.
    let isRotationGenerated = scheduleBeingEdited.isRotationGenerated;
    if (courtsChanged) {
        isRotationGenerated = false;
    }

    const payload = {
        name,
        day,
        time,
        duration,
        recurring,
        courts,
        frequency,
        recurrenceCount,
        maxPlayersCount,
        isRotationGenerated
    };

    showLoading(true);
    try {
        const updatedSchedule = await api.updateSchedule(scheduleBeingEdited.id, payload);

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
    // Call the backend endpoint to clear the httpOnly cookie
    api.logout().then(() => {
        localStorage.clear();
        window.location.href = '/?logged_out=true'; // Redirect with a flag to prevent auto-login
    }).catch(err => {
        console.error('Logout failed:', err);
        // As a fallback, clear local state and redirect
        localStorage.clear();

        // Redirect with a flag to prevent auto-login
        Window.location.href = '/?logged_out=true'; // Redirect with a flag to prevent auto-login
    });
}

export function requestAccountDeletion() {
    if (Object.keys(groups).length > 0) {
        showMessageBox(
            'Deletion Not Allowed',
            'You cannot delete your account while you are a member or an administrator of any groups. Please leave all groups and/or transfer admin rights before deleting your account.'
        );
        return;
    }

    showMessageBox(
        'Confirm Account Deletion',
        'Are you sure you want to permanently delete your account? This action cannot be undone.',
        async () => {
            showLoading(true);
            try {
                await api.deleteSelf();
                showMessageBox('Account Deleted', 'Your account has been successfully deleted.', logout);
            } catch (error) {
                showMessageBox('Error', error.message || 'Failed to delete account.');
            } finally {
                showLoading(false);
            }
        });
}

export async function submitSupportRequest() {
    const messageTextarea = document.getElementById('supportMessageTextarea');
    const message = messageTextarea.value.trim();

    if (!message) {
        showMessageBox('Input Required', 'Please describe your issue before submitting.');
        return;
    }

    showLoading(true);
    const payload = { message };
    if (selection.currentGroupId) {
        payload.groupId = selection.currentGroupId;
    }

    try {
        const response = await api.submitSupport(payload);
        showMessageBox('Success', response.msg || 'Your support request has been sent.');
        document.getElementById('contactSupportModalOverlay').classList.remove('show');
        document.body.classList.remove('modal-open');
        messageTextarea.value = ''; // Clear the textarea
    } catch (error) {
        showMessageBox('Error', error.message || 'Failed to send support request.');
    } finally {
        showLoading(false);
    }
}


async function checkLoginStatus() {
    try {
        // This endpoint relies on the httpOnly cookie being sent automatically.
        // If it succeeds, the user is logged in. The backend returns user data.
        const user = await api.getSelf(); // A new API endpoint to get the current user
        localStorage.setItem('user', JSON.stringify(user)); // Store non-sensitive user data for UI
        return user;
    } catch (error) {
        // A 401/403 error from this endpoint means the user is not logged in.
        console.log('User not authenticated.');
        localStorage.removeItem('user');
        return null;
    }
}

async function initializeApp() {
    try {
        await setVersion();
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
        // If initialization fails, show the sign-in page.
        document.getElementById('signInContainer').style.display = 'flex';
        logout();
    }
}

async function handleInvitationToken(params) {
    const join_token = params.get('join_token');
    if (join_token) {
        // The check for login status now happens at the start of the app.
        // If the user is not logged in, they will be prompted to sign in,
        // and this logic will re-run after they are redirected back.
        try {
            const { msg } = await api.acceptInvitation(join_token);
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

async function handleGroupJoinToken(params) {
    const groupId = params.get('groupId');
    if (groupId) {
        try {
            const { msg } = await api.joinGroup(groupId);
            showMessageBox('Group Joined', msg, reloadData);
            // Clean the token from sessionStorage and URL
            sessionStorage.removeItem('groupId');
            window.history.replaceState({}, document.title, window.location.pathname);
        } catch (error) {
            showMessageBox('Error', error.message || 'Could not join group.');
            sessionStorage.removeItem('groupId');
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }
}

// On page load, check for an existing token and initialize the app if found.
document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const join_token = urlParams.get('join_token');
    const groupId = urlParams.get('groupId');
    const justLoggedOut = urlParams.get('logged_out');

    if (justLoggedOut) {
        // If the user just logged out, don't try to check their login status.
        // Just show the sign-in page.
        document.getElementById('signInContainer').style.display = 'flex';
        return; // Stop further execution
    }

    // Instead of checking for a token in localStorage, we check the login status via an API call.
    // The browser will automatically send the httpOnly cookie.
    const user = await checkLoginStatus();

    if (user) {
        // User is logged in, initialize the app.
        initializeApp();

        // Now that the user is logged in, process any pending tokens from sessionStorage or the current URL.
        const pendingJoinToken = sessionStorage.getItem('join_token') || join_token;
        if (pendingJoinToken) {
            urlParams.set('join_token', pendingJoinToken);
            await handleInvitationToken(urlParams);
        }

        const pendingGroupId = sessionStorage.getItem('groupId') || groupId;
        if (pendingGroupId) {
            urlParams.set('groupId', pendingGroupId);
            await handleGroupJoinToken(urlParams);
        }
    } else {
        // User is not logged in. Store tokens in sessionStorage if they exist, so they persist after the login redirect.
        if (join_token) sessionStorage.setItem('join_token', join_token);
        if (groupId) sessionStorage.setItem('groupId', groupId);

        // Show the sign-in page.
        document.getElementById('signInContainer').style.display = 'flex';
    }
});
