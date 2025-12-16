import { setCurrentGroup, groups, courts, schedules, players, ui, isCurrentUserAdminOfSelectedGroup } from './app.js';
import { getDerivedStats } from './rotation.js';
import { showMessageBox, renderAllPlayers, showLoading } from './ui.js';
import * as api from './api.js';

const weekdayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const showGroupSelectionModal = async () => {
    const modalOverlay = document.getElementById('groupSelectionModalOverlay');
    const buttonsContainer = document.getElementById('modalGroupButtonsContainer');
    buttonsContainer.innerHTML = '';

    if (Object.keys(groups).length === 0) {
        // If no groups exist, don't show the modal. Instead, switch to the admin tab.
        const groupManagementTabBtn = document.getElementById('groupManagementTabBtn');
        if (groupManagementTabBtn) {
            // Explicitly hide other tabs' content to prevent flash of incorrect content
            // Since "Groups" is now the default, we just need to ensure the others are hidden.
            document.getElementById('playerManagementTabContent').classList.add('hidden');
            document.getElementById('scheduleManagementTabContent').classList.add('hidden');
            document.getElementById('courtManagementTabContent').classList.add('hidden');
            document.getElementById('groupManagementTabContent').classList.remove('hidden');
            groupManagementTabBtn.classList.add('active');
        }
        // Show a helpful message to the user.
        showMessageBox(
            "Welcome!",
            "No groups found. Please create a new group to get started."
        );
        // Explicitly hide the group selection modal overlay since it won't be used.
        modalOverlay.classList.remove('show');
        return; // Exit before showing the modal
    }

    if (Object.keys(groups).length === 1) {
        const singleGroup = Object.values(groups)[0];
        await setCurrentGroup(singleGroup.id);
        modalOverlay.classList.remove('show');
        document.body.classList.remove('modal-open');
        return; // Exit before showing the modal
    }

    Object.values(groups).forEach((group) => {
        const button = document.createElement('button');
        button.className = 'btn btn-primary w-full';
        button.textContent = group.name;
        button.onclick = async () => {
            await setCurrentGroup(group.id);
            modalOverlay.classList.remove('show');
            document.body.classList.remove('modal-open');
        };
        buttonsContainer.appendChild(button);
    });

    const joinBtn = document.createElement('button');
    joinBtn.className = 'btn btn-secondary w-full mt-4';
    joinBtn.textContent = 'Join Group via Code';
    joinBtn.onclick = () => {
        modalOverlay.classList.remove('show');
        showJoinGroupModal();
    };
    buttonsContainer.appendChild(joinBtn);

    document.body.classList.add('modal-open');
    modalOverlay.classList.add('show');
};

export const populateScheduleCourtsDropdown = () => {
    const courtsDropdown = document.getElementById('createScheduleCourtsInput');
    if (!courtsDropdown) return;
    courtsDropdown.innerHTML = '';
    const courtsArray = Object.values(courts);
    if (!courtsArray || courtsArray.length === 0) {
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'text-gray-500';
        emptyDiv.textContent = 'No courts available';
        courtsDropdown.appendChild(emptyDiv);
        return;
    }
    courtsArray.forEach(court => {
        const container = document.createElement('div');
        container.className = 'flex items-center justify-between p-2 rounded-md hover:bg-gray-50';

        const label = document.createElement('label');
        label.className = 'flex items-center gap-2 cursor-pointer';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = court.id;
        checkbox.className = 'form-checkbox h-4 w-4 text-blue-600';
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(court.name || `Court ${court.id}`));

        const select = document.createElement('select');
        select.className = 'court-gametype-select input-field text-sm p-1 w-32';
        select.style.display = 'none'; // Initially hidden
        select.innerHTML = `
            <option value="1" selected>Doubles</option>
            <option value="0">Singles</option>
        `;

        checkbox.onchange = (e) => {
            select.style.display = e.target.checked ? 'block' : 'none';
        };

        container.append(label, select);
        courtsDropdown.appendChild(container);
    });
};

