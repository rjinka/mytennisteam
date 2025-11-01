import { players } from './app.js';
import { showLoading } from './ui.js';
import * as api from './api.js';

export const getDerivedStats = (history) => {
    if (!history || history.length === 0) {
        return { playedLastTime: false, weeksPlayed: 0, weeksOnBench: 0, lastPlayed: 'Never' };
    }

    const sortedHistory = [...history].sort((a, b) => b.week - a.week);
    const lastEvent = sortedHistory[0];
    const playedLastTime = lastEvent.status === 'played';
    const weeksPlayed = history.filter(h => h.status === 'played').length;
    const lastPlayedDate = sortedHistory.find(h => h.status === 'played')?.date || 'Never';
    const weeksOnBench = history.filter(h => h.status === 'benched').length;

    return { playedLastTime, weeksPlayed, weeksOnBench, lastPlayed: lastPlayedDate };
};

export const generateRotationForSchedule = (schedule, playerStats, newPlayerIdToPrioritize = null) => {
    if (typeof schedule.maxPlayersCount === 'undefined') {
        schedule.maxPlayersCount = parseInt(schedule.gameType) === 0 ? 2 * schedule.courts.length : 4 * schedule.courts.length;
    }

    const maxPlayers = schedule.maxPlayersCount;
    if (!maxPlayers && maxPlayers !== 0) {
        console.error("Schedule is missing maxPlayersCount.");
        return;
    }

    // Filter for players who are NOT 'Backup' for this schedule
    const availablePlayersForSchedule = Object.values(players).filter(p =>
        p.availability?.some(a => a.scheduleId === schedule.id && a.type !== 'Backup')
    );

    if (availablePlayersForSchedule.length <= maxPlayers) {
        schedule.playingPlayersIds = availablePlayersForSchedule.map(p => p.id);
        schedule.benchPlayersIds = [];
        return;
    }

    // Prioritize 'Permanent' players - they are always in the lineup
    const permanentPlayers = availablePlayersForSchedule.filter(p =>
        p.availability?.find(a => a.scheduleId === schedule.id)?.type === 'Permanent'
    );

    let playingLineup = [];
    const scheduleId = schedule.id;

    availablePlayersForSchedule.forEach(p => {
        const statsData = playerStats.find(ps => ps.playerId === p.id);
        p.scheduleStats = { [scheduleId]: { derived: getDerivedStats(statsData ? statsData.stats : []) } };
    });

    // Add all permanent players to the lineup first
    playingLineup.push(...permanentPlayers);

    if (newPlayerIdToPrioritize) {
        const newPlayer = availablePlayersForSchedule.find(p => p.id === newPlayerIdToPrioritize);
        // Ensure the new player is not already in the lineup (e.g., if they are permanent)
        if (newPlayer && !playingLineup.some(p => p.id === newPlayer.id) && playingLineup.length < maxPlayers) {
            playingLineup.push(newPlayer);
        }
    }

    const rotationPlayers = availablePlayersForSchedule.filter(p => !playingLineup.some(pl => pl.id === p.id));
    let mustPlayPlayers = rotationPlayers.filter(p => !p.scheduleStats[scheduleId].derived.playedLastTime);

    mustPlayPlayers.sort((a, b) => {
        const aStats = a.scheduleStats[scheduleId].derived;
        const bStats = b.scheduleStats[scheduleId].derived;
        if (bStats.weeksOnBench !== aStats.weeksOnBench) return bStats.weeksOnBench - aStats.weeksOnBench;
        if (aStats.weeksPlayed !== bStats.weeksPlayed) return aStats.weeksPlayed - bStats.weeksPlayed;
        return Math.random() - 0.5;
    });

    for (const player of mustPlayPlayers) {
        if (playingLineup.length < maxPlayers) {
            playingLineup.push(player);
        } else {
            break;
        }
    }

    // Get remaining players who are not yet in the lineup
    const remainingRotationPlayers = rotationPlayers.filter(p => !playingLineup.some(pl => pl.id === p.id));
    let eligiblePlayers = remainingRotationPlayers.filter(p => p.scheduleStats[scheduleId].derived.playedLastTime);

    const numPlayersNeededFromEligible = Math.max(0, maxPlayers - playingLineup.length);
    if (numPlayersNeededFromEligible > 0) {
        eligiblePlayers.sort((a, b) => {
            const aStats = a.scheduleStats[scheduleId].derived;
            const bStats = b.scheduleStats[scheduleId].derived;
            if (bStats.weeksOnBench !== aStats.weeksOnBench) return bStats.weeksOnBench - aStats.weeksOnBench;
            if (aStats.weeksPlayed !== bStats.weeksPlayed) return aStats.weeksPlayed - bStats.weeksPlayed;
            return Math.random() - 0.5;
        });
        const selectedEligible = eligiblePlayers.slice(0, numPlayersNeededFromEligible);
        playingLineup.push(...selectedEligible);
    }

    schedule.playingPlayersIds = playingLineup.slice(0, maxPlayers).map(p => p.id);
    schedule.benchPlayersIds = availablePlayersForSchedule.filter(p => !schedule.playingPlayersIds.includes(p.id)).map(p => p.id);
};

export const finalizeAndSaveRotation = async (schedule) => {
    if (!schedule) return;
    showLoading(true);

    const scheduleId = schedule.id;
    const today = new Date();
    const todayDate = `${today.toLocaleString('en-US', { month: 'short' })} ${today.getDate()} ${today.getFullYear()}`;
    const currentWeek = schedule.week || 1;

    const playerStats = await Promise.all(Object.values(players).map(async (player) => {
        if (player.availability?.some(a => a.scheduleId === scheduleId)) {
            let playerStat = await api.getPlayerStats(player.id, scheduleId);
            if (!playerStat || !playerStat.id) { // Check if stats exist, if not, create them
                playerStat = await api.createPlayerStat({ playerId: player.id, scheduleId, stats: [] });
            }

            const history = playerStat.stats;
            if (history.find(h => h.week === currentWeek)) return;
            const status = schedule.playingPlayersIds.includes(player.id) ? 'played' : 'benched';
            history.push({ week: currentWeek, status: status, date: todayDate }); // Ensure date is saved

            await api.updatePlayerStat(playerStat.id, { stats: history });
        }
    }));

    showLoading(false);
};