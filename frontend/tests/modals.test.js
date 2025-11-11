import { describe, it, expect, vi, beforeEach } from 'vitest';
import { showGroupSelectionModal, populateScheduleCourtsDropdown, showEditScheduleModal, showScheduleSignupsModal } from '../modals.js';
import * as app from '../app.js';
import * as api from '../api.js';

// Mock the app module
vi.mock('../app.js', () => ({
    groups: {},
    playerGroups: {},
    courts: {},
    schedules: {},
    selection: {
        currentGroupId: null,
    },
    setCurrentGroup: vi.fn(),
}));

vi.mock('../api.js', () => ({
    getScheduleSignups: vi.fn(),
}));

import { showEditPlayerModal } from '../modals.js';

describe('modals.js', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <div id="groupSelectionModalOverlay">
                <div id="modalGroupButtonsContainer"></div>
            </div>
            <div id="createScheduleCourtsInput"></div>
            <div id="editScheduleModalOverlay">
                <input id="editScheduleNameInput" />
                <input id="editScheduleDayInput" />
                <input id="editScheduleTimeInput" />
                <input id="editScheduleDurationInput" />
                <input id="editIsRecurring" type="checkbox" />
                <div id="editScheduleRecurrenceOptions"></div>
                <div id="editScheduleRecurrenceCountContainer"></div>
                <input id="editScheduleRecurrenceCountInput" />
                <select id="editScheduleFrequencySelect"></select>
                <div id="editScheduleCourtsInput"></div>
            </div>
            <div id="editPlayerModalOverlay">
                <input id="editPlayerNameInput" />
                <div id="modifyAvailableSchedulesList"></div>
                <button id="savePlayerChangesBtn"></button>
            </div>
            <div id="scheduleSignupsModalOverlay">
                <div id="scheduleSignupsContainer"></div>
            </div>
            <div id="loadingOverlay"></div>
        `;
    });

    describe('showGroupSelectionModal', () => {
        it('should show the group selection modal', () => {
            app.groups = { group1: { id: 'group1', name: 'Group 1' } };
            app.playerGroups = { group2: { id: 'group2', name: 'Group 2' } };
            showGroupSelectionModal();
            const modal = document.getElementById('groupSelectionModalOverlay');
            expect(modal.classList.contains('show')).toBe(true);
        });
    });

    describe('populateScheduleCourtsDropdown', () => {
        it('should populate the courts dropdown', () => {
            app.courts = { court1: { id: 'court1', name: 'Court 1' } };
            populateScheduleCourtsDropdown();
            const dropdown = document.getElementById('createScheduleCourtsInput');
            expect(dropdown.children.length).toBe(1);
            expect(dropdown.textContent).toContain('Court 1');
        });
    });

    describe('showEditScheduleModal', () => {
        it('should show the edit schedule modal and populate it with data', () => {
            const schedule = {
                id: 'schedule1',
                name: 'Test Schedule',
                day: 1,
                time: '10:00',
                duration: 60,
                recurring: true,
                frequency: 2,
                recurrenceCount: 8,
                courts: [],
            };
            showEditScheduleModal(schedule);
            const modal = document.getElementById('editScheduleModalOverlay');
            expect(modal.classList.contains('show')).toBe(true);
            expect(document.getElementById('editScheduleNameInput').value).toBe('Test Schedule');
        });
    });

    describe('showEditPlayerModal', () => {
        it('should disable schedule selection for non-planning schedules', () => {
            app.schedules = {
                schedule1: { id: 'schedule1', name: 'Planning Schedule', day: 1, time: '10:00', status: 'PLANNING' },
                schedule2: { id: 'schedule2', name: 'Active Schedule', day: 2, time: '12:00', status: 'ACTIVE' },
            };
            const player = { user: { name: 'Test Player' }, availability: [] };

            showEditPlayerModal(player);

            const scheduleCheckboxes = document.querySelectorAll('.schedule-checkbox');
            const planningCheckbox = scheduleCheckboxes[0];
            const activeCheckbox = scheduleCheckboxes[1];

            expect(planningCheckbox.disabled).toBe(false);
            expect(activeCheckbox.disabled).toBe(true);
        });
    });

    describe('showScheduleSignupsModal', () => {
        it('should show the signups modal and populate it with data', async () => {
            const schedule = { id: 'schedule1' };
            const signups = [{ playerName: 'Player 1', availabilityType: 'Rotation' }];
            api.getScheduleSignups.mockResolvedValue(signups);

            await showScheduleSignupsModal(schedule);

            const modal = document.getElementById('scheduleSignupsModalOverlay');
            expect(modal.classList.contains('show')).toBe(true);
            const container = document.getElementById('scheduleSignupsContainer');
            expect(container.textContent).toContain('Player 1');
            expect(container.textContent).toContain('Rotation');
        });
    });
});
