import { setCurrentGroup, loadSchedulesForGroup, groups, playerGroups, selection, ui, players, schedules, courts, isCurrentUserAdminOfSelectedGroup, parseJwt, saveScheduleChanges } from './app.js';
import { addEditGroupListeners, addRemoveGroupListeners, addShareGroupListeners, addScheduleActionListeners } from './events.js';
import { showEditScheduleModal, populateScheduleCourtsDropdown, hideEditScheduleModal } from './modals.js';
import { addSwapButtonListenersForSchedule } from './events.js';
import { getDerivedStats } from './rotation.js';
import { addNewPlayer, addRemovePlayerListeners, addEditPlayerListeners, addViewStatsListeners } from './events.js';
import { addRemoveCourtListeners, addEditCourtListeners } from './events.js';
import { getRotationButtonState, updateSchedule } from './api.js';


const weekdayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const showLoading = (show) => { 
    const overlay = document.getElementById('loadingOverlay');
    overlay.classList.toggle('hidden', !show);
    overlay.classList.toggle('flex', show); // Ensure flex is applied when shown
};

export const showMessageBox = (title, message, onOkCallback) => {
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1001]';
    overlay.id = 'messageBoxOverlay';
    const messageBox = document.createElement('div');
    messageBox.className = 'bg-white p-6 rounded-xl shadow-lg max-w-sm w-full text-center transform scale-95 opacity-0 transition-all duration-300';
    messageBox.innerHTML = `
        <h3 class="text-xl font-semibold mb-3 text-gray-800">${title}</h3>
        <p class="text-gray-600 mb-5">${message}</p>
        <button id="messageBoxCloseBtn" class="btn btn-primary">OK</button>
    `;
    overlay.appendChild(messageBox);
    document.body.appendChild(overlay);
    setTimeout(() => {
        messageBox.classList.remove('scale-95', 'opacity-0');
        messageBox.classList.add('scale-100', 'opacity-100');
    }, 50);
    const closeMessageBox = () => {
        messageBox.classList.remove('scale-100', 'opacity-100');
        messageBox.classList.add('scale-95', 'opacity-0');
        setTimeout(() => {
            // Check if the overlay is still a child of the body before removing it
            if (document.body.contains(overlay)) {
                document.body.removeChild(overlay);
            }
            if (onOkCallback) {
                onOkCallback();
            }
        }, 300);
    };
    // Find the button within the newly created messageBox to avoid conflicts
    messageBox.querySelector('#messageBoxCloseBtn').onclick = closeMessageBox;
    overlay.onclick = (e) => {
        if (e.target === overlay) { closeMessageBox(); }
    };
};

export const renderGroupsList = async () => {
    const groupsList = document.getElementById('groupsList');
    if (!groupsList) return;
    groupsList.innerHTML = '';

    // Combine admin groups and player groups, ensuring no duplicates
    const allUserGroups = { ...playerGroups, ...groups };
    const sortedGroups = Object.values(allUserGroups).sort((a, b) => a.name.localeCompare(b.name));

    sortedGroups.forEach((group) => {
        const isAdmin = !!groups[group.id]; // Check if the group exists in the admin groups list

        const card = document.createElement('div');
        card.className = 'player-item flex justify-between items-center text-sm cursor-pointer p-3 md:flex-col md:justify-between md:p-2 md:h-full';
        if (group.id === selection.currentGroupId) {
            card.classList.add('btn-primary');
        }

        const actionButtonsContainer = isAdmin ? `
            <div class="flex justify-center gap-4 mt-2">
                <button data-id="${group.id}" class="edit-group-btn text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-100" title="Edit Group">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L14.732 3.732z" /></svg>
                </button>
                <button data-id="${group.id}" class="share-group-btn text-green-600 hover:text-green-800 p-1 rounded-full hover:bg-green-100" title="Share Group">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" /></svg>
                </button>
                <button data-id="${group.id}" class="remove-group-btn text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-100" title="Delete Group">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
            </div>
        ` : '<div class="h-10"></div>'; // Placeholder to maintain consistent height

        card.innerHTML = `
            <span class="name-text text-base md:mb-1 flex-grow">${group.name}</span>
            ${actionButtonsContainer}
        `;
        card.onclick = (e) => {
            if (e.target === card || e.target.classList.contains('name-text')) {
                setCurrentGroup(group.id);
            }
        };
        groupsList.appendChild(card);
    });

    
    
    const createGroupBtn = document.createElement('button');
    createGroupBtn.id = 'createGroupBtn';
    createGroupBtn.className = 'player-item btn-add-new flex items-center justify-center font-semibold cursor-pointer p-4 md:p-2';
    createGroupBtn.textContent = 'Create New Group';
    createGroupBtn.onclick = () => {
        document.getElementById('createGroupModalOverlay').classList.add('show');
    };
    groupsList.appendChild(createGroupBtn);
    
    addEditGroupListeners();
    addRemoveGroupListeners();
    addShareGroupListeners();
};

