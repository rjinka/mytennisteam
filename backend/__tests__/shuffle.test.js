import { jest, describe, beforeEach, afterEach, it, expect } from '@jest/globals';
import mongoose from 'mongoose';

const userId = new mongoose.Types.ObjectId();
// Mock middleware and config
jest.unstable_mockModule('../middleware/authMiddleware.js', () => ({
    protect: (req, res, next) => {
        req.user = { _id: userId, id: userId.toString(), isSuperAdmin: false };
        next();
    },
}));
jest.unstable_mockModule('../config.js', () => ({
    config: { jwt_secret: 'test-secret', mongo_uri: 'mongodb://localhost:27017/test' },
}));

// Dynamic imports after mocks
const request = (await import('supertest')).default;
const { app } = await import('../server.js');
const Schedule = (await import('../models/scheduleModel.js')).default;
const User = (await import('../models/userModel.js')).default;
const Group = (await import('../models/groupModel.js')).default;
const Player = (await import('../models/playerModel.js')).default;

describe('Shuffle and Court Assignment Features', () => {
    let user, group, schedule, players = [];

    beforeEach(async () => {
        const groupId = new mongoose.Types.ObjectId();

        user = await User.create({ _id: userId, googleId: 'google123', name: 'Admin User', email: 'admin@example.com' });
        group = await Group.create({ _id: groupId, name: 'Test Group', createdBy: userId, admins: [userId] });

        // Create 8 players for 2 doubles courts
        for (let i = 0; i < 8; i++) {
            const u = await User.create({ googleId: `g${i}`, name: `Player ${i}`, email: `p${i}@example.com` });
            const p = await Player.create({ userId: u._id, groupId: groupId });
            players.push(p);
        }

        schedule = await Schedule.create({
            name: 'Shuffle Schedule',
            groupId: groupId,
            day: 1,
            time: '18:00',
            duration: 90,
            maxPlayersCount: 8,
            allowShuffle: true,
            courts: [
                { courtId: new mongoose.Types.ObjectId(), gameType: '1' }, // Doubles
                { courtId: new mongoose.Types.ObjectId(), gameType: '1' }  // Doubles
            ]
        });

        // Set availability for all players
        await Player.updateMany(
            { groupId: groupId },
            { $push: { availability: { scheduleId: schedule._id, type: 'Rotation' } } }
        );
    });

    afterEach(async () => {
        await Schedule.deleteMany({});
        await User.deleteMany({});
        await Group.deleteMany({});
        await Player.deleteMany({});
        players = [];
    });

    it('should generate court assignments with sides when completing planning', async () => {
        const res = await request(app).post(`/api/schedules/${schedule._id}/complete-planning`);

        expect(res.statusCode).toBe(200);
        expect(res.body.courtAssignments).toBeDefined();
        expect(res.body.courtAssignments.length).toBe(2);

        // Check first court
        const firstCourt = res.body.courtAssignments[0];
        expect(firstCourt.assignments.length).toBe(4);
        expect(firstCourt.assignments[0].side).toBe('Left');
        expect(firstCourt.assignments[1].side).toBe('Right');
        expect(firstCourt.assignments[2].side).toBe('Left');
        expect(firstCourt.assignments[3].side).toBe('Right');
    });

    it('should update court assignments when shuffling', async () => {
        // First generate initial assignments
        await request(app).post(`/api/schedules/${schedule._id}/complete-planning`);

        const res = await request(app).put(`/api/schedules/${schedule._id}/shuffle`);

        expect(res.statusCode).toBe(200);
        expect(res.body.courtAssignments).toBeDefined();
        expect(res.body.courtAssignments.length).toBe(2);

        // Sides should still be correct
        const firstCourt = res.body.courtAssignments[0];
        expect(firstCourt.assignments[0].side).toBe('Left');
        expect(firstCourt.assignments[1].side).toBe('Right');
    });

    it('should update court assignments correctly after a player swap', async () => {
        // 1. Generate initial assignments
        const genRes = await request(app).post(`/api/schedules/${schedule._id}/complete-planning`);
        const initialAssignments = genRes.body.courtAssignments;
        const playerOutId = initialAssignments[0].assignments[0].playerId;

        // 2. Create a bench player (we need more than 8 players to have someone on bench, or just manually add to bench)
        const benchUser = await User.create({ googleId: 'bench', name: 'Bench Player', email: 'bench@example.com' });
        const benchPlayer = await Player.create({ userId: benchUser._id, groupId: group._id });
        await Schedule.findByIdAndUpdate(schedule._id, { $push: { benchPlayersIds: benchPlayer._id } });

        // 3. Perform swap
        const swapRes = await request(app)
            .put(`/api/schedules/${schedule._id}/swap`)
            .send({
                playerInId: benchPlayer._id.toString(),
                playerOutId: playerOutId.toString()
            });

        expect(swapRes.statusCode).toBe(200);

        // 4. Verify the player was swapped in the court assignment
        const updatedAssignments = swapRes.body.courtAssignments;
        const firstCourtAssignments = updatedAssignments[0].assignments;

        expect(firstCourtAssignments.some(a => a.playerId === benchPlayer._id.toString())).toBe(true);
        expect(firstCourtAssignments.some(a => a.playerId === playerOutId.toString())).toBe(false);

        // Verify side was preserved
        const swappedPlayerAssignment = firstCourtAssignments.find(a => a.playerId === benchPlayer._id.toString());
        expect(swappedPlayerAssignment.side).toBe('Left'); // Original player was at index 0 (Left)
    });

    it('should NOT generate court assignments if allowShuffle is false', async () => {
        await Schedule.findByIdAndUpdate(schedule._id, { allowShuffle: false });

        const res = await request(app).post(`/api/schedules/${schedule._id}/complete-planning`);

        expect(res.statusCode).toBe(200);
        expect(res.body.courtAssignments.length).toBe(0);
    });
});
