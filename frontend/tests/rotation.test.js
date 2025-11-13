import { describe, it, expect } from 'vitest';
import { getDerivedStats } from '../rotation.js';

describe('rotation.js', () => {
    describe('getDerivedStats', () => {
        it('should return default stats for empty history', () => {
            const stats = getDerivedStats([]);
            expect(stats).toEqual({
                playedLastTime: false,
                weeksPlayed: 0,
                weeksOnBench: 0,
                lastPlayed: 'Never',
            });
        });

        it('should correctly calculate stats from history', () => {
            const history = [
                { occurrenceNumber: 1, status: 'played', date: '2025-01-01' },
                { occurrenceNumber: 2, status: 'benched', date: '2025-01-08' },
                { occurrenceNumber: 3, status: 'played', date: '2025-01-15' },
            ];
            const stats = getDerivedStats(history);
            expect(stats).toEqual({
                playedLastTime: true,
                weeksPlayed: 2,
                weeksOnBench: 1,
                lastPlayed: '2025-01-15',
            });
        });
    });
});