export const showEditScheduleModal = (schedule) => {
    const editScheduleModalOverlay = document.getElementById('editScheduleModalOverlay');
    document.getElementById('editScheduleNameInput').value = schedule.name;
    document.getElementById('editScheduleDayInput').value = schedule.day;
    document.getElementById('editScheduleTimeInput').value = schedule.time;
    document.getElementById('editScheduleDurationInput').value = schedule.duration;
    document.getElementById('editIsRecurring').checked = schedule.recurring;

    const recurrenceOptionsContainer = document.getElementById('editScheduleRecurrenceOptions');
    recurrenceOptionsContainer.style.display = schedule.recurring ? 'flex' : 'none';

    const recurrenceCountContainer = document.getElementById('editScheduleRecurrenceCountContainer');
    recurrenceCountContainer.style.display = schedule.frequency > 0 ? 'flex' : 'none';
    document.getElementById('editScheduleRecurrenceCountInput').value = schedule.recurrenceCount || 8;
    document.getElementById('editScheduleFrequencySelect').value = schedule.frequency;

    const courtsDropdown = document.getElementById('editScheduleCourtsInput');
    courtsDropdown.innerHTML = '';
    Object.values(courts).forEach(court => {
        const scheduleCourt = schedule.courts.find(c => c.courtId === court.id);
        const isChecked = !!scheduleCourt;
        const gameType = scheduleCourt ? scheduleCourt.gameType : '1'; // Default to Doubles

        const container = document.createElement('div');
        container.className = 'flex items-center justify-between p-2 rounded-md hover:bg-gray-50';

        const label = document.createElement('label');
        label.className = 'flex items-center gap-2 cursor-pointer';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = court.id;
        checkbox.className = 'form-checkbox h-4 w-4 text-blue-600';
        checkbox.checked = isChecked;

        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(court.name || `Court ${court.id}`));

        const select = document.createElement('select');
        select.className = 'court-gametype-select input-field text-sm p-1 w-32';
        select.style.display = isChecked ? 'block' : 'none';
        select.innerHTML = `
            <option value="1" ${gameType === '1' ? 'selected' : ''}>Doubles</option>
            <option value="0" ${gameType === '0' ? 'selected' : ''}>Singles</option>
        `;

        checkbox.onchange = (e) => {
            select.style.display = e.target.checked ? 'block' : 'none';
        };

        container.append(label, select);
        courtsDropdown.appendChild(container);
    });

    document.body.classList.add('modal-open');
    editScheduleModalOverlay.classList.add('show');
};

export const showScheduleStatsModal = async (schedule) => {
    document.getElementById('statsScheduleName').textContent = schedule.name;
    document.getElementById('scheduleCurrentDayDisplay').textContent = `${weekdayNames[schedule.day]}'s at ${schedule.time}`;
    const statsBody = document.getElementById('scheduleStatsModalBody');
    statsBody.innerHTML = '';

    showLoading(true);
    let allStatsForSchedule = [];
    try {
        // Use the new, more efficient API call
        allStatsForSchedule = await api.getScheduleStats(schedule.id)
    } finally {
        showLoading(false);
    }

    const playersForSchedule = allStatsForSchedule.map(ps => players[ps.playerId.id]);

    if (playersForSchedule.length === 0) {
        statsBody.innerHTML = '<tr><td colspan="5" class="text-center p-4 text-gray-500">No players are assigned to this schedule.</td></tr>';
    } else {
        playersForSchedule.sort((a, b) => a.user.name.localeCompare(b.user.name)).forEach(player => {
            if (!player) return;
            const statsData = allStatsForSchedule.find(ps => ps.playerId.id === player.id);
            const stats = getDerivedStats(statsData ? statsData.stats : []);
            const availability = player.availability?.find(a => a.scheduleId === schedule.id)?.type || 'N/A';

            const row = document.createElement('tr');
            row.className = 'table-row';

            // Set background color based on availability type
            switch (availability) {
                case 'Permanent':
                    row.style.backgroundColor = '#FFC0CB'; // Pink
                    break;
                case 'Rotation':
                    row.style.backgroundColor = '#FFCCCB'; // Light Red
                    break;
                case 'Backup':
                    row.style.backgroundColor = '#D2B48C'; // Tan/Brown
                    break;
            }

            row.innerHTML = `
                <td class="p-2 border-t">${player.user.name}</td>
                <td class="p-2 border-t text-center">${availability}</td>
                <td class="p-2 border-t text-center">${stats.weeksPlayed}</td>
                <td class="p-2 border-t text-center">${stats.weeksOnBench}</td>
                <td class="p-2 border-t">${stats.lastPlayed}</td>
            `;
            statsBody.appendChild(row);
        });
    }

    document.body.classList.add('modal-open');
    document.getElementById('scheduleStatsModalOverlay').classList.add('show');
};

