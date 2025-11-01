import { showEditCourtModal, showEditPlayerModal, showPlayerStatsModal, showSwapModalForSchedule, showEditScheduleModal, showScheduleStatsModal } from './modals.js';
import * as app from './app.js';
import { finalizeAndSaveRotation } from './rotation.js';
import * as api from './api.js';
import { showMessageBox, renderGroupsList, showLoading, renderCourtsList, showScheduleDetails } from './ui.js';

const weekdayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function setupGlobalEventListeners() {
    // Tab buttons
    const playerManagementTabBtn = document.getElementById('playerManagementTabBtn');
    const scheduleManagementTabBtn = document.getElementById('scheduleManagementTabBtn');
    const groupManagementTabBtn = document.getElementById('groupManagementTabBtn');
    const playerManagementTabContent = document.getElementById('playerManagementTabContent');
    const scheduleManagementTabContent = document.getElementById('scheduleManagementTabContent');
    const groupManagementTabContent = document.getElementById('groupManagementTabContent');

    const allTabButtons = [groupManagementTabBtn, scheduleManagementTabBtn, playerManagementTabBtn];
    const allTabContents = [playerManagementTabContent, scheduleManagementTabContent, groupManagementTabContent];

    const activateTab = (activeBtn, activeContent) => {
        allTabButtons.forEach(btn => btn.classList.remove('active'));
        allTabContents.forEach(content => content.classList.add('hidden'));
        activeBtn.classList.add('active');
        activeContent.classList.remove('hidden');
    };

    playerManagementTabBtn.onclick = () => {
        activateTab(playerManagementTabBtn, playerManagementTabContent);
    };
    scheduleManagementTabBtn.onclick = () => {
        activateTab(scheduleManagementTabBtn, scheduleManagementTabContent);
    };
    groupManagementTabBtn.onclick = () => {
        activateTab(groupManagementTabBtn, groupManagementTabContent);
        renderGroupsList();
    };

    // Logout Button
    document.getElementById('logoutBtn').onclick = app.logout;

    // Group Modals
    document.getElementById('cancelCreateGroupBtn').onclick = () => {
        document.getElementById('createGroupModalOverlay').classList.remove('show');
        document.body.classList.remove('modal-open');
    };
    document.getElementById('confirmCreateGroupBtn').onclick = () => app.createNewGroup();

    document.getElementById('cancelEditGroupBtn').onclick = () => {
        document.body.classList.remove('modal-open');
        document.getElementById('editGroupModalOverlay').classList.remove('show');
        app.ui.groupBeingEdited = null;
    };
    document.getElementById('confirmEditGroupBtn').onclick = async () => {
        if (!app.ui.groupBeingEdited) return;
        const newName = document.getElementById('editGroupNameInput').value.trim();
        const adminCheckboxes = document.querySelectorAll('#groupAdminsList input[type="checkbox"]');
        const newAdminUserIds = Array.from(adminCheckboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.value);

        showLoading(true);
        try {
            // Update group name and admins in parallel
            const [updatedGroup, ] = await Promise.all([
                api.updateGroup(app.ui.groupBeingEdited.id, { name: newName }),
                api.updateGroupAdmins(app.ui.groupBeingEdited.id, newAdminUserIds)
            ]);

            // The group object from updateGroup doesn't have the new admins, so we update it manually
            app.groups[updatedGroup.id] = updatedGroup;
            app.groups[updatedGroup.id].admins = newAdminUserIds;

            document.body.classList.remove('modal-open');
            document.getElementById('editGroupModalOverlay').classList.remove('show');
            await app.setCurrentGroup(app.selection.currentGroupId); // Refresh UI for current group
            renderGroupsList(); // Re-render the admin group list
        } catch (error) {
            console.error('Error updating group:', error);
            showMessageBox('Error', error.message || 'Failed to update group.');
        } finally {
            showLoading(false);
        }
    };

    // Player Modals
    document.getElementById('closePlayerStatsBtn').onclick = () => {
        document.body.classList.remove('modal-open');
        document.getElementById('playerStatsModalOverlay').classList.remove('show');
    };
    document.getElementById('cancelInvitePlayerBtn').onclick = () => {
        document.body.classList.remove('modal-open');
        document.getElementById('addPlayerModalOverlay').classList.remove('show');
    };
    document.getElementById('confirmInvitePlayerBtn').onclick = async () => {
        const email = document.getElementById('invitePlayerEmailInput').value.trim();
        if (!email) return showMessageBox('Error', 'Please enter an email address.');

        if (!email.toLowerCase().endsWith('@gmail.com')) {
            return showMessageBox('Validation Error', 'Only @gmail.com accounts can be invited.');
        }

        // First, hide the modal, then show the loading indicator
        document.getElementById('addPlayerModalOverlay').classList.remove('show');
        document.body.classList.remove('modal-open');
        showLoading(true);
        try {
            const result = await api.invitePlayer(app.selection.currentGroupId, email);
            showMessageBox('Success', result.msg);
        } catch (error) {
            showMessageBox('Error', error.message);
        } finally {
            showLoading(false);
        }
    };
    document.getElementById('cancelEditBtn').onclick = () => {
        document.body.classList.remove('modal-open');
        document.getElementById('editPlayerModalOverlay').classList.remove('show');
    };
    document.getElementById('savePlayerChangesBtn').onclick = app.savePlayerChanges;

    // Schedule Modals
    document.getElementById('cancelEditScheduleBtn').onclick = () => {
        document.body.classList.remove('modal-open');
        document.getElementById('editScheduleModalOverlay').classList.remove('show');
    };
    document.getElementById('closeScheduleStatsBtn').onclick = () => {
        document.body.classList.remove('modal-open');
        document.getElementById('scheduleStatsModalOverlay').classList.remove('show');
    };
    document.getElementById('confirmEditScheduleBtn').onclick = app.saveScheduleChanges;
    document.getElementById('cancelCreateScheduleBtn').onclick = () => {
        document.body.classList.remove('modal-open');
        document.getElementById('createScheduleModalOverlay').classList.remove('show');
    };
    document.getElementById('confirmCreateScheduleBtn').onclick = app.createNewSchedule;

    // Court Modals
    document.getElementById('cancelCreateCourtBtn').onclick = () => {
        document.body.classList.remove('modal-open');
        document.getElementById('createCourtModalOverlay').classList.remove('show');
    };
    document.getElementById('confirmCreateCourtBtn').onclick = app.createNewCourt;
    document.getElementById('cancelEditCourtBtn').onclick = () => {
        document.body.classList.remove('modal-open');
        document.getElementById('editCourtModalOverlay').classList.remove('show');
    };
    document.getElementById('confirmEditCourtBtn').onclick = async () => {
        if (!app.ui.courtBeingEdited) return;
        const newName = document.getElementById('editCourtNameInput').value.trim();
        showLoading(true);
        try {
            const updatedCourt = await api.updateCourt(app.ui.courtBeingEdited.id, { name: newName });
            app.courts[updatedCourt.id] = updatedCourt;
            document.body.classList.remove('modal-open');
            renderCourtsList();
            document.getElementById('editCourtModalOverlay').classList.remove('show');
            app.ui.courtBeingEdited = null;
        } catch (error) {
            console.error('Error updating court:', error);
            showMessageBox('Error', 'Failed to update court.');
        } finally {
            showLoading(false);
        }
    };

    // Swap Modal
    document.getElementById('cancelSwapBtn').onclick = () => {
        document.body.classList.remove('modal-open');
        document.getElementById('swapModalOverlay').classList.remove('show');
    };
    document.getElementById('confirmSwapBtn').onclick = async () => {
        const selectedSwapPlayerId = document.getElementById('swapPlayerSelect').value;
        if (!selectedSwapPlayerId || !app.ui.playerBeingSwapped) {
            showMessageBox("Error", "Please select a player to swap with.");
            return;
        }

        const swapPartner = app.players[selectedSwapPlayerId];
        if (!swapPartner) {
            showMessageBox("Error", "Selected swap partner not found.");
            return;
        }

        showLoading(true);
        try {
            // Call the new API endpoint for swapping players
            await api.swapPlayers(
                app.selection.selectedSchedule.id, // Schedule ID
                app.ui.playerBeingSwapped.id, // Player being swapped ID
                swapPartner.id, // Swap partner ID
                app.ui.swapActionDirection
            );
            document.body.classList.remove('modal-open');
            document.getElementById('swapModalOverlay').classList.remove('show');
            // After a successful swap, reload schedules and re-render the selected schedule's details
            await app.loadSchedulesForGroup();
            showScheduleDetails(app.selection.selectedSchedule);
        } catch (error) {
            console.error('Error during player swap:', error);
            showMessageBox("Error", error.message || "Failed to swap players.");
        } finally {
            showLoading(false);
        }
    };
    // Other Global Buttons
    document.getElementById('generateRotationBtn').onclick = async () => {
        if (!app.selection.selectedSchedule) {
            showMessageBox("Action Required", "Please select a schedule before generating a rotation.");
            return;
        }

        showLoading(true);
        try {
            // Handle one-time schedules
            if (!app.selection.selectedSchedule.recurring) {
                if (app.selection.selectedSchedule.isRotationGenerated) {
                    showMessageBox("Schedule Finished", "This schedule has already been finished.");
                    return;
                }
                await finalizeAndSaveRotation(app.selection.selectedSchedule);
                app.selection.selectedSchedule.isRotationGenerated = true; // Mark as finished
                const updatedSchedule = await api.updateSchedule(app.selection.selectedSchedule.id, app.selection.selectedSchedule);
                app.schedules[updatedSchedule.id] = updatedSchedule;
                app.selection.selectedSchedule = updatedSchedule;
                showScheduleDetails(updatedSchedule);
                return;
            }

            // Handle recurring schedules
            if (app.selection.selectedSchedule.frequency > 0 && app.selection.selectedSchedule.recurrenceCount > 0 && app.selection.selectedSchedule.week > app.selection.selectedSchedule.recurrenceCount) {
                showMessageBox("Schedule Finished", "This schedule has completed its recurring cycle and no more rotations can be generated.");
                return;
            }

            await finalizeAndSaveRotation(app.selection.selectedSchedule);
            app.selection.selectedSchedule.week = (app.selection.selectedSchedule.week || 0) + 1;
            // The backend now handles lastGeneratedWeek, so we don't set it here.
            app.selection.selectedSchedule.isRotationGenerated = true;
            
            const updatedSchedule = await api.updateSchedule(app.selection.selectedSchedule.id, app.selection.selectedSchedule);
            app.schedules[updatedSchedule.id] = updatedSchedule;
            app.selection.selectedSchedule = updatedSchedule;
            await app.reloadData();
            showScheduleDetails(updatedSchedule);
        } catch (error) {
            console.error('Error generating rotation:', error);
            showMessageBox('Error', 'Failed to generate rotation.');
        } finally {
            showLoading(false);
        }
    };

    // Dynamic Event Listeners for Schedule Modals
    document.getElementById('createScheduleIsRecurringSelect').onchange = (e) => {
        document.getElementById('createScheduleRecurrenceOptions').style.display = e.target.checked ? 'flex' : 'none';
    };
    document.getElementById('createScheduleFrequencySelect').onchange = (e) => {
        document.getElementById('createScheduleRecurrenceCountContainer').style.display = e.target.value > 0 ? 'flex' : 'none';
    };
    document.getElementById('editIsRecurring').onchange = (e) => {
        document.getElementById('editScheduleRecurrenceOptions').style.display = e.target.checked ? 'flex' : 'none';
    };
    document.getElementById('editScheduleFrequencySelect').onchange = (e) => {
        document.getElementById('editScheduleRecurrenceCountContainer').style.display = e.target.value > 0 ? 'flex' : 'none';
    };
}

