import { describe, it, expect, vi, beforeEach } from 'vitest';
import { showGroupSelectionModal, populateScheduleCourtsDropdown, showEditScheduleModal } from '../modals.js';
import * as app from '../app.js';

// Mock the app module
vi.mock('../app.js', () => ({
    groups: {},
    courts: {},
    schedules: {},
    selection: {
        currentGroupId: null,
    },
    setCurrentGroup: vi.fn(),
    isCurrentUserAdminOfSelectedGroup: vi.fn(),
}));

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
        `;
    });

    describe('showGroupSelectionModal', () => {
        it('should show the group selection modal', () => {
            app.groups = { group1: { id: 'group1', name: 'Group 1' }, group2: { id: 'group2', name: 'Group 2' } };
            showGroupSelectionModal();
            const modal = document.getElementById('groupSelectionModalOverlay');
            expect(modal.classList.contains('show')).toBe(true);
            expect(document.getElementById('modalGroupButtonsContainer').children.length).toBe(2);
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
});
