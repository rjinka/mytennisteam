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
const PlayerStat = (await import('../models/playerStatModel.js')).default;
const User = (await import('../models/userModel.js')).default;
const Group = (await import('../models/groupModel.js')).default;
const Schedule = (await import('../models/scheduleModel.js')).default;
const Player = (await import('../models/playerModel.js')).default;

describe('PlayerStat Routes', () => {
  let user, group, schedule, player, playerStat;

  beforeEach(async () => {
    const groupId = new mongoose.Types.ObjectId();
    const scheduleId = new mongoose.Types.ObjectId();
    const playerId = new mongoose.Types.ObjectId();

    user = await User.create({ _id: userId, googleId: 'google123', name: 'Test User', email: 'test@example.com' });
    group = await Group.create({ _id: groupId, name: 'Test Group', createdBy: userId, admins: [userId] });
    schedule = await Schedule.create({
      _id: scheduleId,
      name: 'Test Schedule',
      groupId: groupId,
      day: 'Monday',
      time: '18:00',
      duration: 90,
      maxPlayersCount: 4,
    });
    player = await Player.create({ _id: playerId, userId: userId, groupId: groupId });
    playerStat = await PlayerStat.create({
      playerId: playerId,
      scheduleId: scheduleId,
      stats: [{ week: 1, status: 'played', date: '2024-01-01' }],
    });
  });

  afterEach(async () => {
    await PlayerStat.deleteMany({});
    await User.deleteMany({});
    await Group.deleteMany({});
    await Schedule.deleteMany({});
    await Player.deleteMany({});
  });

  describe('GET /api/stats/player/:playerId', () => {
    it('should get player stats for a specific player', async () => {
      const res = await request(app).get(`/api/stats/player/${player._id}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].playerId).toBe(player._id.toString());
    });
  });

  describe('GET /api/stats/schedule/:scheduleId', () => {
    it('should get all stats for a specific schedule', async () => {
      const res = await request(app).get(`/api/stats/schedule/${schedule._id}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].scheduleId).toBe(schedule._id.toString());
    });
  });

  describe.skip('POST /api/stats', () => {
    it('should create a new player stat entry', async () => {
      const newPlayerId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post('/api/stats')
        .send({
          playerId: newPlayerId,
          scheduleId: schedule._id,
          stats: [{ week: 1, status: 'benched', date: '2024-01-01' }],
        });
      expect(res.statusCode).toBe(201);
      expect(res.body.playerId).toBe(newPlayerId.toString());
    });
  });
});
