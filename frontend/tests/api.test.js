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
                `http://localhost:3000/api/schedules/${scheduleId}/swap`,
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
                `http://localhost:3000/api/schedules`,
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
                `http://localhost:3000/api/groups/player`,
                expect.objectContaining({
                    method: 'GET',
                })
            );
            expect(result).toEqual(responseData);
        });
    });
});