export const addScheduleActionListeners = () => {
    document.querySelectorAll('.schedule-card [data-action]').forEach(button => {
        button.onclick = async (event) => {
            event.stopPropagation(); // Prevent the card's main click event

            const card = event.currentTarget.closest('.schedule-card');
            const scheduleId = card.dataset.id;
            const schedule = app.schedules[scheduleId];
            const action = event.currentTarget.dataset.action;

            if (!schedule) return;

            if (action === 'edit') {
                app.ui.scheduleBeingEdited = schedule;
                showEditScheduleModal(schedule);
            } else if (action === 'stats') {
                showScheduleStatsModal(schedule);
            } else if (action === 'delete') {
                showLoading(true);
                try {
                    await api.deleteSchedule(schedule.id);
                    showMessageBox('Success', 'Schedule deleted successfully.');
                    await app.reloadData();
                } catch (error) {
                    console.error('Error deleting schedule:', error);
                    showMessageBox('Error', 'Failed to delete schedule.');
                } finally {
                    showLoading(false);
                }
            }
        };
    });
};

export const addEditGroupListeners = () => {
    document.querySelectorAll('.edit-group-btn').forEach(button => {
        button.onclick = (event) => {
            const groupId = event.currentTarget.dataset.id;
            app.ui.groupBeingEdited = app.groups[groupId];
            if (app.ui.groupBeingEdited) {
                document.getElementById('editGroupNameInput').value = app.ui.groupBeingEdited.name;

                const groupAdminsList = document.getElementById('groupAdminsList');
                groupAdminsList.innerHTML = '';
                const groupPlayers = Object.values(app.players).filter(p => p.groupid === groupId);
                const currentAdmins = app.ui.groupBeingEdited.admins || [];
                const currentUserId = app.parseJwt(localStorage.getItem('token')).id;

                groupPlayers.forEach(player => {
                    const isPlayerAdmin = currentAdmins.includes(player.userId);
                    const isCurrentUser = player.userId === currentUserId;
                    const isLastAdmin = isCurrentUser && isPlayerAdmin && currentAdmins.length === 1;

                    const label = document.createElement('label');
                    label.className = 'flex items-center gap-2 p-1 rounded hover:bg-gray-100';
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.value = player.userId;
                    checkbox.checked = isPlayerAdmin;
                    checkbox.className = 'form-checkbox h-4 w-4 text-blue-600';
                    if (isLastAdmin) {
                        checkbox.disabled = true;
                        label.title = "You cannot revoke your own admin status as you are the only admin.";
                    }

                    label.appendChild(checkbox);
                    label.appendChild(document.createTextNode(player.user.name));
                    groupAdminsList.appendChild(label);
                });

                document.body.classList.add('modal-open');
                document.getElementById('editGroupModalOverlay').classList.add('show');
            }
        };
    });
};

