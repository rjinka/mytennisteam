import express from 'express';
import Schedule from '../models/scheduleModel.js';
import { protect } from '../middleware/authMiddleware.js';
import Player from '../models/playerModel.js';
import PlayerStat from '../models/playerStatModel.js';
import { v4 as uuidv4 } from 'uuid';
import Group from '../models/groupModel.js';

const router = express.Router();

// @route   GET /api/schedules
// @desc    Get all schedules for the groups the user is a member of
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        // 1. Find all groups the user is a player in.
        const playerEntries = await Player.find({ userId: req.user.id });
        const groupIds = playerEntries.map(p => p.groupId);

        // 2. Find all schedules that belong to those groups.
        const schedules = await Schedule.find({ groupId: { $in: groupIds } });

        if (!schedules) {
            return res.json([]);
        }
        res.json(schedules);
    } catch (error) {
        console.error('Error fetching schedules:', error);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route GET /api/schedules/:groupId
// @desc Get all schedules for a group
// @access private
router.get('/:groupId', protect, async( req, res) => {
    try {
        const { groupId } = req.params;
        
        // Authorization check: User must be a member of the group to view its courts.
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ msg: 'Group not found' });
        }

        const schdeules = await Schedule.find({ groupId: group.id });
        res.json(schdeules);
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
        // Authorization check: Only group admins can create a schedule
        const group = await Group.findById(newScheduleData.groupId);
        if (!group) {
            return res.status(404).json({ msg: 'Group not found' });
        }

        if (!req.user.isSuperAdmin && !group.admins.some(adminId => adminId.equals(req.user._id))) {
            return res.status(403).json({ msg: 'User not authorized to create a schedule for this group' });
        }

        const schedule = new Schedule(newScheduleData);
        await schedule.save();
        res.status(201).json(newScheduleData); // Return the newly created schedule
    } catch (error) {
        console.error('Error creating schedule:', error);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   PUT /api/schedules/:id
// @desc    Update an existing schedule
// @access  Public
router.put('/:id', protect, async (req, res) => {
    const { id: scheduleId } = req.params;
    const updatedScheduleData = req.body;

    try {
        // The 'name' field will be in updatedScheduleData
        let schedule = await Schedule.findById(scheduleId);
        if (!schedule) {
            return res.status(404).json({ msg: 'Schedule not found' });
        }

        // Authorization check: Only group admins can edit
        const group = await Group.findById(schedule.groupId);
        if (!req.user.isSuperAdmin && !group.admins.some(adminId => adminId.equals(req.user._id))) {
            return res.status(403).json({ msg: 'User not authorized to edit this schedule' });
        }

        // --- Handle isCompleted logic ---
        const oldRecurrenceCount = schedule.recurrenceCount || 0;
        const newRecurrenceCount = updatedScheduleData.recurrenceCount;

        // Check if the schedule is now completed
        const isOneTimeFinished = !updatedScheduleData.recurring && updatedScheduleData.isRotationGenerated;
        const isRecurringFinished = updatedScheduleData.recurring && updatedScheduleData.frequency > 0 && updatedScheduleData.week > updatedScheduleData.recurrenceCount;

        if (isOneTimeFinished || isRecurringFinished) {
            updatedScheduleData.isCompleted = true;
        }
        // If user extends a completed schedule, re-activate it
        else if (schedule.isCompleted && newRecurrenceCount > oldRecurrenceCount) {
            updatedScheduleData.isCompleted = false;
        }

        // Merge the existing schedule with the updated data
        schedule = await Schedule.findByIdAndUpdate(scheduleId, updatedScheduleData, { new: true });

        res.status(200).json(schedule);
    } catch (error) {
        console.error('Error updating schedule:', error);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   DELETE /api/schedules/:id
// @desc    Delete a schedule
// @access  Public
router.delete('/:id', protect, async (req, res) => {
    try {
        const schedule = await Schedule.findById(req.params.id);
        if (!schedule) {
            return res.status(404).json({ msg: 'Schedule not found' });
        }
        // Authorization check: Only group admins can delete
        const group = await Group.findById(schedule.groupId);
        if (!req.user.isSuperAdmin && !group.admins.some(adminId => adminId.equals(req.user._id))) {
            return res.status(403).json({ msg: 'User not authorized to delete this schedule' });
        }

        // 1. Delete all PlayerStat documents associated with this schedule
        await PlayerStat.deleteMany({ scheduleId: schedule.id });

        // 2. Remove the scheduleId from all players' selectedScheduleList
        await Player.updateMany({}, {
            $pull: { availability: { scheduleId: schedule.id } }
        });
        await schedule.deleteOne();
        res.json({ msg: 'Schedule removed' });
    } catch (error) {
        console.error('Error deleting schedule:', error);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   PUT /api/schedules/:id/swap
// @desc    Swap players between playing and bench for a specific schedule
router.put('/:id/swap', protect, async (req, res) => {
    const scheduleId = req.params.id; // This 'id' comes from the URL parameter
    const { playerInId, playerOutId } = req.body;

    try {
        let schedule = await Schedule.findById(scheduleId);
        if (!schedule) {
            return res.status(404).json({ msg: 'Schedule not found' });
        }
        
        const player1 = await Player.findById(playerInId);
        const player2 = await Player.findById(playerOutId)

        if (!player1 || !player2) {
            return res.status(404).json({ msg: 'One or both players not found.' });
        }

        const p1Availability = player1.availability.find(a => a.scheduleId.equals(scheduleId))?.type;
        const p2Availability = player2.availability.find(a => a.scheduleId.equals(scheduleId))?.type;

        const p1IsPlaying = schedule.playingPlayersIds.some(id => id.equals(playerInId));
        const p1IsBenched = schedule.benchPlayersIds.some(id => id.equals(playerInId));
        const p2IsPlaying = schedule.playingPlayersIds.some(id => id.equals(playerOutId));
        const p2IsBenched = schedule.benchPlayersIds.some(id => id.equals(playerOutId));

        // Case 1: Standard swap between a playing and a benched player
        if ((p1IsPlaying && p2IsBenched) || (p1IsBenched && p2IsPlaying)) {
            schedule.playingPlayersIds = schedule.playingPlayersIds.map(id => (id.toString() === playerInId ? playerOutId : (id.toString() === playerOutId ? playerInId : id)));
            schedule.benchPlayersIds = schedule.benchPlayersIds.map(id => (id.toString() === playerInId ? playerOutId : (id.toString() === playerOutId ? playerInId : id)));
        }
        // Case 2: A backup player (p2) is swapping in for a playing player (p1)
        else if (p1IsPlaying && p2Availability === 'Backup') {
            // Move p1 to bench, move p2 to playing
            schedule.playingPlayersIds = schedule.playingPlayersIds.filter(id => id.toString() !== playerInId);
            schedule.playingPlayersIds.push(playerOutId);
            schedule.benchPlayersIds.push(playerInId);
        }
        // Case 3: A backup player (p1) is swapping in for a playing player (p2)
        else if (p2IsPlaying && p1Availability === 'Backup') {
            // Move p2 to bench, move p1 to playing
            schedule.playingPlayersIds = schedule.playingPlayersIds.filter(id => id.toString() !== playerOutId);
            schedule.playingPlayersIds.push(playerInId);
            schedule.benchPlayersIds.push(playerOutId);
        }
        else {
            return res.status(400).json({ msg: 'Invalid swap. Players are not in swappable positions (e.g., both playing, both benched, or invalid backup swap).' });
        }

        await schedule.save();
        res.status(200).json(schedule); // Return the updated schedule
    } catch (error) {
        console.error('Error swapping players:', error);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   POST /api/schedules/:id/generate
// @desc    Generates the player rotation for the next week/occurrence of a schedule
// @access  Private (Admin only)
router.post('/:scheduleId/generate', protect, async (req, res) => {
    try {
        const schedule = await Schedule.findById(req.params.scheduleId);
        if (!schedule) {
            return res.status(404).json({ msg: 'Schedule not found' });
        }

        // Authorization check
        const group = await Group.findById(schedule.groupId);

        if (!req.user.isSuperAdmin && !group.admins.some(adminId => adminId.equals(req.user._id))) {
            return res.status(403).json({ msg: 'User not authorized to generate rotation for this schedule' });
        }

        // --- Rotation Generation Logic ---
        const playersInGroup = await Player.find({ groupid: schedule.groupid });
        const availablePlayers = playersInGroup.filter(p =>
            p.availability?.some(a => a.scheduleId.equals(schedule.id) && a.type !== 'Backup')
        );

        if (availablePlayers.length <= schedule.maxPlayersCount) {
            schedule.playingPlayersIds = availablePlayers.map(p => p.id);
            schedule.benchPlayersIds = [];
        } else {
            const playerStats = await Promise.all(
                availablePlayers.map(p => PlayerStat.findOne({ playerId: p.id, scheduleId: schedule.id }))
            );

            const getDerivedStats = (history) => {
                if (!history || history.length === 0) return { playedLastTime: false, weeksOnBench: 0, weeksPlayed: 0 };
                const sorted = [...history].sort((a, b) => b.week - a.week);
                return {
                    playedLastTime: sorted[0]?.status === 'played',
                    weeksOnBench: history.filter(h => h.status === 'benched').length,
                    weeksPlayed: history.filter(h => h.status === 'played').length,
                };
            };

            const playersWithStats = availablePlayers.map(p => {
                const statsDoc = playerStats.find(ps => ps && ps.playerId.equals(p.id));
                return {
                    ...p.toObject(),
                    derivedStats: getDerivedStats(statsDoc ? statsDoc.stats : [])
                };
            });

            const permanentPlayers = playersWithStats.filter(p =>
                p.availability?.find(a => a.scheduleId.equals(schedule.id))?.type === 'Permanent'
            );

            let playingLineup = [...permanentPlayers];
            const rotationPlayers = playersWithStats.filter(p => !playingLineup.some(pl => pl._id.equals(p._id)));

            // Prioritize players who didn't play last time
            let mustPlay = rotationPlayers.filter(p => !p.derivedStats.playedLastTime);
            mustPlay.sort((a, b) => {
                if (b.derivedStats.weeksOnBench !== a.derivedStats.weeksOnBench) return b.derivedStats.weeksOnBench - a.derivedStats.weeksOnBench;
                if (a.derivedStats.weeksPlayed !== b.derivedStats.weeksPlayed) return a.derivedStats.weeksPlayed - b.derivedStats.weeksPlayed;
                return Math.random() - 0.5;
            });

            playingLineup.push(...mustPlay);

            // Fill remaining spots
            if (playingLineup.length < schedule.maxPlayersCount) {
                let canPlay = rotationPlayers.filter(p => !playingLineup.some(pl => pl._id.equals(p._id)));
                canPlay.sort((a, b) => {
                    if (b.derivedStats.weeksOnBench !== a.derivedStats.weeksOnBench) return b.derivedStats.weeksOnBench - a.derivedStats.weeksOnBench;
                    if (a.derivedStats.weeksPlayed !== b.derivedStats.weeksPlayed) return a.derivedStats.weeksPlayed - b.derivedStats.weeksPlayed;
                    return Math.random() - 0.5;
                });
                playingLineup.push(...canPlay);
            }

            schedule.playingPlayersIds = playingLineup.slice(0, schedule.maxPlayersCount).map(p => p._id);
            schedule.benchPlayersIds = availablePlayers.map(p => p._id).filter(id => !schedule.playingPlayersIds.some(pId => pId.equals(id)));
        }

        // --- Finalize Stats and Update Schedule State ---
        const today = new Date();
        const todayDate = `${today.toLocaleString('en-US', { month: 'short' })} ${today.getDate()} ${today.getFullYear()}`;
        const currentWeek = schedule.week || 1;

        const allPlayersForStatUpdate = [...schedule.playingPlayersIds, ...schedule.benchPlayersIds];

        for (const playerId of allPlayersForStatUpdate) {
            const status = schedule.playingPlayersIds.some(pId => pId.equals(playerId)) ? 'played' : 'benched';
            await PlayerStat.findOneAndUpdate(
                { playerId: playerId, scheduleId: schedule.id },
                {
                    $push: { stats: { week: currentWeek, status: status, date: todayDate } }
                },
                { upsert: true, new: true }
            );
        }

        // Update schedule state
        schedule.lastGeneratedWeek = currentWeek;
        schedule.isRotationGenerated = true;
        schedule.lastRotationGeneratedDate = today;


        if (schedule.recurring) {
            schedule.week += 1;
            if (schedule.frequency > 0 && schedule.week > schedule.recurrenceCount) {
                schedule.isCompleted = true;
            }
        } else {
            schedule.isCompleted = true; // One-time schedules are completed after one generation
        }

        const updatedSchedule = await schedule.save();
        res.status(200).json(updatedSchedule);

    } catch (error) {
        console.error('Error generating rotation:', error);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   GET /api/schedules/:id/rotation-button-state
// @desc    Get the display state for the generate rotation button
// @access  Private (Admin only)
router.get('/:id/rotation-button-state', protect, async (req, res) => {
    try {
        const schedule = await Schedule.findById(req.params.id);
        if (!schedule) {
            return res.status(404).json({ msg: 'Schedule not found' });
        }

        const group = await Group.findById(schedule.groupId)
        const isAdmin = req.user.isSuperAdmin || (group && group.admins.some(adminId => adminId.equals(req.user._id)));

        if (!isAdmin) {
            return res.json({ visible: false });
        }

        let buttonState = {
            visible: true,
            text: 'Generate Rotation',
            disabled: false,
        };

        if (schedule.isCompleted) {
            buttonState.text = 'Schedule Finished';
            buttonState.disabled = true;
            return res.json(buttonState);
        }

        if (!schedule.isRotationGenerated) {
            // If no rotation has ever been generated, the button should be enabled.
            buttonState.text = !schedule.recurring ? 'Finish Schedule' : 'Generate Rotation';
            buttonState.disabled = false;
        } else {
            // A rotation has been generated, so calculate when the next one is due.
            const lastDate = new Date(schedule.lastRotationGeneratedDate);
            const nextAvailableDate = new Date(lastDate);
            nextAvailableDate.setHours(0, 0, 0, 0); // Normalize to the start of the day

            const frequency = parseInt(schedule.frequency);
            switch (frequency) {
                case 1: // Daily
                    nextAvailableDate.setDate(nextAvailableDate.getDate() + 1);
                    break;
                case 2: // Weekly
                    nextAvailableDate.setDate(nextAvailableDate.getDate() + 7);
                    break;
                case 3: // Bi-Weekly
                    nextAvailableDate.setDate(nextAvailableDate.getDate() + 14);
                    break;
                case 4: // Monthly
                    nextAvailableDate.setMonth(nextAvailableDate.getMonth() + 1);
                    break;
                default: // Non-recurring or invalid frequency
                    buttonState.text = 'Rotation Generated';
                    buttonState.disabled = true;
                    return res.json(buttonState);
            }

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            buttonState.disabled = today < nextAvailableDate;
            buttonState.text = buttonState.disabled ? 'Rotation Generated' : 'Generate Rotation';
        }

        res.json(buttonState);
    } catch (error) {
        console.error('Error getting rotation button state:', error);
        res.status(500).json({ msg: 'Server Error' });
    }
});

export default router;