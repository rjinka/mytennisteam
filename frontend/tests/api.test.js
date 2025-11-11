import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as api from '../api.js';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

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

const BASE_URL = 'http://localhost:3000/api';

describe('api.js', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        localStorage.setItem('token', 'test-token');
    });

    describe('swapPlayers', () => {
        it('should make a PUT request to swap players', async () => {
            const scheduleId = 'schedule1';
            const playerInId = 'player1';
            const playerOutId = 'player2';
            const responseData = { success: true };

            mockFetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(responseData),
            });

            const result = await api.swapPlayers(scheduleId, playerInId, playerOutId);

            expect(mockFetch).toHaveBeenCalledWith(
                `${BASE_URL}/schedules/${scheduleId}/swap`,
                expect.objectContaining({
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer test-token',
                    },
                    body: JSON.stringify({ playerInId, playerOutId }),
                })
            );
            expect(result).toEqual(responseData);
        });

        it('should throw an ApiError on failure', async () => {
            mockFetch.mockResolvedValue({
                ok: false,
                status: 500,
                json: () => Promise.resolve({ msg: 'Server error' }),
            });

            await expect(api.swapPlayers('s1', 'p1', 'p2')).rejects.toThrow('Server error');
        });
    });

    describe('getScheduleSignups', () => {
        it('should make a GET request to fetch schedule signups', async () => {
            const scheduleId = 'schedule1';
            const responseData = [{ playerId: 'player1', playerName: 'Player 1', availabilityType: 'Rotation' }];

            mockFetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(responseData),
            });

            const result = await api.getScheduleSignups(scheduleId);

            expect(mockFetch).toHaveBeenCalledWith(
                `${BASE_URL}/schedules/${scheduleId}/signups`,
                expect.objectContaining({ headers: expect.any(Object) })
            );
            expect(result).toEqual(responseData);
        });
    });

    describe('completeSchedulePlanning', () => {
        it('should make a POST request to complete schedule planning', async () => {
            const scheduleId = 'schedule1';
            const responseData = { success: true };

            mockFetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(responseData),
            });

            const result = await api.completeSchedulePlanning(scheduleId);

            expect(mockFetch).toHaveBeenCalledWith(
                `${BASE_URL}/schedules/${scheduleId}/complete-planning`,
                expect.objectContaining({
                    method: 'POST',
                })
            );
            expect(result).toEqual(responseData);
        });
    });

    describe('createSchedule', () => {
        it('should make a POST request to create a schedule', async () => {
            const scheduleData = { name: 'New Schedule' };
            const responseData = { id: 'schedule2', ...scheduleData };

            mockFetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(responseData),
            });

            const result = await api.createSchedule(scheduleData);

            expect(mockFetch).toHaveBeenCalledWith(
                `${BASE_URL}/schedules`,
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify(scheduleData),
                })
            );
            expect(result).toEqual(responseData);
        });
    });

    describe('getPlayerGroups', () => {
        it('should make a GET request to fetch player groups', async () => {
            const responseData = [{ id: 'group1', name: 'Group 1' }];

            mockFetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(responseData),
            });

            const result = await api.getPlayerGroups();

            expect(mockFetch).toHaveBeenCalledWith(
                `${BASE_URL}/groups/player`,
                expect.objectContaining({
                    method: 'GET',
                    headers: expect.any(Object),
                })
            );
            expect(result).toEqual(responseData);
        });
    });

    describe('updateSchedule', () => {
        it('should make a PUT request to update a schedule', async () => {
            const scheduleId = 'schedule1';
            const scheduleData = { name: 'Updated Schedule' };
            const responseData = { id: scheduleId, ...scheduleData };

            mockFetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(responseData),
            });

            const result = await api.updateSchedule(scheduleId, scheduleData);

            expect(mockFetch).toHaveBeenCalledWith(
                `${BASE_URL}/schedules/${scheduleId}`,
                expect.objectContaining({
                    method: 'PUT',
                    body: JSON.stringify(scheduleData),
                })
            );
            expect(result).toEqual(responseData);
        });
    });

    describe('generateRotation', () => {
        it('should make a POST request to generate a rotation', async () => {
            const scheduleId = 'schedule1';
            const responseData = { success: true };

            mockFetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(responseData),
            });

            const result = await api.generateRotation(scheduleId);

            expect(mockFetch).toHaveBeenCalledWith(
                `${BASE_URL}/schedules/${scheduleId}/generate`,
                expect.objectContaining({
                    method: 'POST',
                })
            );
            expect(result).toEqual(responseData);
        });
    });

    describe('getRotationButtonState', () => {
        it('should make a GET request to get the rotation button state', async () => {
            const scheduleId = 'schedule1';
            const responseData = { visible: true, text: 'Generate Rotation', disabled: false };

            mockFetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(responseData),
            });

            const result = await api.getRotationButtonState(scheduleId);

            expect(mockFetch).toHaveBeenCalledWith(
                `${BASE_URL}/schedules/${scheduleId}/rotation-button-state`,
                expect.objectContaining({ headers: expect.any(Object) })
            );
            expect(result).toEqual(responseData);
        });
    });

    describe('deleteSchedule', () => {
        it('should make a DELETE request to delete a schedule', async () => {
            const scheduleId = 'schedule1';
            const responseData = { success: true };

            mockFetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(responseData),
            });

            const result = await api.deleteSchedule(scheduleId);

            expect(mockFetch).toHaveBeenCalledWith(
                `${BASE_URL}/schedules/${scheduleId}`,
                expect.objectContaining({
                    method: 'DELETE',
                })
            );
            expect(result).toEqual(responseData);
        });
    });

    describe('createGroup', () => {
        it('should make a POST request to create a group', async () => {
            const groupData = { name: 'New Group' };
            const responseData = { id: 'group1', ...groupData };

            mockFetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(responseData),
            });

            const result = await api.createGroup(groupData);

            expect(mockFetch).toHaveBeenCalledWith(
                `${BASE_URL}/groups`,
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify(groupData),
                })
            );
            expect(result).toEqual(responseData);
        });
    });

    describe('updateGroup', () => {
        it('should make a PUT request to update a group', async () => {
            const groupId = 'group1';
            const groupData = { name: 'Updated Group' };
            const responseData = { id: groupId, ...groupData };

            mockFetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(responseData),
            });

            const result = await api.updateGroup(groupId, groupData);

            expect(mockFetch).toHaveBeenCalledWith(
                `${BASE_URL}/groups/${groupId}`,
                expect.objectContaining({
                    method: 'PUT',
                    body: JSON.stringify(groupData),
                })
            );
            expect(result).toEqual(responseData);
        });
    });

    describe('updateGroupAdmins', () => {
        it('should make a PUT request to update group admins', async () => {
            const groupId = 'group1';
            const adminUserIds = ['user1', 'user2'];
            const responseData = { success: true };

            mockFetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(responseData),
            });

            const result = await api.updateGroupAdmins(groupId, adminUserIds);

            expect(mockFetch).toHaveBeenCalledWith(
                `${BASE_URL}/groups/${groupId}/admins`,
                expect.objectContaining({
                    method: 'PUT',
                    body: JSON.stringify({ adminUserIds }),
                })
            );
            expect(result).toEqual(responseData);
        });
    });

    describe('getSchedules', () => {
        it('should make a GET request to fetch schedules for a group', async () => {
            const groupId = 'group1';
            const responseData = [{ id: 'schedule1', name: 'Schedule 1' }];

            mockFetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(responseData),
            });

            const result = await api.getSchedules(groupId);

            expect(mockFetch).toHaveBeenCalledWith(
                `${BASE_URL}/schedules/${groupId}`,
                expect.objectContaining({ headers: expect.any(Object) })
            );
            expect(result).toEqual(responseData);
        });

        it('should make a GET request to fetch all schedules if no group is provided', async () => {
            const responseData = [{ id: 'schedule1', name: 'Schedule 1' }];

            mockFetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(responseData),
            });

            const result = await api.getSchedules();

            expect(mockFetch).toHaveBeenCalledWith(
                `${BASE_URL}/schedules`,
                expect.objectContaining({ headers: expect.any(Object) })
            );
            expect(result).toEqual(responseData);
        });
    });

    describe('getScheduleStats', () => {
        it('should make a GET request to fetch schedule stats', async () => {
            const scheduleId = 'schedule1';
            const responseData = { played: 10, benched: 2 };

            mockFetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(responseData),
            });

            const result = await api.getScheduleStats(scheduleId);

            expect(mockFetch).toHaveBeenCalledWith(
                `${BASE_URL}/stats/schedule/${scheduleId}`,
                expect.objectContaining({ headers: expect.any(Object) })
            );
            expect(result).toEqual(responseData);
        });
    });

    describe('getPlayerStats', () => {
        it('should make a GET request to fetch player stats', async () => {
            const playerId = 'player1';
            const responseData = { wins: 5, losses: 3 };

            mockFetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(responseData),
            });

            const result = await api.getPlayerStats(playerId);

            expect(mockFetch).toHaveBeenCalledWith(
                `${BASE_URL}/stats/player/${playerId}`,
                expect.objectContaining({ headers: expect.any(Object) })
            );
            expect(result).toEqual(responseData);
        });
    });

    describe('createPlayerStat', () => {
        it('should make a POST request to create a player stat', async () => {
            const statData = { playerId: 'player1', wins: 1 };
            const responseData = { id: 'stat1', ...statData };

            mockFetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(responseData),
            });

            const result = await api.createPlayerStat(statData);

            expect(mockFetch).toHaveBeenCalledWith(
                `${BASE_URL}/playerstats`,
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify(statData),
                })
            );
            expect(result).toEqual(responseData);
        });
    });

    describe('updatePlayerStat', () => {
        it('should make a PUT request to update a player stat', async () => {
            const statId = 'stat1';
            const statData = { wins: 2 };
            const responseData = { id: statId, ...statData };

            mockFetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(responseData),
            });

            const result = await api.updatePlayerStat(statId, statData);

            expect(mockFetch).toHaveBeenCalledWith(
                `${BASE_URL}/playerstats/${statId}`,
                expect.objectContaining({
                    method: 'PUT',
                    body: JSON.stringify(statData),
                })
            );
            expect(result).toEqual(responseData);
        });
    });

    describe('updateCourt', () => {
        it('should make a PUT request to update a court', async () => {
            const courtId = 'court1';
            const courtData = { name: 'Updated Court' };
            const responseData = { id: courtId, ...courtData };

            mockFetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(responseData),
            });

            const result = await api.updateCourt(courtId, courtData);

            expect(mockFetch).toHaveBeenCalledWith(
                `${BASE_URL}/courts/${courtId}`,
                expect.objectContaining({
                    method: 'PUT',
                    body: JSON.stringify(courtData),
                })
            );
            expect(result).toEqual(responseData);
        });
    });

    describe('getPlayers', () => {
        it('should make a GET request to fetch players for a group', async () => {
            const groupId = 'group1';
            const responseData = [{ id: 'player1', name: 'Player 1' }];

            mockFetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(responseData),
            });

            const result = await api.getPlayers(groupId);

            expect(mockFetch).toHaveBeenCalledWith(
                `${BASE_URL}/players/${groupId}`,
                expect.objectContaining({ headers: expect.any(Object) })
            );
            expect(result).toEqual(responseData);
        });
    });

    describe('createPlayer', () => {
        it('should make a POST request to create a player', async () => {
            const playerData = { name: 'New Player' };
            const responseData = { id: 'player1', ...playerData };

            mockFetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(responseData),
            });

            const result = await api.createPlayer(playerData);

            expect(mockFetch).toHaveBeenCalledWith(
                `${BASE_URL}/players`,
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify(playerData),
                })
            );
            expect(result).toEqual(responseData);
        });
    });

    describe('updatePlayer', () => {
        it('should make a PUT request to update a player', async () => {
            const playerId = 'player1';
            const playerData = { name: 'Updated Player' };
            const responseData = { id: playerId, ...playerData };

            mockFetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(responseData),
            });

            const result = await api.updatePlayer(playerId, playerData);

            expect(mockFetch).toHaveBeenCalledWith(
                `${BASE_URL}/players/${playerId}`,
                expect.objectContaining({
                    method: 'PUT',
                    body: JSON.stringify(playerData),
                })
            );
            expect(result).toEqual(responseData);
        });
    });

    describe('deletePlayer', () => {
        it('should make a DELETE request to delete a player', async () => {
            const playerId = 'player1';
            const responseData = { success: true };

            mockFetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(responseData),
            });

            const result = await api.deletePlayer(playerId);

            expect(mockFetch).toHaveBeenCalledWith(
                `${BASE_URL}/players/${playerId}`,
                expect.objectContaining({
                    method: 'DELETE',
                })
            );
            expect(result).toEqual(responseData);
        });
    });

    describe('getCourts', () => {
        it('should make a GET request to fetch courts for a group', async () => {
            const groupId = 'group1';
            const responseData = [{ id: 'court1', name: 'Court 1' }];

            mockFetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(responseData),
            });

            const result = await api.getCourts(groupId);

            expect(mockFetch).toHaveBeenCalledWith(
                `${BASE_URL}/courts/${groupId}`,
                expect.objectContaining({ headers: expect.any(Object) })
            );
            expect(result).toEqual(responseData);
        });
    });

    describe('createCourt', () => {
        it('should make a POST request to create a court', async () => {
            const courtData = { name: 'New Court' };
            const responseData = { id: 'court1', ...courtData };

            mockFetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(responseData),
            });

            const result = await api.createCourt(courtData);

            expect(mockFetch).toHaveBeenCalledWith(
                `${BASE_URL}/courts`,
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify(courtData),
                })
            );
            expect(result).toEqual(responseData);
        });
    });

    describe('deleteCourt', () => {
        it('should make a DELETE request to delete a court', async () => {
            const courtId = 'court1';
            const responseData = { success: true };

            mockFetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(responseData),
            });

            const result = await api.deleteCourt(courtId);

            expect(mockFetch).toHaveBeenCalledWith(
                `${BASE_URL}/courts/${courtId}`,
                expect.objectContaining({
                    method: 'DELETE',
                })
            );
            expect(result).toEqual(responseData);
        });
    });

    describe('deleteGroup', () => {
        it('should make a DELETE request to delete a group', async () => {
            const groupId = 'group1';
            const responseData = { success: true };

            mockFetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(responseData),
            });

            const result = await api.deleteGroup(groupId);

            expect(mockFetch).toHaveBeenCalledWith(
                `${BASE_URL}/groups/${groupId}`,
                expect.objectContaining({
                    method: 'DELETE',
                })
            );
            expect(result).toEqual(responseData);
        });
    });

    describe('invitePlayer', () => {
        it('should make a POST request to invite a player', async () => {
            const groupId = 'group1';
            const email = 'test@example.com';
            const responseData = { success: true };

            mockFetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(responseData),
            });

            const result = await api.invitePlayer(groupId, email);

            expect(mockFetch).toHaveBeenCalledWith(
                `${BASE_URL}/groups/${groupId}/invite`,
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({ email }),
                })
            );
            expect(result).toEqual(responseData);
        });
    });

    describe('verifyInvitation', () => {
        it('should make a GET request to verify an invitation', async () => {
            const join_token = 'test-token';
            const responseData = { success: true };

            mockFetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(responseData),
            });

            const result = await api.verifyInvitation(join_token);

            expect(mockFetch).toHaveBeenCalledWith(
                `${BASE_URL}/invitations/verify/${join_token}`
            );
            expect(result).toEqual(responseData);
        });
    });

    describe('acceptInvitation', () => {
        it('should make a POST request to accept an invitation', async () => {
            const join_token = 'test-token';
            const responseData = { success: true };

            mockFetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(responseData),
            });

            const result = await api.acceptInvitation(join_token);

            expect(mockFetch).toHaveBeenCalledWith(
                `${BASE_URL}/invitations/accept/${join_token}`,
                expect.objectContaining({
                    method: 'POST',
                })
            );
            expect(result).toEqual(responseData);
        });
    });

    describe('authenticateWithGoogle', () => {
        it('should make a POST request to authenticate with Google', async () => {
            const userData = { token: 'google-token' };
            const responseData = { success: true };

            mockFetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(responseData),
            });

            const result = await api.authenticateWithGoogle(userData);

            expect(mockFetch).toHaveBeenCalledWith(
                `${BASE_URL}/auth/google`,
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify(userData),
                })
            );
            expect(result).toEqual(responseData);
        });
    });
});
