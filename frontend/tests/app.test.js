import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseJwt, handleDataUpdate, isCurrentUserAdminOfSelectedGroup, selection, groups, playerGroups } from '../app.js';
import * as modals from '../modals.js';
import * as api from '../api.js';

// Mocking modules
vi.mock('../modals.js', () => ({
  showGroupSelectionModal: vi.fn(),
}));

vi.mock('../api.js', () => ({
    getSchedules: vi.fn().mockResolvedValue([]),
    getPlayers: vi.fn().mockResolvedValue([]),
    getCourts: vi.fn().mockResolvedValue([]),
    getPlayerGroups: vi.fn().mockResolvedValue([])
}));


// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    }
  };
})();
global.localStorage = localStorageMock;
global.atob = (str) => Buffer.from(str, 'base64').toString('binary');
document.body.innerHTML = `
    <div id="currentGroupNameDisplay"></div>
    <div id="schedulesList"></div>
    <div id="playingPlayersContainer"></div>
    <div id="benchPlayersContainer"></div>
    <div id="allPlayersGrid"></div>
    <div id="courtsList"></div>
    <div id="scheduleDetailsContainer"></div>
    <div id="courtManagementTabBtn"></div>
    <div id="groupManagementTabBtn"></div>
`;


describe('app.js', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        selection.currentGroupId = null;
        selection.selectedSchedule = null;
        Object.keys(groups).forEach(key => delete groups[key]);
        Object.keys(playerGroups).forEach(key => delete playerGroups[key]);
    });

    describe('parseJwt', () => {
        it('should correctly parse a JWT token', () => {
            const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMyIsIm5hbWUiOiJUZXN0IFVzZXIiLCJpc1N1cGVyQWRtaW4iOnRydWV9.signature';
            const expectedPayload = { id: '123', name: 'Test User', isSuperAdmin: true };
            expect(parseJwt(token)).toEqual(expectedPayload);
        });
    });

    describe('handleDataUpdate', () => {
        const allGroupsData = [
            { id: 'group1', name: 'Group 1', admins: ['user1'] },
            { id: 'group2', name: 'Group 2', admins: ['user2'] }
        ];

        it('should call showGroupSelectionModal on initial load', () => {
            const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InVzZXIxIn0.signature';
            localStorage.setItem('token', token);
            handleDataUpdate({ allGroups: allGroupsData }, true);
            expect(modals.showGroupSelectionModal).toHaveBeenCalled();
        });

        it('should correctly filter admin and player groups', () => {
            const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InVzZXIxIn0.signature';
            localStorage.setItem('token', token);
            handleDataUpdate({ allGroups: allGroupsData }, false);

            expect(Object.keys(groups)).toHaveLength(1);
            expect(groups['group1']).toBeDefined();
            expect(Object.keys(playerGroups)).toHaveLength(2);
        });
    });

    describe('isCurrentUserAdminOfSelectedGroup', () => {
        it('should return false if no group is selected', () => {
            selection.currentGroupId = null;
            expect(isCurrentUserAdminOfSelectedGroup()).toBe(false);
        });

        it('should return true for a super admin', () => {
            const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InN1cGVyVXNlciIsImlzU3VwZXJBZG1pbiI6dHJ1ZX0.signature';
            localStorage.setItem('token', token);
            selection.currentGroupId = 'group1';
            expect(isCurrentUserAdminOfSelectedGroup()).toBe(true);
        });

        it('should return true for a regular admin of the selected group', () => {
            const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InVzZXIxIn0.signature';
            localStorage.setItem('token', token);
            selection.currentGroupId = 'group1';
            groups['group1'] = { id: 'group1', name: 'Group 1', admins: ['user1'] };
            expect(isCurrentUserAdminOfSelectedGroup()).toBe(true);
        });

        it('should return false if the user is not an admin of the selected group', () => {
            const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InVzZXIyIn0.signature';
            localStorage.setItem('token', token);
            selection.currentGroupId = 'group1';
            // In this scenario, the 'groups' object would not contain 'group1'
            // because the user is not an admin. The beforeEach hook clears it.
            expect(isCurrentUserAdminOfSelectedGroup()).toBe(false);
        });
    });
});