export const showScheduleDetails = async (schedule) => {
    selection.selectedSchedule = schedule;

    document.getElementById('schedule-actions-container')?.remove(); // This line is fine, it removes the old actions container

    const selectedCard = document.querySelector(`#schedulesList .player-item[data-id="${schedule.id}"]`); // Fix: Use schedule.id for consistency
    document.querySelectorAll('#schedulesList .player-item').forEach(card => {
        card.classList.remove('btn-primary');
    });
    if (selectedCard) {
        selectedCard.classList.add('btn-primary');
    }

    if (!schedule) return;

    // Make the details container visible
    const detailsContainer = document.getElementById('scheduleDetailsContainer');
    detailsContainer.classList.remove('hidden');
    detailsContainer.classList.add('flex', 'flex-col');
    const playingPlayersContainer = document.getElementById('playingPlayersContainer');
    const benchPlayersContainer = document.getElementById('benchPlayersContainer');
    playingPlayersContainer.innerHTML = '';
    benchPlayersContainer.innerHTML = '';
    const generateBtn = document.getElementById('generateRotationBtn');
    if (generateBtn) {
        generateBtn.style.display = 'none'; // Hide button by default
    }

    if (schedule.status === 'PLANNING') {
        playingPlayersContainer.innerHTML = '<p class="col-span-full text-center text-gray-500">Player lineup will be generated after planning is complete.</p>';
        benchPlayersContainer.innerHTML = '<p class="col-span-full text-center text-gray-500">View sign-ups to manage this schedule.</p>';
    } else if (schedule.status === 'COMPLETED') {
        playingPlayersContainer.innerHTML = '<p class="col-span-full text-center text-gray-500">This schedule has finished.</p>';
        benchPlayersContainer.innerHTML = '<p class="col-span-full text-center text-gray-500">No players on the bench.</p>';
    } else {
        const playingPlayerIds = schedule.playingPlayersIds || [];
        const benchPlayerIds = schedule.benchPlayersIds || [];

        renderPlayerList(playingPlayersContainer, playingPlayerIds, 'playing', 'moveToBench', 'No players assigned to play.', schedule);
        renderPlayerList(benchPlayersContainer, benchPlayerIds, 'sitting-out', 'moveToCourt', 'No players on the bench.', schedule);

        try {
            const buttonState = await getRotationButtonState(schedule.id);
            generateBtn.style.display = buttonState.visible ? 'block' : 'none';
            generateBtn.textContent = buttonState.text;
            generateBtn.disabled = buttonState.disabled;
        } catch (error) {
            console.error("Could not get rotation button state:", error);
            generateBtn.style.display = 'none';
        }
    }

    document.getElementById('currentDayDisplay').textContent = `${weekdayNames[schedule.day]}'s at ${schedule.time}`;
    document.getElementById('currentNum').textContent = schedule.week || 1;

    const recurrenceInfoContainer = document.getElementById('recurrenceInfoContainer');
    const recurrenceTypeDisplay = document.getElementById('recurrenceTypeDisplay');
    const frequency = parseInt(schedule.frequency);

    if (frequency > 0) {
        recurrenceInfoContainer.style.display = 'inline';
        let recurrenceText = 'Week';
        switch (frequency) {
            case 1: recurrenceText = 'Day'; break;
            case 2: recurrenceText = 'Week'; break;
            case 3: recurrenceText = 'Bi-Week'; break;
            case 4: recurrenceText = 'Month'; break;
        }
        recurrenceTypeDisplay.textContent = recurrenceText;
    } else {
        recurrenceInfoContainer.style.display = 'none';
    }

    if (generateBtn) {
        try {
            const buttonState = await getRotationButtonState(schedule.id);
            generateBtn.style.display = buttonState.visible ? 'block' : 'none';
            generateBtn.textContent = buttonState.text;
            generateBtn.disabled = buttonState.disabled;
        } catch (error) {
            console.error("Could not get rotation button state:", error);
            generateBtn.style.display = 'none';
        }
    }

    addSwapButtonListenersForSchedule(schedule);
};

