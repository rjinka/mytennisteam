import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api } from './index';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

const BASE_URL = 'http://localhost:3000/api';

describe('api index', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockFetch.mockClear();
    });

    describe('swapPlayers', () => {
        it('should make a PUT request to swap players', async () => {
            const scheduleId = 'schedule1';
            const playerInId = 'player1';
            const playerOutId = 'player2';
            const responseData = { id: scheduleId, name: 'Test Schedule' };

            mockFetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(responseData),
            });

            const result = await api.swapPlayers(scheduleId, playerInId, playerOutId);

            expect(mockFetch).toHaveBeenCalledWith(
                `${BASE_URL}/schedules/${scheduleId}/swap`,
                expect.objectContaining({
                    method: 'PUT',
                    body: JSON.stringify({ playerInId, playerOutId }),
                    credentials: 'include',
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
                expect.objectContaining({
                    credentials: 'include',
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
                    credentials: 'include',
                })
            );
            expect(result).toEqual(responseData);
        });
    });
});