export const hideEditScheduleModal = () => {
    document.getElementById('editScheduleModalOverlay').classList.remove('show');
    ui.scheduleBeingEdited = null;
};

export const showEditCourtModal = (court) => {
    document.body.classList.add('modal-open');
    document.getElementById('editCourtModalOverlay').classList.add('show');
    document.getElementById('editCourtNameInput').value = court.name;
};

export const showEditPlayerModal = (player) => {
    document.getElementById('editPlayerNameInput').value = player.user.name;
    const modifyAvailableSchedulesList = document.getElementById('modifyAvailableSchedulesList');
    modifyAvailableSchedulesList.innerHTML = '';
    const isAdmin = isCurrentUserAdminOfSelectedGroup(player.groupId);
    Object.values(schedules).forEach(schedule => {
        const playerAvailability = player.availability?.find(a => a.scheduleId === schedule.id);
        const isChecked = !!playerAvailability;
        const availabilityType = playerAvailability?.type || 'Rotation';

        const container = document.createElement('div');
        container.className = 'flex items-center justify-between p-2 rounded-md';

        const isPlanning = schedule.status === 'PLANNING';
        if (!isPlanning && !isAdmin) {
            container.classList.add('opacity-50', 'cursor-not-allowed');
        }

        const label = document.createElement('label');
        label.className = 'flex items-center gap-2';
        if (isPlanning || isAdmin) {
            label.classList.add('cursor-pointer');
        }

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = schedule.id;
        checkbox.className = 'schedule-checkbox form-checkbox h-4 w-4 text-blue-600';
        checkbox.checked = isChecked;
        checkbox.disabled = !isPlanning && !isAdmin;

        const span = document.createElement('span');
        span.textContent = `${schedule.name} (${weekdayNames[schedule.day]} at ${schedule.time})`;

        label.appendChild(checkbox);
        label.appendChild(span);

        const select = document.createElement('select');
        select.className = 'availability-select input-field text-sm p-1 w-32';
        select.style.display = isChecked ? 'block' : 'none';
        select.disabled = !isPlanning && !isAdmin;
        select.innerHTML = `
            <option value="Rotation" ${availabilityType === 'Rotation' ? 'selected' : ''}>Rotation</option>
            <option value="Permanent" ${availabilityType === 'Permanent' ? 'selected' : ''}>Permanent</option>
            <option value="Backup" ${availabilityType === 'Backup' ? 'selected' : ''}>Backup</option>
        `;

        checkbox.onchange = (e) => {
            select.style.display = e.target.checked ? 'block' : 'none';
        };

        container.appendChild(label);
        container.appendChild(select);
        modifyAvailableSchedulesList.appendChild(container);
    });

    document.getElementById('savePlayerChangesBtn').disabled = false;
    document.body.classList.add('modal-open');
    document.getElementById('editPlayerModalOverlay').classList.add('show');
};