export const addRemoveGroupListeners = () => {
    document.querySelectorAll('.remove-group-btn').forEach(button => {
        button.onclick = async (event) => {
            showLoading(true);
            const groupId = event.currentTarget.dataset.id;
            try {
                // The backend now handles cascading deletes of associated
                // courts, players, and schedules when a group is deleted.

                await api.deleteGroup(groupId);
                if (app.selection.currentGroupId === groupId) {
                    app.selection.currentGroupId = null;
                }
                await app.reloadData();
                renderGroupsList(); // Re-render the admin group list
            } catch (error) {
                console.error('Error deleting group and associated data:', error);
                showMessageBox('Error', 'Failed to delete group.');
            } finally {
                showLoading(false);
            }
        };
    });
};

export const addViewStatsListeners = () => {
    document.querySelectorAll('.view-stats-btn').forEach(button => {
        button.onclick = (event) => {
            const playerId = event.currentTarget.dataset.id;
            const player = app.players[playerId];
            if (player) {
                showPlayerStatsModal(player);
            }
        };
    });
};

export const addRemovePlayerListeners = () => {
    // ... implementation from original app.js
    document.querySelectorAll('.remove-player-btn').forEach(button => {
        button.onclick = async (event) => {
            showLoading(true);
            const playerIdToRemove = event.currentTarget.dataset.id;
            try {
                await api.deletePlayer(playerIdToRemove);
                showMessageBox('Success', 'Player removed successfully.');
                await app.reloadData();
            } catch (error) {
                console.error('Error deleting player:', error);
                showMessageBox('Error', error.message || 'Failed to delete player.');
            } finally {
                showLoading(false);
            }
        };
    });
};

