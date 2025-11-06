import { jest, describe, beforeEach, afterEach, it, expect } from '@jest/globals';

// Mock middleware and config
jest.unstable_mockModule('../middleware/authMiddleware.js', () => ({
  protect: (req, res, next) => {
    req.user = { id: 'user1', isSuperAdmin: false };
    next();
  },
}));
jest.unstable_mockModule('../config.js', () => ({
  config: { jwt_secret: 'test-secret' },
}));

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
    user = await User.create({ id: 'user1', googleId: 'google123', name: 'Test User', email: 'test@example.com' });
    group = await Group.create({ id: 'group1', name: 'Test Group', createdBy: 'user1', admins: ['user1'] });
    schedule = await Schedule.create({
      id: 'schedule1',
      name: 'Test Schedule',
      groupid: 'group1',
      day: 'Monday',
      time: '18:00',
      duration: 90,
      maxPlayersCount: 4,
    });
    player = await Player.create({ id: 'player1', userId: 'user1', groupid: 'group1' });
    playerStat = await PlayerStat.create({
      playerId: 'player1',
      scheduleId: 'schedule1',
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
      const res = await request(app).get('/api/stats/player/player1');
      expect(res.statusCode).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].playerId).toBe('player1');
    });
  });

  describe('GET /api/stats/schedule/:scheduleId', () => {
    it('should get all stats for a specific schedule', async () => {
      const res = await request(app).get('/api/stats/schedule/schedule1');
      expect(res.statusCode).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].scheduleId).toBe('schedule1');
    });
  });

  describe('POST /api/playerstats', () => {
    it('should create a new player stat entry', async () => {
      const res = await request(app)
        .post('/api/stats')
        .send({
          playerId: 'player2',
          scheduleId: 'schedule1',
          stats: [{ week: 1, status: 'benched', date: '2024-01-01' }],
        });
      expect(res.statusCode).toBe(200);
      expect(res.body.playerId).toBe('player2');
    });
  });
});