export const showPlayerStatsModal = async (player) => {
    document.getElementById('statsPlayerName').textContent = player.user.name;
    const statsBody = document.getElementById('playerStatsModalBody');
    statsBody.innerHTML = '';

    // Fetch live stats for all schedules this player is a part of.
    showLoading(true);
    let allPlayerStats = [];
    try {
        // Use the new, more efficient API call
        allPlayerStats = await api.getPlayerStats(player.id);
    } finally {
        showLoading(false);
    }

    allPlayerStats.forEach(statData => {
        const schedule = schedules[statData.scheduleId.id];
        if (!schedule) return;
        const history = statData.stats || [];
        const stats = getDerivedStats(history);
        const totalBenched = history.filter(h => h.status === 'benched').length;

        let recurrencePrefix = 'W';
        if (schedule) {
            const frequency = parseInt(schedule.frequency);
            switch (frequency) {
                case 1: recurrencePrefix = 'D'; break;
                case 2: recurrencePrefix = 'W'; break;
                case 3: recurrencePrefix = 'B'; break;
                case 4: recurrencePrefix = 'M'; break;
            }
        }

        const historyItems = history.map(h => {
            const playIcon = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-600" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><circle cx="12" cy="12" r="9" /><path d="M6.241 15.34a9.012 9.012 0 0 1 0 -6.68" /><path d="M17.759 8.66a9.012 9.012 0 0 1 0 6.68" /></svg>`;
            const benchIcon = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 12H8v-2h8v2zm4-5H4v10h1v-4h14v4h1V7z"/></svg>`;
            const icon = h.status === 'played' ? playIcon : benchIcon;
            return `
                <div class="flex items-center gap-1 p-1 bg-gray-100 rounded-md">
                    <span class="font-semibold text-xs">${recurrencePrefix}${h.occurrenceNumber}</span>
                    ${icon}
                </div>
            `;
        }).join('');

        const scheduleName = schedule ? `${schedule.name} (${weekdayNames[schedule.day]} at ${schedule.time})` : 'Unknown Schedule';

        const row = statsBody.insertRow();
        row.className = 'table-row';
        row.innerHTML = `
            <td class="p-2 border-t">${scheduleName}</td>
            <td class="p-2 border-t text-center">${stats.weeksPlayed}</td>
            <td class="p-2 border-t text-center">${totalBenched}</td>
            <td class="p-2 border-t"><div class="flex flex-wrap gap-1">${historyItems}</div></td>
        `;
    });

    document.body.classList.add('modal-open');
    document.getElementById('playerStatsModalOverlay').classList.add('show');
};