export const addEditPlayerListeners = () => {
    // ... implementation from original app.js
    document.querySelectorAll('.edit-player-btn').forEach(button => {
        button.onclick = (event) => {
            const playerIdToEdit = event.currentTarget.dataset.id;
            app.ui.playerBeingEdited = app.players[playerIdToEdit];
            if (app.ui.playerBeingEdited) {
                app.ui.playerBeingEdited._originalSelectedScheduleList = app.ui.playerBeingEdited.selectedScheduleList || [];
                showEditPlayerModal(app.ui.playerBeingEdited);
            }
        };
    });
};

export const addRemoveCourtListeners = () => {
    document.querySelectorAll('.remove-court-btn').forEach(button => {
        button.onclick = async (event) => {
            showLoading(true);
            const courtIdToRemove = event.currentTarget.dataset.id;
            try {
                await api.deleteCourt(courtIdToRemove);
                await app.loadCourtsForGroup();
            } catch (error) {
                console.error('Error deleting court:', error);
                showMessageBox('Error', 'Failed to delete court.');
            } finally {
                showLoading(false);
            }
        };
    });
};

export const addEditCourtListeners = () => {
    document.querySelectorAll('.edit-court-btn').forEach(button => {
        button.onclick = (event) => {
            const courtIdToEdit = event.currentTarget.dataset.id;
            app.ui.courtBeingEdited = app.courts[courtIdToEdit];
            if (app.ui.courtBeingEdited) {
                showEditCourtModal(app.ui.courtBeingEdited);
            }
        };
    });
};

export const addSwapButtonListenersForSchedule = (schedule) => {
    document.querySelectorAll('#playingPlayersContainer .action-btn, #benchPlayersContainer .action-btn').forEach(button => {
        button.onclick = (event) => {
            const playerId = event.target.dataset.playerId;
            const action = event.target.dataset.action;
            const player = app.players[playerId];
            if (player) {
                showSwapModalForSchedule(player, action, schedule);
            }
        };
    });
};

export const addNewPlayer = () => {
    const addPlayerModalOverlay = document.getElementById('addPlayerModalOverlay');
    document.body.classList.add('modal-open');
    const invitePlayerEmailInput = document.getElementById('invitePlayerEmailInput');

    addPlayerModalOverlay.classList.add('show');
    invitePlayerEmailInput.value = '';
    invitePlayerEmailInput.focus();
};