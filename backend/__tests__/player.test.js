import { jest, describe, beforeEach, afterEach, it, expect } from '@jest/globals';

const userId = new mongoose.Types.ObjectId();
// Mock middleware and config
jest.unstable_mockModule('../middleware/authMiddleware.js', () => ({
  protect: (req, res, next) => {
    req.user = { _id: userId, isSuperAdmin: false };
    next();
  },
}));
jest.unstable_mockModule('../config.js', () => ({
  config: { jwt_secret: 'test-secret' },
}));

import mongoose from 'mongoose';
// Dynamic imports after mocks
const request = (await import('supertest')).default;
const { app } = await import('../server.js');
const Player = (await import('../models/playerModel.js')).default;
const User = (await import('../models/userModel.js')).default;
const Group = (await import('../models/groupModel.js')).default;
const Schedule = (await import('../models/scheduleModel.js')).default;

describe('Player Routes', () => {
  let user, group, player, schedule;

  beforeEach(async () => {
    const groupId = new mongoose.Types.ObjectId();
    const playerId = new mongoose.Types.ObjectId();
    const scheduleId = new mongoose.Types.ObjectId();

    user = await User.create({ _id: userId, googleId: 'google123', name: 'Test User', email: 'test@example.com' });
    group = await Group.create({ _id: groupId, name: 'Test Group', createdBy: userId, admins: [userId] });
    player = await Player.create({ _id: playerId, userId: userId, groupId: groupId });
    schedule = await Schedule.create({
      _id: scheduleId,
      groupId: groupId,
      name: 'Test Schedule',
      day: 'Monday',
      time: '18:00',
      duration: 90,
      maxPlayersCount: 1,
    });
  });

  afterEach(async () => {
    await Player.deleteMany({});
    await User.deleteMany({});
    await Group.deleteMany({});
    await Schedule.deleteMany({});
  });

  describe('GET /api/players/:groupid', () => {
    it('should get all players for a specific group', async () => {
      const res = await request(app).get(`/api/players/${group._id}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].userId).toBe(user._id.toString());
    });
  });

  describe('PUT /api/players/:id', () => {
    it('should update a player\'s availability and schedule', async () => {
      await schedule.updateOne({ status: 'ACTIVE' });
      const res = await request(app)
        .put(`/api/players/${player._id}`)
        .send({
          availability: [{ scheduleId: schedule._id, type: 'Permanent' }],
        });

      expect(res.statusCode).toBe(200);

      const updatedSchedule = await Schedule.findById(schedule._id);
      expect(updatedSchedule.playingPlayersIds).toContainEqual(player._id);
    });

    it('should move a player to the bench if the schedule is full', async () => {
        const player2 = await Player.create({ userId: new mongoose.Types.ObjectId(), groupId: group._id });
        await schedule.updateOne({$set: {playingPlayersIds: [player2._id], status: 'ACTIVE' }});

        const res = await request(app)
        .put(`/api/players/${player._id}`)
        .send({
          availability: [{ scheduleId: schedule._id, type: 'Permanent' }],
        });

      expect(res.statusCode).toBe(200);

      const updatedSchedule = await Schedule.findById(schedule._id);
      expect(updatedSchedule.benchPlayersIds).toContainEqual(player._id);
    });

    it('should return 400 if trying to change availability for an active schedule', async () => {
        await schedule.updateOne({ status: 'ACTIVE' });
        const res = await request(app)
            .put(`/api/players/${player._id}`)
            .send({
                availability: [{ scheduleId: schedule._id, type: 'Permanent' }],
            });
        expect(res.statusCode).toBe(400);
    });

    it('should not add player to lineup for a PLANNING schedule', async () => {
        await schedule.updateOne({ status: 'PLANNING' });
        const res = await request(app)
            .put(`/api/players/${player._id}`)
            .send({
                availability: [{ scheduleId: schedule._id, type: 'Permanent' }],
            });
        expect(res.statusCode).toBe(200);
        const updatedSchedule = await Schedule.findById(schedule._id);
        expect(updatedSchedule.playingPlayersIds).not.toContainEqual(player._id);
        expect(updatedSchedule.benchPlayersIds).not.toContainEqual(player._id);
    });
  });

  describe('DELETE /api/players/:id', () => {
    it('should delete a player if the user is an admin', async () => {
      const res = await request(app).delete(`/api/players/${player._id}`);
      expect(res.statusCode).toBe(200);
      const deletedPlayer = await Player.findById(player._id);
      expect(deletedPlayer).toBeNull();
    });

    it('should return 403 if the user is not an admin', async () => {
        await group.updateOne({$set: {admins: [new mongoose.Types.ObjectId()] }});
        const res = await request(app).delete(`/api/players/${player._id}`);
        expect(res.statusCode).toBe(403);
    });
  });
});
