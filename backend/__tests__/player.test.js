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
const Player = (await import('../models/playerModel.js')).default;
const User = (await import('../models/userModel.js')).default;
const Group = (await import('../models/groupModel.js')).default;
const Schedule = (await import('../models/scheduleModel.js')).default;

describe('Player Routes', () => {
  let user, group, player, schedule;

  beforeEach(async () => {
    user = await User.create({ id: 'user1', googleId: 'google123', name: 'Test User', email: 'test@example.com' });
    group = await Group.create({ id: 'group1', name: 'Test Group', createdBy: 'user1', admins: ['user1'] });
    player = await Player.create({ id: 'player1', userId: 'user1', groupid: 'group1' });
    schedule = await Schedule.create({
      id: 'schedule1',
      groupid: 'group1',
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
      const res = await request(app).get('/api/players/group1');
      expect(res.statusCode).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].userId).toBe('user1');
    });
  });

  describe('PUT /api/players/:id', () => {
    it('should update a player\'s availability and schedule', async () => {
      const res = await request(app)
        .put('/api/players/player1')
        .send({
          availability: [{ scheduleId: 'schedule1', available: true }],
        });

      expect(res.statusCode).toBe(200);

      const updatedSchedule = await Schedule.findOne({ id: 'schedule1' });
      expect(updatedSchedule.playingPlayersIds).toContain('player1');
    });

    it('should move a player to the bench if the schedule is full', async () => {
        const player2 = await Player.create({ id: 'player2', userId: 'user2', groupid: 'group1' });
        await schedule.updateOne({$set: {playingPlayersIds: ['player2'] }});

        const res = await request(app)
        .put('/api/players/player1')
        .send({
          availability: [{ scheduleId: 'schedule1', available: true }],
        });

      expect(res.statusCode).toBe(200);

      const updatedSchedule = await Schedule.findOne({ id: 'schedule1' });
      expect(updatedSchedule.benchPlayersIds).toContain('player1');
    });
  });

  describe('DELETE /api/players/:id', () => {
    it('should delete a player if the user is an admin', async () => {
      const res = await request(app).delete('/api/players/player1');
      expect(res.statusCode).toBe(200);
      const deletedPlayer = await Player.findOne({ id: 'player1' });
      expect(deletedPlayer).toBeNull();
    });

    it('should return 403 if the user is not an admin', async () => {
        await group.updateOne({$set: {admins: ['user2'] }});
        const res = await request(app).delete('/api/players/player1');
        expect(res.statusCode).toBe(403);
    });
  });
});
