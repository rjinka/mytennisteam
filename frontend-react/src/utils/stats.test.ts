import { describe, it, expect } from 'vitest';
import { calculateStats, getDerivedStats } from './stats';
import type { PlayerStatEntry } from '../types';

describe('stats utility', () => {
    describe('calculateStats', () => {
        it('should correctly calculate counts and percentage', () => {
            const stats: PlayerStatEntry[] = [
                { occurrenceNumber: 1, status: 'played', date: '2025-01-01' },
                { occurrenceNumber: 2, status: 'benched', date: '2025-01-08' },
                { occurrenceNumber: 3, status: 'played', date: '2025-01-15' },
            ];
            const result = calculateStats(stats);
            expect(result).toEqual({
                playedCount: 2,
                benchedCount: 1,
                total: 3,
                playPercentage: 67,
            });
        });

        it('should return 0 for empty stats', () => {
            const result = calculateStats([]);
            expect(result).toEqual({
                playedCount: 0,
                benchedCount: 0,
                total: 0,
                playPercentage: 0,
            });
        });
    });

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
            const history: PlayerStatEntry[] = [
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
