import express from 'express';
import Schedule from '../models/scheduleModel.js';
import { protect } from '../middleware/authMiddleware.js';
import Player from '../models/playerModel.js';
import PlayerStat from '../models/playerStatModel.js';
import Group from '../models/groupModel.js';
import { isGroupAdmin } from '../utils/util.js';
import { emitToGroup } from '../socket.js';

const router = express.Router();

// @route   GET /api/schedules
// @desc    Get all schedules for the groups the user is a member of
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const playerEntries = await Player.find({ userId: req.user.id });
        const groupIds = playerEntries.map(p => p.groupId);
        const schedules = await Schedule.find({ groupId: { $in: groupIds } });
        res.json(schedules || []);
    } catch (error) {
        console.error('Error fetching schedules:', error);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route GET /api/schedules/:groupId
// @desc Get all schedules for a group
// @access private
router.get('/:groupId', protect, async (req, res) => {
    try {
        const { groupId } = req.params;
        const group = await Group.findById(groupId);
        if (!group) return res.status(404).json({ msg: 'Group not found' });
        const schedules = await Schedule.find({ groupId: group.id });
        res.json(schedules);
    } catch (error) {
        console.error(`Error fetching schedules for group ${req.params.groupId}:`, error);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   POST /api/schedules
// @desc    Create a new schedule
router.post('/', protect, async (req, res) => {
    const newScheduleData = req.body;
    try {
        const group = await Group.findById(newScheduleData.groupId);
        if (!group) return res.status(404).json({ msg: 'Group not found' });
        if (!isGroupAdmin(req.user, group)) return res.status(403).json({ msg: 'User not authorized' });

        const schedule = new Schedule(newScheduleData);
        await schedule.save();
        emitToGroup(newScheduleData.groupId.toString(), 'scheduleCreated', schedule);
        res.status(201).json(schedule);
    } catch (error) {
        console.error('Error creating schedule:', error);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   PUT /api/schedules/:id
// @desc    Update an existing schedule
router.put('/:id', protect, async (req, res) => {
    const { id: scheduleId } = req.params;
    const updatedScheduleData = req.body;
    try {
        let schedule = await Schedule.findById(scheduleId);
        if (!schedule) return res.status(404).json({ msg: 'Schedule not found' });

        const group = await Group.findById(schedule.groupId);
        if (!isGroupAdmin(req.user, group)) return res.status(403).json({ msg: 'User not authorized' });

        const oldRecurrenceCount = schedule.recurrenceCount || 0;
        const newRecurrenceCount = updatedScheduleData.recurrenceCount;
        const isOneTimeFinished = !updatedScheduleData.recurring && schedule.isRotationGenerated;
        const isRecurringFinished = updatedScheduleData.recurring && updatedScheduleData.frequency > 0 && updatedScheduleData.occurrenceNumber > schedule.recurrenceCount;

        if (isOneTimeFinished || isRecurringFinished) {
            updatedScheduleData.status = 'COMPLETED';
            updatedScheduleData.playingPlayersIds = [];
            updatedScheduleData.benchPlayersIds = [];
        } else if (schedule.status === 'COMPLETED' && newRecurrenceCount > oldRecurrenceCount) {
            updatedScheduleData.status = 'ACTIVE';
            // Regenerate the player lineup here
            const playersInGroup = await Player.find({ groupId: group.id });
            const availablePlayers = playersInGroup.filter(p => p.availability?.some(a => a.scheduleId.equals(schedule.id) && a.type !== 'Backup'));

            if (availablePlayers.length === 0) {
                updatedScheduleData.playingPlayersIds = [];
                updatedScheduleData.benchPlayersIds = [];
            } else if (availablePlayers.length <= updatedScheduleData.maxPlayersCount) {
                updatedScheduleData.playingPlayersIds = availablePlayers.map(p => p.id);
                updatedScheduleData.benchPlayersIds = [];
            } else {
                const permanentPlayers = availablePlayers.filter(p => p.availability?.find(a => a.scheduleId.equals(schedule.id))?.type === 'Permanent');
                let playingLineup = [...permanentPlayers];
                const rotationPlayers = availablePlayers.filter(p => !playingLineup.some(pl => pl._id.equals(p._id)));
                rotationPlayers.sort(() => Math.random() - 0.5);
                const needed = updatedScheduleData.maxPlayersCount - playingLineup.length;
                if (needed > 0) playingLineup.push(...rotationPlayers.slice(0, needed));
                updatedScheduleData.playingPlayersIds = playingLineup.map(p => p._id);
                updatedScheduleData.benchPlayersIds = availablePlayers.map(p => p._id).filter(id => !updatedScheduleData.playingPlayersIds.some(pId => pId.equals(id)));
            }

        }

        schedule = await Schedule.findByIdAndUpdate(scheduleId, updatedScheduleData, { new: true });
        emitToGroup(schedule.groupId.toString(), 'scheduleUpdated', schedule);
        res.status(200).json(schedule);
    } catch (error) {
        console.error('Error updating schedule:', error);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   DELETE /api/schedules/:id
// @desc    Delete a schedule
router.delete('/:id', protect, async (req, res) => {
    try {
        const schedule = await Schedule.findById(req.params.id);
        if (!schedule) return res.status(404).json({ msg: 'Schedule not found' });
        const group = await Group.findById(schedule.groupId);
        if (!isGroupAdmin(req.user, group)) return res.status(403).json({ msg: 'User not authorized' });

        await PlayerStat.deleteMany({ scheduleId: schedule.id });
        await Player.updateMany({}, { $pull: { availability: { scheduleId: schedule.id } } });
        await schedule.deleteOne();
        emitToGroup(group.id.toString(), 'scheduleDeleted', req.params.id);
        res.json({ msg: 'Schedule removed' });
    } catch (error) {
        console.error('Error deleting schedule:', error);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   GET /api/schedules/:scheduleId/signups
router.get('/:scheduleId/signups', protect, async (req, res) => {
    try {
        const schedule = await Schedule.findById(req.params.scheduleId);
        if (!schedule) return res.status(404).json({ msg: 'Schedule not found' });
        const group = await Group.findById(schedule.groupId);
        if (!isGroupAdmin(req.user, group)) return res.status(403).json({ msg: 'User not authorized' });

        const players = await Player.find({ groupId: schedule.groupId }).populate('userId', 'name');
        const signups = players.map(player => {
            const availability = player.availability.find(a => a.scheduleId.equals(schedule.id));
            return {
                playerId: player.id,
                playerName: player.userId?.name || 'Unknown',
                availabilityType: availability ? availability.type : null,
            };
        });
        res.json(signups);
    } catch (error) {
        console.error('Error fetching schedule signups:', error);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   POST /api/schedules/:scheduleId/complete-planning
router.post('/:scheduleId/complete-planning', protect, async (req, res) => {
    try {
        const schedule = await Schedule.findById(req.params.scheduleId);
        if (!schedule || schedule.status !== 'PLANNING') return res.status(400).json({ msg: 'Invalid schedule' });
        const group = await Group.findById(schedule.groupId);
        if (!isGroupAdmin(req.user, group)) return res.status(403).json({ msg: 'User not authorized' });

        const playersInGroup = await Player.find({ groupId: schedule.groupId });
        const availablePlayers = playersInGroup.filter(p => p.availability?.some(a => a.scheduleId.equals(schedule.id) && a.type !== 'Backup'));

        if (availablePlayers.length === 0) {
            schedule.playingPlayersIds = [];
            schedule.benchPlayersIds = [];
        } else if (availablePlayers.length <= schedule.maxPlayersCount) {
            schedule.playingPlayersIds = availablePlayers.map(p => p.id);
            schedule.benchPlayersIds = [];
        } else {
            const permanentPlayers = availablePlayers.filter(p => p.availability?.find(a => a.scheduleId.equals(schedule.id))?.type === 'Permanent');
            let playingLineup = [...permanentPlayers];
            const rotationPlayers = availablePlayers.filter(p => !playingLineup.some(pl => pl._id.equals(p._id)));
            rotationPlayers.sort(() => Math.random() - 0.5);
            const needed = schedule.maxPlayersCount - playingLineup.length;
            if (needed > 0) playingLineup.push(...rotationPlayers.slice(0, needed));
            schedule.playingPlayersIds = playingLineup.map(p => p._id);
            schedule.benchPlayersIds = availablePlayers.map(p => p._id).filter(id => !schedule.playingPlayersIds.some(pId => pId.equals(id)));
        }

        schedule.status = 'ACTIVE';
        schedule.isRotationGenerated = true;
        schedule.lastRotationGeneratedDate = new Date();
        schedule.lastGeneratedOccurrenceNumber = schedule.occurrenceNumber || 1;

        const updatedSchedule = await schedule.save();
        emitToGroup(schedule.groupId.toString(), 'scheduleUpdated', updatedSchedule);
        res.status(200).json(updatedSchedule);
    } catch (error) {
        console.error('Error completing planning:', error);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   PUT /api/schedules/:id/swap
router.put('/:id/swap', protect, async (req, res) => {
    const { playerInId, playerOutId } = req.body;
    try {
        let schedule = await Schedule.findById(req.params.id);
        if (!schedule) return res.status(404).json({ msg: 'Schedule not found' });

        const [playerIn, playerOut] = await Promise.all([Player.findById(playerInId), Player.findById(playerOutId)]);
        if (!playerIn || !playerOut) return res.status(404).json({ msg: 'Players not found' });

        if (!schedule.playingPlayersIds.some(id => id.equals(playerOutId))) return res.status(400).json({ msg: 'Invalid swap' });

        schedule.playingPlayersIds.pull(playerOutId);
        const playerOutAvailability = playerOut.availability.find(a => a.scheduleId.equals(schedule._id));
        if (playerOutAvailability?.type !== 'Backup') schedule.benchPlayersIds.addToSet(playerOutId);

        schedule.benchPlayersIds.pull(playerInId);
        schedule.playingPlayersIds.addToSet(playerInId);

        await schedule.save();
        emitToGroup(schedule.groupId.toString(), 'scheduleUpdated', schedule);
        res.status(200).json(schedule);
    } catch (error) {
        console.error('Error swapping players:', error);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   POST /api/schedules/:id/generate
router.post('/:scheduleId/generate', protect, async (req, res) => {
    try {
        const schedule = await Schedule.findById(req.params.scheduleId);
        if (!schedule) return res.status(404).json({ msg: 'Schedule not found' });
        const group = await Group.findById(schedule.groupId);
        if (!isGroupAdmin(req.user, group)) return res.status(403).json({ msg: 'User not authorized' });

        const today = new Date();
        const todayDate = `${today.toLocaleString('en-US', { month: 'short' })} ${today.getDate()} ${today.getFullYear()}`;

        // Helper to record stats for the CURRENT lineup
        const recordCurrentStats = async () => {
            const occurrenceToRecord = schedule.lastGeneratedOccurrenceNumber || schedule.occurrenceNumber || 1;
            for (const playerId of [...schedule.playingPlayersIds, ...schedule.benchPlayersIds]) {
                const status = schedule.playingPlayersIds.some(pId => pId.equals(playerId)) ? 'played' : 'benched';
                await PlayerStat.findOneAndUpdate(
                    { playerId: playerId, scheduleId: schedule.id },
                    { $push: { stats: { occurrenceNumber: occurrenceToRecord, status: status, date: todayDate } } },
                    { upsert: true, new: true }
                );
            }
        };

        // If rotation is already generated, we are either finishing the schedule or generating the next rotation
        if (schedule.isRotationGenerated) {
            // Case 1: Non-recurring schedule. Clicking this means "Finish Schedule".
            if (!schedule.recurring) {
                await recordCurrentStats();
                schedule.status = 'COMPLETED';
                schedule.benchPlayersIds = [];
                schedule.playingPlayersIds = [];
                const updatedSchedule = await schedule.save();
                emitToGroup(schedule.groupId.toString(), 'scheduleUpdated', updatedSchedule);
                return res.status(200).json(updatedSchedule);
            }

            // Case 2: Recurring schedule. Clicking this means "Generate NEXT Rotation" (or Finish if last).
            // We must record stats for the PREVIOUS (current) rotation first.
            await recordCurrentStats();

            // If we have reached the end of recurrences, finish the schedule
            if (schedule.frequency > 0 && schedule.occurrenceNumber >= schedule.recurrenceCount) {
                schedule.status = 'COMPLETED';
                schedule.benchPlayersIds = [];
                schedule.playingPlayersIds = [];
                const updatedSchedule = await schedule.save();
                emitToGroup(schedule.groupId.toString(), 'scheduleUpdated', updatedSchedule);
                return res.status(200).json(updatedSchedule);
            }
        }

        // --- Generate New Rotation Logic ---

        const playersInGroup = await Player.find({ groupId: schedule.groupId });
        const availablePlayers = playersInGroup.filter(p => p.availability?.some(a => a.scheduleId.equals(schedule.id) && a.type !== 'Backup'));

        if (availablePlayers.length <= schedule.maxPlayersCount) {
            schedule.playingPlayersIds = availablePlayers.map(p => p.id);
            schedule.benchPlayersIds = [];
        } else {
            // Fetch stats to determine fairness
            const playerStats = await Promise.all(availablePlayers.map(p => PlayerStat.findOne({ playerId: p.id, scheduleId: schedule.id })));
            const getDerivedStats = (history) => {
                if (!history || history.length === 0) return { playedLastTime: false, weeksOnBench: 0, weeksPlayed: 0 };
                const sorted = [...history].sort((a, b) => b.occurrenceNumber - a.occurrenceNumber);
                return {
                    playedLastTime: sorted[0]?.status === 'played',
                    weeksOnBench: history.filter(h => h.status === 'benched').length,
                    weeksPlayed: history.filter(h => h.status === 'played').length,
                };
            };

            const playersWithStats = availablePlayers.map(p => {
                const statsDoc = playerStats.find(ps => ps && ps.playerId.equals(p.id));
                return { ...p.toObject(), derivedStats: getDerivedStats(statsDoc ? statsDoc.stats : []) };
            });

            const permanentPlayers = playersWithStats.filter(p => p.availability?.find(a => a.scheduleId.equals(schedule.id))?.type === 'Permanent');
            let playingLineup = [...permanentPlayers];
            const rotationPlayers = playersWithStats.filter(p => !playingLineup.some(pl => pl._id.equals(p._id)));

            let mustPlay = rotationPlayers.filter(p => !p.derivedStats.playedLastTime);
            mustPlay.sort((a, b) => (b.derivedStats.weeksOnBench - a.derivedStats.weeksOnBench) || (a.derivedStats.weeksPlayed - b.derivedStats.weeksPlayed) || (Math.random() - 0.5));
            playingLineup.push(...mustPlay);

            if (playingLineup.length < schedule.maxPlayersCount) {
                let canPlay = rotationPlayers.filter(p => !playingLineup.some(pl => pl._id.equals(p._id)));
                canPlay.sort((a, b) => (b.derivedStats.weeksOnBench - a.derivedStats.weeksOnBench) || (a.derivedStats.weeksPlayed - b.derivedStats.weeksPlayed) || (Math.random() - 0.5));
                playingLineup.push(...canPlay);
            }

            schedule.playingPlayersIds = playingLineup.slice(0, schedule.maxPlayersCount).map(p => p._id);
            schedule.benchPlayersIds = availablePlayers.map(p => p._id).filter(id => !schedule.playingPlayersIds.some(pId => pId.equals(id)));
        }

        // Update Schedule Metadata
        if (schedule.recurring && schedule.isRotationGenerated) {
            schedule.occurrenceNumber += 1;
        }

        schedule.lastGeneratedOccurrenceNumber = schedule.occurrenceNumber;
        schedule.isRotationGenerated = true;
        schedule.lastRotationGeneratedDate = today;
        schedule.status = 'ACTIVE';

        const updatedSchedule = await schedule.save();
        emitToGroup(schedule.groupId.toString(), 'scheduleUpdated', updatedSchedule);
        res.status(200).json(updatedSchedule);
    } catch (error) {
        console.error('Error generating rotation:', error);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   GET /api/schedules/:id/rotation-button-state
router.get('/:id/rotation-button-state', protect, async (req, res) => {
    try {
        const schedule = await Schedule.findById(req.params.id);
        if (!schedule) return res.status(404).json({ msg: 'Schedule not found' });
        const group = await Group.findById(schedule.groupId);
        if (!isGroupAdmin(req.user, group)) return res.json({ visible: false });

        let buttonState = { visible: true, text: 'Generate Rotation', disabled: false };
        if (schedule.status === 'PLANNING') return res.json({ ...buttonState, visible: false, disabled: true, text: 'Finish Planning' });
        if (schedule.status === 'COMPLETED') return res.json({ ...buttonState, disabled: true, text: 'Schedule Finished' });

        if (!schedule.isRotationGenerated) {
            buttonState.text = 'Generate Rotation';
        } else {
            if (!schedule.recurring) {
                buttonState.text = 'Finish Schedule';
                buttonState.disabled = false;
                return res.json(buttonState);
            }

            const lastDate = new Date(schedule.lastRotationGeneratedDate);
            const nextAvailableDate = new Date(lastDate);
            nextAvailableDate.setHours(0, 0, 0, 0);
            const frequency = parseInt(schedule.frequency);
            switch (frequency) {
                case 1: nextAvailableDate.setDate(nextAvailableDate.getDate() + 1); break;
                case 2: nextAvailableDate.setDate(nextAvailableDate.getDate() + 7); break;
                case 3: nextAvailableDate.setDate(nextAvailableDate.getDate() + 14); break;
                case 4: nextAvailableDate.setMonth(nextAvailableDate.getMonth() + 1); break;
                default: return res.json({ ...buttonState, text: 'Rotation Generated', disabled: true });
            }
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            buttonState.disabled = today < nextAvailableDate;
            buttonState.text = buttonState.disabled ? 'Rotation Generated' : 'Generate Rotation';

            // Recurring Schedule
            if (schedule.frequency > 0 && schedule.occurrenceNumber > schedule.recurrenceCount) {
                buttonState.text = 'Finish Schedule';
                buttonState.disabled = false;
            }
        }
        res.json(buttonState);
    } catch (error) {
        console.error('Error getting rotation button state:', error);
        res.status(500).json({ msg: 'Server Error' });
    }
});

export default router;