function renderPlayerList(container, playerIds, itemClass, action, emptyMessage, schedule) {
    if (playerIds.length === 0) {
        container.innerHTML = `<p class="col-span-full text-center text-gray-500 p-4">${emptyMessage}</p>`;
        return;
    } 

    const currentUser = parseJwt(localStorage.getItem('token'));
    const isAdmin = isCurrentUserAdminOfSelectedGroup();

    playerIds.forEach(id => {
        const player = players[id];
        if (player) {
            const isOwnCard = player.userId === currentUser.id;
            const canSwap = isAdmin || isOwnCard;

            const playerDiv = document.createElement('div');
            playerDiv.className = `player-item ${itemClass} flex justify-between items-center`;
            
            const buttonHtml = canSwap 
                ? `<button class="action-btn" data-player-id="${player.id}" data-action="${action}">Swap</button>`
                : '';

            playerDiv.innerHTML = `<span class="name-text">${player.user.name}</span>${buttonHtml}`;
            container.appendChild(playerDiv);
        }
    });
}

export const renderSchedulesList = () => {
    const schedulesList = document.getElementById('schedulesList');
    if (!schedulesList) return;
    schedulesList.innerHTML = '';

    // The selected group could be an admin group or a player group. Check both.
    const selectedGroup = groups[selection.currentGroupId] || playerGroups[selection.currentGroupId];
    const groupSchedules = Object.values(schedules).filter(s => s.groupId === selectedGroup?.id);

    groupSchedules.forEach(schedule => {
        const day = weekdayNames[schedule.day];
        const time = schedule.time || '';
        const card = document.createElement('div');
        card.className = 'player-item schedule-card flex flex-col justify-end items-center text-sm cursor-pointer relative overflow-hidden h-24 md:h-32';
        card.dataset.id = schedule.id;
        card.innerHTML = `
            <div class="absolute top-0 left-0 p-2 bg-black bg-opacity-50 rounded-br-lg">
                <span class="name-text text-base font-bold text-white">${schedule.name}</span>
                <span class="text-xs text-gray-300 block">${day} ${time}</span>
            </div>
            <div class="absolute bottom-1 right-1 flex gap-1 bg-black bg-opacity-50 rounded-full p-1">
                <button data-action="stats" class="text-white hover:text-green-300 p-1" title="View Stats">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                </button>
                ${isCurrentUserAdminOfSelectedGroup() ? `
                    ${schedule.status === 'PLANNING' ? `
                    <button data-action="view-signups" class="text-white hover:text-yellow-300 p-1" title="View Sign-ups">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                    </button>
                    ` : ''}
                    <button data-action="edit" class="text-white hover:text-blue-300 p-1" title="Edit Schedule">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L14.732 3.732z" /></svg>
                    </button>
                    <button data-action="delete" class="text-white hover:text-red-300 p-1" title="Delete Schedule">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                ` : ''}
            </div>
        `;
        card.onclick = () => showScheduleDetails(schedule);
        schedulesList.appendChild(card);
    });

    if (isCurrentUserAdminOfSelectedGroup()) {
        const createScheduleBtn = document.createElement('button');
        createScheduleBtn.id = 'createScheduleBtn';
        createScheduleBtn.className = 'player-item btn-add-new flex items-center justify-center font-semibold cursor-pointer h-24 md:h-32';
        createScheduleBtn.textContent = 'Create Schedule';
        schedulesList.appendChild(createScheduleBtn);

        createScheduleBtn.onclick = () => {
            if (!selection.currentGroupId) {
                showMessageBox('Error', 'Please select a group before creating a new schedule.');
                return;
            }
            populateScheduleCourtsDropdown();
            document.getElementById('createScheduleModalOverlay').classList.add('show');
        };
    }

    addScheduleActionListeners();
};

