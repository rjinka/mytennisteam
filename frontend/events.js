import { showEditCourtModal, showEditPlayerModal, showPlayerStatsModal, showSwapModalForSchedule, showEditScheduleModal, showScheduleStatsModal, showScheduleSignupsModal } from './modals.js';
import * as app from './app.js';
import * as api from './api.js';
import { showMessageBox, renderGroupsList, showLoading, renderCourtsList, showScheduleDetails } from './ui.js';

const weekdayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function setupGlobalEventListeners() {
    // Tab buttons
    const playerManagementTabBtn = document.getElementById('playerManagementTabBtn');
    const scheduleManagementTabBtn = document.getElementById('scheduleManagementTabBtn');
    const groupManagementTabBtn = document.getElementById('groupManagementTabBtn');
    const courtManagementTabBtn = document.getElementById('courtManagementTabBtn');
    const playerManagementTabContent = document.getElementById('playerManagementTabContent');
    const scheduleManagementTabContent = document.getElementById('scheduleManagementTabContent');
    const groupManagementTabContent = document.getElementById('groupManagementTabContent');
    const courtManagementTabContent = document.getElementById('courtManagementTabContent');

    const allTabButtons = [groupManagementTabBtn, scheduleManagementTabBtn, courtManagementTabBtn, playerManagementTabBtn];
    const allTabContents = [playerManagementTabContent, scheduleManagementTabContent, groupManagementTabContent, courtManagementTabContent];

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
    courtManagementTabBtn.onclick = () => {
        activateTab(courtManagementTabBtn, courtManagementTabContent);
        renderCourtsList();
    };

    // Logout Button
    const logoutBtn = document.getElementById('logoutBtn');
    logoutBtn.onclick = app.logout;

    // Delete Account Button
    const deleteAccountBtn = document.getElementById('deleteAccountBtn');
    deleteAccountBtn.onclick = app.requestAccountDeletion;

    // Privacy Policy Link
    const versionDisplay = document.getElementById('version-display');
    if (versionDisplay && versionDisplay.parentNode) {
        const privacyLink = document.createElement('a');
        privacyLink.href = 'privacy.html';
        privacyLink.target = '_blank';
        privacyLink.innerHTML = '&nbsp;|&nbsp;Privacy'; // Add separator
        privacyLink.className = 'text-xs text-gray-400 hover:underline ml-4'; // Match footer style
        privacyLink.classList.remove('ml-4'); // The separator handles spacing
        versionDisplay.appendChild(privacyLink);
    }

    // Initial UI state setup
    updateCourtsTabVisibility();


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
            const [updatedGroup,] = await Promise.all([
                api.updateGroup(app.ui.groupBeingEdited.id, { name: newName }),
                api.updateGroupAdmins(app.ui.groupBeingEdited.id, newAdminUserIds)
            ]);

            // The group object from updateGroup doesn't have the new admins, so we update it manually
            app.groups.find(g => g.id === updatedGroup.id) = updatedGroup;
            app.groups.find(g => g.id === updatedGroup.id).admins = newAdminUserIds;



            document.body.classList.remove('modal-open');
            document.getElementById('editGroupModalOverlay').classList.remove('show');
            await app.setCurrentGroup(app.selection.currentGroupId, true); // Refresh UI for current group
            updateCourtsTabVisibility();
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
        const swapWithBackup = document.getElementById('swapWithBackupCheckbox').checked;
        const regularSwapPlayerId = document.getElementById('swapPlayerSelect').value;
        const backupSwapPlayerId = document.getElementById('backupPlayerSelect').value;

        const playerToSwapOut = app.ui.playerBeingSwapped;
        const playerToSwapInId = swapWithBackup ? backupSwapPlayerId : regularSwapPlayerId;

        if (!playerToSwapOut || !playerToSwapInId) {
            showMessageBox("Error", "Please select a player to swap with.");
            return;
        }

        // Determine who is "in" and who is "out" based on the initial action
        // 'moveToBench' means the clicked player (playerToSwapOut) is currently playing and will be moved OUT.
        const playerOutId = app.ui.swapActionDirection === 'moveToBench' ? playerToSwapOut.id : playerToSwapInId;
        const playerInId = app.ui.swapActionDirection === 'moveToBench' ? playerToSwapInId : playerToSwapOut.id;

        showLoading(true);
        try {
            // Call the new API endpoint for swapping players
            const updatedSchedule = await api.swapPlayers(app.selection.selectedSchedule.id, playerInId, playerOutId);
            app.schedules[updatedSchedule.id] = updatedSchedule; // Update local data
            app.selection.selectedSchedule = updatedSchedule; // Keep the current schedule selected
            document.body.classList.remove('modal-open');
            document.getElementById('swapModalOverlay').classList.remove('show');
            // After a successful swap, just re-render the details for the updated schedule
            showScheduleDetails(updatedSchedule);
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
            if (app.selection.selectedSchedule.status === 'COMPLETED') {
                showMessageBox("Schedule Finished", "This schedule has completed its cycle and no more rotations can be generated.");
                return;
            }

            // Call the new backend endpoint
            const updatedSchedule = await api.generateRotation(app.selection.selectedSchedule.id);

            // Update local state with the result from the backend
            app.schedules[updatedSchedule.id] = updatedSchedule;
            app.selection.selectedSchedule = updatedSchedule;
            showScheduleDetails(updatedSchedule);
        } catch (error) {
            console.error('Error generating rotation:', error);
            showMessageBox('Error', error.message || 'Failed to generate rotation.');
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

    // Schedule Signups Modal
    document.getElementById('closeScheduleSignupsBtn').onclick = () => {
        document.body.classList.remove('modal-open');
        document.getElementById('scheduleSignupsModalOverlay').classList.remove('show');
    };
    document.getElementById('completePlanningBtn').onclick = async () => {
        if (!app.selection.selectedSchedule) return;
        showLoading(true);
        try {
            await api.completeSchedulePlanning(app.selection.selectedSchedule.id);
            showMessageBox('Success', 'Planning completed successfully.');
            document.body.classList.remove('modal-open');
            document.getElementById('scheduleSignupsModalOverlay').classList.remove('show');
            await app.reloadData();
        } catch (error) {
            console.error('Error completing planning:', error);
            showMessageBox('Error', 'Failed to complete planning.');
        } finally {
            showLoading(false);
        }
    };
    document.getElementById('deleteScheduleFromSignupsBtn').onclick = async () => {
        if (!app.selection.selectedSchedule) return;
        if (confirm('Are you sure you want to delete this schedule?')) {
            showLoading(true);
            try {
                await api.deleteSchedule(app.selection.selectedSchedule.id);
                showMessageBox('Success', 'Schedule deleted successfully.');
                document.body.classList.remove('modal-open');
                document.getElementById('scheduleSignupsModalOverlay').classList.remove('show');
                await app.reloadData();
            } catch (error) {
                console.error('Error deleting schedule:', error);
                showMessageBox('Error', 'Failed to delete schedule.');
            } finally {
                showLoading(false);
            }
        }
    };

    // Contact Support Modal
    document.getElementById('contactSupportBtn').onclick = () => {
        document.getElementById('contactSupportModalOverlay').classList.add('show');
        document.body.classList.add('modal-open');
    };

    document.getElementById('closeContactSupportModal').onclick = () => {
        document.getElementById('contactSupportModalOverlay').classList.remove('show');
        document.body.classList.remove('modal-open');
    };

    document.getElementById('submitSupportRequestBtn').onclick = app.submitSupportRequest;

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
            } else if (action === 'view-signups') {
                showScheduleSignupsModal(schedule);
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
            app.ui.groupBeingEdited = app.groups.find(g => g.id === groupId);
            if (app.ui.groupBeingEdited) {
                document.getElementById('editGroupNameInput').value = app.ui.groupBeingEdited.name;

                const groupAdminsList = document.getElementById('groupAdminsList');
                groupAdminsList.innerHTML = '';
                const groupPlayers = Object.values(app.players).filter(p => p.groupId === groupId);
                const currentAdmins = app.ui.groupBeingEdited.admins || [];
                const user = JSON.parse(localStorage.getItem('user'));
                const currentUserId = user ? user.id : null;

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

export const addShareGroupListeners = () => {
    document.querySelectorAll('.share-group-btn').forEach(button => {
        button.onclick = (event) => {
            const groupId = event.currentTarget.dataset.id;
            const joinUrl = `${window.location.origin}/?groupId=${groupId}`;

            // A simple modal to show the link and a copy button
            const modalHtml = `
                <div class="flex flex-col gap-4">
                    <p class="text-gray-700">Share this link with others to let them join the group:</p>
                    <input type="text" readonly value="${joinUrl}" class="input-field bg-gray-100" id="groupJoinLinkInput">
                    <button id="copyGroupLinkBtn" class="btn btn-secondary">Copy Link</button>
                </div>
            `;
            showMessageBox('Share Group', modalHtml);
            document.getElementById('copyGroupLinkBtn').onclick = () => app.copyToClipboard(joinUrl, 'Link copied to clipboard!');
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
                updateCourtsTabVisibility();
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

export const updateCourtsTabVisibility = () => {
    const courtManagementTabBtn = document.getElementById('courtManagementTabBtn');
    if (courtManagementTabBtn) {
        courtManagementTabBtn.style.display = Object.keys(app.groups).length > 0 ? '' : 'none';
    }
};