import { describe, it, expect, vi, beforeEach } from 'vitest';
import { showLoading, showMessageBox, renderGroupsList, renderSchedulesList, renderCourtsList, renderAllPlayers } from '../ui.js';
import * as app from '../app.js';

// Mock the app module
vi.mock('../app.js', () => ({
    groups: {},
    playerGroups: {},
    schedules: {},
    courts: {},
    players: {},
    selection: {
        currentGroupId: null,
    },
    isCurrentUserAdminOfSelectedGroup: vi.fn(),
    parseJwt: vi.fn().mockReturnValue({ id: 'user1' }),
    setCurrentGroup: vi.fn(),
}));

describe('ui.js', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <div id="loadingOverlay"></div>
            <div id="groupsList"></div>
            <div id="schedulesList"></div>
            <div id="courtsList"></div>
            <div id="allPlayersGrid"></div>
            <button id="createGroupBtn"></button>
            <div id="createGroupModalOverlay"></div>
        `;
    });

    describe('showLoading', () => {
        it('should show and hide the loading overlay', () => {
            const overlay = document.getElementById('loadingOverlay');
            showLoading(true);
            expect(overlay.classList.contains('hidden')).toBe(false);
            showLoading(false);
            expect(overlay.classList.contains('hidden')).toBe(true);
        });
    });

    describe('showMessageBox', () => {
        it('should create and display a message box', () => {
            showMessageBox('Test Title', 'Test Message');
            const messageBox = document.getElementById('messageBoxOverlay');
            expect(messageBox).not.toBeNull();
            expect(messageBox.textContent).toContain('Test Title');
            expect(messageBox.textContent).toContain('Test Message');
        });
    });

    describe('renderGroupsList', () => {
        it('should render a list of groups', () => {
            app.groups = { group1: { id: 'group1', name: 'Group 1' } };
            renderGroupsList();
            const groupsList = document.getElementById('groupsList');
            expect(groupsList.children.length).toBe(2); // 1 group + 1 create button
            expect(groupsList.textContent).toContain('Group 1');
        });
    });

    describe('renderSchedulesList', () => {
        it('should render a list of schedules', () => {
            app.schedules = { schedule1: { id: 'schedule1', name: 'Schedule 1', day: 1, time: '10:00' } };
            app.selection.currentGroupId = 'group1';
            app.schedules.schedule1.groupId = 'group1';
            renderSchedulesList();
            const schedulesList = document.getElementById('schedulesList');
            expect(schedulesList.children.length).toBe(1);
            expect(schedulesList.textContent).toContain('Schedule 1');
        });
    });

    describe('renderCourtsList', () => {
        it('should render a list of courts', () => {
            app.courts = { court1: { id: 'court1', name: 'Court 1' } };
            app.selection.currentGroupId = 'group1';
            app.courts.court1.groupId = 'group1';
            renderCourtsList();
            const courtsList = document.getElementById('courtsList');
            expect(courtsList.children.length).toBe(2); // 1 court + 1 create button
            expect(courtsList.textContent).toContain('Court 1');
        });
    });

    describe('renderAllPlayers', () => {
        it('should render a grid of players', () => {
            app.players = { player1: { id: 'player1', user: { name: 'Player 1' } } };
            app.selection.currentGroupId = 'group1';
            app.players.player1.groupId = 'group1';
            renderAllPlayers();
            const allPlayersGrid = document.getElementById('allPlayersGrid');
            expect(allPlayersGrid.children.length).toBe(1);
            expect(allPlayersGrid.textContent).toContain('Player 1');
        });
    });
});
