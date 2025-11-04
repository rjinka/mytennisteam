import express from 'express';
import Schedule from '../models/scheduleModel.js';
import { protect } from '../middleware/authMiddleware.js';
import Player from '../models/playerModel.js';
import Group from '../models/groupModel.js';

const router = express.Router();

// @route   GET /api/schedules
// @desc    Get all schedules for the groups the user is a member of
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        // 1. Find all groups the user is a player in.
        const playerEntries = await Player.find({ userId: req.user.id });
        const groupIds = playerEntries.map(p => p.groupid);

        // 2. Find all schedules that belong to those groups.
        const schedules = await Schedule.find({ groupid: { $in: groupIds } });

        if (!schedules) {
            return res.json([]);
        }
        res.json(schedules);
    } catch (error) {
        console.error('Error fetching schedules:', error);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route GET /api/schedules/:groupid
// @desc Get all schedules for a group
// @access private
router.get('/:groupid', protect, async( req, res) => {
    try {
        const { groupid } = req.params;
        
        // Authorization check: User must be a member of the group to view its courts.
        const group = await Group.findOne({ id: groupid });
        if (!group) {
            return res.status(404).json({ msg: 'Group not found' });
        }

        const schdeules = await Schedule.find({ groupid: groupid });
        res.json(schdeules);
    } catch (error) {
        console.error(`Error fetching schedules for group ${req.params.groupid}:`, error);
        res.status(500).json({ msg: 'Server Error' });
    }
})

// @route   POST /api/schedules
// @desc    Create a new schedule
router.post('/', protect, async (req, res) => {
    const newScheduleData = req.body;
    // The 'name' field is now expected in newScheduleData
    newScheduleData.id = uuidv4(); // Assign a unique ID on the backend

    try {
        // Authorization check: Only group admins can create a schedule
        const group = await Group.findOne({ id: newScheduleData.groupid });
        if (!group) {
            return res.status(404).json({ msg: 'Group not found' });
        }

        if (!req.user.isSuperAdmin && !group.admins.includes(req.user.id)) {
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
    const scheduleId = req.params.id;
    const updatedScheduleData = req.body;

    try {
        // The 'name' field will be in updatedScheduleData
        let schedule = await Schedule.findOne({id: scheduleId});
        if (!schedule) {
            return res.status(404).json({ msg: 'Schedule not found' });
        }

        // Authorization check: Only group admins can edit
        const group = await Group.findOne({ id: schedule.groupid });
        if (!req.user.isSuperAdmin && (!group || !group.admins.includes(req.user.id))) {
            return res.status(403).json({ msg: 'User not authorized to edit this schedule' });
        }

        // --- Handle isCompleted logic ---
        const oldRecurrenceCount = schedule.recurrenceCount;
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
        schedule = await Schedule.findOneAndUpdate({ id: scheduleId }, { $set: updatedScheduleData }, { new: true });

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
    // Import Player and PlayerStat models for cleanup
    const Player = (await import('../models/playerModel.js')).default;
    const PlayerStat = (await import('../models/playerStatModel.js')).default;

    try {
        const schedule = await Schedule.findOne({id: req.params.id});
        if (!schedule) {
            return res.status(404).json({ msg: 'Schedule not found' });
        }
        // Authorization check: Only group admins can delete
        const group = await Group.findOne({ id: schedule.groupid });
        if (!req.user.isSuperAdmin && (!group || !group.admins.includes(req.user.id))) {
            return res.status(403).json({ msg: 'User not authorized to delete this schedule' });
        }

        const scheduleIdToDelete = schedule.id;

        // 1. Delete all PlayerStat documents associated with this schedule
        await PlayerStat.deleteMany({ scheduleId: scheduleIdToDelete });

        // 2. Remove the scheduleId from all players' selectedScheduleList
        await Player.updateMany({}, {
            $pull: { availability: { scheduleId: scheduleIdToDelete } }
        });
        await schedule.deleteOne();
        res.json({ msg: 'Schedule removed' });
    } catch (error) {
        console.error('Error deleting schedule:', error);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   PUT /api/schedules/:id/swapPlayers
// @desc    Swap players between playing and bench for a specific schedule
router.put('/:id/swapPlayers', protect, async (req, res) => {
    const scheduleId = req.params.id; // This 'id' comes from the URL parameter
    const { playerBeingSwappedId, swapPartnerId, swapActionDirection } = req.body;

    try {
        let schedule = await Schedule.findOne({id: scheduleId});
        if (!schedule) {
            return res.status(404).json({ msg: 'Schedule not found' });
        }

        const playingPlayersIds = new Set(schedule.playingPlayersIds || []);
        const benchPlayersIds = new Set(schedule.benchPlayersIds || []);

        // Determine which player is moving from playing to bench and vice-versa
        const playerToBench = swapActionDirection === 'moveToBench' ? playerBeingSwappedId : swapPartnerId;
        const playerToCourt = swapActionDirection === 'moveToBench' ? swapPartnerId : playerBeingSwappedId;

        // Validate that players are in the correct lists before swapping
        if (!playingPlayersIds.has(playerToBench) || !benchPlayersIds.has(playerToCourt)) {
            return res.status(400).json({ msg: 'Invalid swap. Players not in expected positions.' });
        }

        // Perform the swap
        playingPlayersIds.delete(playerToBench);
        playingPlayersIds.add(playerToCourt);
        benchPlayersIds.delete(playerToCourt);
        benchPlayersIds.add(playerToBench);

        // Update the schedule object
        schedule.playingPlayersIds = Array.from(playingPlayersIds);
        schedule.benchPlayersIds = Array.from(benchPlayersIds);

        await schedule.save();
        res.status(200).json(schedule); // Return the updated schedule
    } catch (error) {
        console.error('Error swapping players:', error);
        res.status(500).json({ msg: 'Server Error' });
    }
});

export default router;