export const showSwapModalForSchedule = (player, direction, schedule) => {
    ui.playerBeingSwapped = player;
    ui.swapActionDirection = direction;

    document.getElementById('playerBeingSwappedName').textContent = player.user.name;
    document.getElementById('swapModalTitle').textContent = `Swap ${player.user.name} (${direction === 'moveToBench' ? 'Playing' : 'Bench'})`;

    const swapPlayerSelect = document.getElementById('swapPlayerSelect');
    const swapMessage = document.getElementById('swapMessage');
    const confirmSwapBtn = document.getElementById('confirmSwapBtn');
    const swapWithBackupCheckbox = document.getElementById('swapWithBackupCheckbox');
    const backupSwapContainer = document.getElementById('backupSwapContainer'); // This container holds the backup player select dropdown
    const backupPlayerSelect = document.getElementById('backupPlayerSelect');

    const populateRegularSwaps = () => {
        swapPlayerSelect.innerHTML = '<option value="">Select player to swap with</option>';
        let eligibleSwapPartners = [];
        const playingIds = schedule.playingPlayersIds || [];
        const benchIds = schedule.benchPlayersIds || [];

        // The player being swapped is either on the court or on the bench.
        // The eligible partners are on the opposite list.
        if (direction === 'moveToBench') {
            eligibleSwapPartners = benchIds.map(id => players[id]).filter(Boolean);
        } else {
            eligibleSwapPartners = playingIds.map(id => players[id]).filter(p => p && p.id !== player.id);
        }

        if (eligibleSwapPartners.length === 0) {
            swapPlayerSelect.innerHTML = '<option value="">No players to swap with</option>';
        } else {
            eligibleSwapPartners.sort((a, b) => a.user.name.localeCompare(b.user.name)).forEach(p => {
                const option = document.createElement('option');
                option.value = p.id;
                option.textContent = p.user.name;
                swapPlayerSelect.appendChild(option);
            });
        }
    };

    const populateBackupSwaps = () => {
        backupPlayerSelect.innerHTML = '<option value="">Select backup player</option>';
        const backupPlayers = Object.values(players).filter(p =>
            p.availability?.find(a => a.scheduleId === schedule.id)?.type === 'Backup'
        );

        if (backupPlayers.length === 0) {
            backupPlayerSelect.innerHTML = '<option value="">No backup players available</option>';
        } else {
            backupPlayers.sort((a, b) => a.user.name.localeCompare(b.user.name)).forEach(p => {
                const option = document.createElement('option');
                option.value = p.id;
                option.textContent = p.user.name;
                backupPlayerSelect.appendChild(option);
            });
        }
    };

    swapWithBackupCheckbox.onchange = (e) => {
        const useBackup = e.target.checked;
        backupSwapContainer.style.display = useBackup ? 'flex' : 'none';
        swapPlayerSelect.style.display = useBackup ? 'none' : 'block';
        confirmSwapBtn.disabled = true; // Disable button until a selection is made
        if (useBackup) {
            populateBackupSwaps();
            backupPlayerSelect.value = ''; // Reset selection
        } else {
            swapPlayerSelect.value = ''; // Reset selection
        }
    };

    // Initial state
    swapWithBackupCheckbox.checked = false;
    backupSwapContainer.style.display = 'none';
    swapPlayerSelect.style.display = 'block';
    populateRegularSwaps();

    swapPlayerSelect.onchange = () => { confirmSwapBtn.disabled = !swapPlayerSelect.value; };
    backupPlayerSelect.onchange = () => { confirmSwapBtn.disabled = !backupPlayerSelect.value; };
    document.body.classList.add('modal-open');
    document.getElementById('swapModalOverlay').classList.add('show');
};

export const showScheduleSignupsModal = async (schedule) => {
    const modalOverlay = document.getElementById('scheduleSignupsModalOverlay');
    const container = document.getElementById('scheduleSignupsContainer');
    container.innerHTML = '';
    showLoading(true);
    try {
        const signups = await api.getScheduleSignups(schedule.id);
        if (signups.length === 0) {
            container.innerHTML = '<p class="text-gray-500">No players have signed up for this schedule yet.</p>';
        } else {
            const table = document.createElement('table');
            table.className = 'min-w-full bg-white';
            table.innerHTML = `
                <thead>
                    <tr>
                        <th class="py-2 px-4 border-b">Player Name</th>
                        <th class="py-2 px-4 border-b">Availability</th>
                    </tr>
                </thead>
                <tbody>
                    ${signups.map(signup => `
                        <tr>
                            <td class="py-2 px-4 border-b">${signup.playerName}</td>
                            <td class="py-2 px-4 border-b">${signup.availabilityType}</td>
                        </tr>
                    `).join('')}
                </tbody>
            `;
            container.appendChild(table);
        }
    } catch (error) {
        console.error('Error loading signups:', error);
        showMessageBox('Error', 'Failed to load signups.');
    } finally {
        showLoading(false);
    }

    document.body.classList.add('modal-open');
    modalOverlay.classList.add('show');
};

export const showJoinGroupModal = () => {
    document.getElementById('joinGroupCodeInput').value = '';
    document.body.classList.add('modal-open');
    document.getElementById('joinGroupModalOverlay').classList.add('show');
};