export const renderCourtsList = () => {
    const courtsList = document.getElementById('courtsList');
    if (!courtsList) return;
    courtsList.innerHTML = '';

    // If the user has no admin groups, don't render anything for courts.
    if (Object.keys(groups).length === 0) {
        courtsList.innerHTML = '<p class="text-gray-500">You do not have administrative access to any courts.</p>';
        return;
    }

    // The selected group could be an admin group or a player group. Check both.
    const selectedGroup = groups[selection.currentGroupId] || playerGroups[selection.currentGroupId];
    const groupCourts = Object.values(courts).filter(c => c.groupId === selectedGroup?.id);
    groupCourts.forEach(court => {
        const card = document.createElement('div');
        card.className = 'player-item flex justify-between items-center text-sm p-3 md:flex-col md:justify-between md:p-2';
        card.innerHTML = `
            <span class="name-text text-base mb-1 flex-grow">${court.name}</span>
            <div class="flex justify-center gap-4 mt-2">
                <button data-id="${court.id}" class="edit-court-btn text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-100" title="Edit Court">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L14.732 3.732z" /></svg>
                </button>
                <button data-id="${court.id}" class="remove-court-btn text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-100" title="Delete Court">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
            </div>
        `;
        courtsList.appendChild(card);
    });

    const createCourtBtn = document.createElement('button');
    createCourtBtn.id = 'createCourtBtn';
    createCourtBtn.className = 'player-item btn-add-new flex items-center justify-center font-semibold cursor-pointer p-4 md:p-2';
    createCourtBtn.textContent = 'Create New Court';
    courtsList.appendChild(createCourtBtn);

    createCourtBtn.onclick = () => {
        if (!selection.currentGroupId) {
            showMessageBox('Error', 'Please select a group before creating a new one.');
            return;
        }
        document.getElementById('createCourtModalOverlay').classList.add('show');
    };

    addRemoveCourtListeners();
    addEditCourtListeners();
};

export const renderAllPlayers = () => {
    const allPlayersGrid = document.getElementById('allPlayersGrid');
    allPlayersGrid.innerHTML = '';
    // The selected group could be an admin group or a player group. Check both.
    const selectedGroup = groups[selection.currentGroupId] || playerGroups[selection.currentGroupId];
    const groupPlayers = Object.values(players).filter(p => p.groupId === selectedGroup?.id);
    groupPlayers.sort((a, b) => a.user.name.localeCompare(b.user.name)).forEach(player => {
        const card = document.createElement('div');
        // Use the user's picture as a background image for the card
        const pictureUrl = player.user?.picture || 'https://via.placeholder.com/150'; // Fallback image
        card.className = 'player-item flex flex-col justify-end items-center text-sm p-2 rounded-lg shadow-md bg-cover bg-center text-white relative overflow-hidden h-24 md:h-32';
        card.style.backgroundImage = `url(${pictureUrl})`;

        const isOwnProfile = player.userId === parseJwt(localStorage.getItem('token')).id;
        const isAdmin = isCurrentUserAdminOfSelectedGroup();

        card.innerHTML = `
            <div class="absolute top-0 left-0 p-2 bg-black bg-opacity-50 rounded-br-lg">
                <span class="name-text text-base font-bold text-white">${player.user.name}</span>
            </div>
            <div class="absolute bottom-0 right-0 p-1">
                <div class="flex gap-1 bg-black bg-opacity-50 rounded-full p-1">
                    <button data-id="${player.id}" class="view-stats-btn text-white hover:text-green-300 p-1" title="View Stats">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                    </button>
                    ${isOwnProfile || isAdmin ? `
                        <button data-id="${player.id}" class="edit-player-btn text-white hover:text-blue-300 p-1" title="Edit Player">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L14.732 3.732z" /></svg>
                        </button>
                    ` : ''}
                    ${isAdmin ? `
                        <button data-id="${player.id}" class="remove-player-btn text-white hover:text-red-300 p-1" title="Delete Player">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
        allPlayersGrid.appendChild(card);
    });

    if (isCurrentUserAdminOfSelectedGroup()) {
        const addPlayerBtn = document.createElement('button');
        addPlayerBtn.id = 'addPlayerBtn';
        addPlayerBtn.className = 'player-item btn-add-new flex items-center justify-center font-semibold cursor-pointer h-24 md:h-32';
        addPlayerBtn.textContent = 'Add Player';
        addPlayerBtn.onclick = addNewPlayer;
        allPlayersGrid.appendChild(addPlayerBtn);
    }

    addRemovePlayerListeners();
    addEditPlayerListeners();
    addViewStatsListeners();
};