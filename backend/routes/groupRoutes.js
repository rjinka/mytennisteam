import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import Group from '../models/groupModel.js';
import Player from '../models/playerModel.js';
import { protect } from '../middleware/authMiddleware.js';
import sendEmail from '../utils/sendEmail.js';
import Invitation from '../models/invitationModel.js';
import User from '../models/userModel.js';
import Schedule from '../models/scheduleModel.js';
import PlayerStat from '../models/playerStatModel.js';
import Court from '../models/courtModel.js';


const router = express.Router();

// @route   GET /api/groups/player
// @desc    Get groups where the current user is a player but also a admin to another group
// @access  Private
router.get('/player', protect, async (req, res) => {
    try {
        let groups;
        if (!req.user) return res.status(401).json({ msg: 'Not authorized' });
        if (req.user.isSuperAdmin) {
            groups = await Group.find({}); // Super admin gets all groups
            return res.json(groups);
        }

        // find list of all groups that players is a group admin
        const adminGroups = await Group.find({ admins: req.user.id });

        // Find all player entries for the current user
        const playerEntries = await Player.find({ userId: req.user.id });
        const playerGroupIds = playerEntries.map(p => p.groupid);
        // Find all groups corresponding to these group IDs
        const playerGroups = await Group.find({ id: { $in: playerGroupIds } });

        // combine adminGroups and playerGroups but remove duplicates
        const combinedGroups = [...adminGroups, ...playerGroups];
        groups = combinedGroups.filter((group, index, self) =>
            index === self.findIndex((g) => g.id === group.id)
        );
        res.json(groups);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   POST /api/groups
// @desc    Create a new group
// @access  Private
router.post('/', protect, async (req, res) => {
    const { name } = req.body;
    try {
        if (!name) {
            return res.status(400).json({ msg: 'Name is required' });
        }
        const newGroup = new Group({
            id: uuidv4(),
            name,
            createdBy: req.user.id,
            admins: [req.user.id], // The creator is the first admin
        });
        const group = await newGroup.save();

        // Also create a Player entry for the admin in this new group
        const newPlayer = new Player({
            id: uuidv4(),
            userId: req.user.id,
            groupid: group.id,
            selectedScheduleList: [],
        });
        await newPlayer.save();

        res.status(201).json(group);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   PUT /api/groups/:id
// @desc    Update a group's name
// @access  Private
router.put('/:id', protect, async (req, res) => {
    const { name } = req.body;
    try {
        let group = await Group.findOne({ id: req.params.id });
        if (!group) return res.status(404).json({ msg: 'Group not found' });

        if (!req.user.isSuperAdmin && !group.admins.includes(req.user.id)) {
            return res.status(403).json({ msg: 'User not authorized' });
        }

        group.name = name || group.name;
        await group.save();
        res.json(group);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   PUT /api/groups/:id/admins
// @desc    Update a group's admin list
// @access  Private
router.put('/:id/admins', protect, async (req, res) => {
    const { adminUserIds } = req.body;
    try {
        let group = await Group.findOne({ id: req.params.id });
        if (!group) return res.status(404).json({ msg: 'Group not found' });

        // Authorization: only an existing admin can change the admin list
        if (!req.user.isSuperAdmin && !group.admins.includes(req.user.id)) {
            return res.status(403).json({ msg: 'User not authorized' });
        }

        // Safety check: cannot remove the last admin
        if (adminUserIds.length === 0) {
            return res.status(400).json({ msg: 'A group must have at least one admin.' });
        }

        group.admins = adminUserIds;
        await group.save();
        res.json(group);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Server Error' });
    }
});


// @route   DELETE /api/groups/:id
// @desc    Delete a group
// @access  Private
router.delete('/:id', protect, async (req, res) => {
    try {
        const group = await Group.findOne({ id: req.params.id });
        if (!group) return res.status(404).json({ msg: 'Group not found' });

        if (!req.user.isSuperAdmin && !group.admins.includes(req.user.id)) {
            return res.status(403).json({ msg: 'User not authorized' });
        }

        const groupId = group.id;

        // Find all schedules in the group to get their IDs for stat cleanup
        const schedulesInGroup = await Schedule.find({ groupid: groupId });
        const scheduleIdsInGroup = schedulesInGroup.map(s => s.id);

        // Perform cascading deletes
        await PlayerStat.deleteMany({ scheduleId: { $in: scheduleIdsInGroup } });
        await Schedule.deleteMany({ groupid: groupId });
        await Player.deleteMany({ groupid: groupId });
        await Court.deleteMany({ groupid: groupId });
        await Invitation.deleteMany({ groupId: group._id });

        await group.deleteOne();
        res.json({ msg: 'Group removed' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   POST /api/groups/:groupId/invite
// @desc    Invite a player to a group
// @access  Private

router.post('/:groupId/invite', protect, async (req, res) => {
    const { email } = req.body;
    const { groupId } = req.params;

    // Validate that the email is a @gmail.com address
    if (!email || !email.toLowerCase().endsWith('@gmail.com')) {
        return res.status(400).json({ msg: 'Only @gmail.com accounts can be invited.' });
    }

    try {
        const group = await Group.findOne({ id: groupId });
        if (!group) {
            return res.status(404).json({ msg: 'Group not found' });
        }

        // Authorization: Only group admins or super admins can invite
        if (!req.user.isSuperAdmin && !group.admins.includes(req.user.id)) {
            return res.status(403).json({ msg: 'You are not authorized to invite players to this group.' });
        }

        // Check if a user with this email already exists and is a player in the group
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            const playerExists = await Player.findOne({ userId: existingUser.id, groupid: group.id });
            if (playerExists) {
                return res.status(400).json({ msg: 'This user is already a player in this group.' });
            }
        }

        // Create invitation (this will be handled by the invitation model's defaults)
        const invitation = await Invitation.create({
            email: email,
            groupId: group._id, // Use the ObjectId for the ref
        });

        const inviteUrl = `${process.env.FRONTEND_URL}?join_token=${invitation.join_token}`;
        await sendEmail({ email, subject: `Invitation to join ${group.name}`, message: `Please click this link to join the group: <a href="${inviteUrl}">${group.name}</a>` });

        res.status(200).json({ msg: 'Invitation sent successfully!' });
    } catch (error) {
        console.error('Error sending invitation:', error);
        res.status(500).json({ msg: 'Server Error' });
    }
});


export default router;