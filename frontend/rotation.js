export const getDerivedStats = (history) => {
    if (!history || history.length === 0) {
        return { playedLastTime: false, weeksPlayed: 0, weeksOnBench: 0, lastPlayed: 'Never' };
    }

    const sortedHistory = [...history].sort((a, b) => b.occurrenceNumber - a.occurrenceNumber);
    const lastEvent = sortedHistory[0];
    const playedLastTime = lastEvent.status === 'played';
    const weeksPlayed = history.filter(h => h.status === 'played').length;
    const lastPlayedDate = sortedHistory.find(h => h.status === 'played')?.date || 'Never';
    const weeksOnBench = history.filter(h => h.status === 'benched').length;

    return { playedLastTime, weeksPlayed, weeksOnBench, lastPlayed: lastPlayedDate };
};