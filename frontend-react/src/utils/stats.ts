import type { PlayerStatEntry } from '../types';

export const calculateStats = (stats: PlayerStatEntry[]) => {
    const playedCount = stats.filter((s) => s.status === 'played').length;
    const benchedCount = stats.filter((s) => s.status === 'benched').length;
    const total = playedCount + benchedCount;
    const playPercentage = total > 0 ? Math.round((playedCount / total) * 100) : 0;

    return {
        playedCount,
        benchedCount,
        total,
        playPercentage,
    };
};

export const getDerivedStats = (history: PlayerStatEntry[]) => {
    if (!history || history.length === 0) {
        return {
            playedLastTime: false,
            weeksPlayed: 0,
            weeksOnBench: 0,
            lastPlayed: 'Never',
        };
    }

    const playedLastTime = history[history.length - 1].status === 'played';
    const weeksPlayed = history.filter((h) => h.status === 'played').length;
    const weeksOnBench = history.filter((h) => h.status === 'benched').length;
    const lastPlayed = history.filter((h) => h.status === 'played').pop()?.date || 'Never';

    return {
        playedLastTime,
        weeksPlayed,
        weeksOnBench,
        lastPlayed,
    };
};
