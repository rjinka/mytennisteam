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
const Schedule = (await import('../models/scheduleModel.js')).default;
const User = (await import('../models/userModel.js')).default;
const Group = (await import('../models/groupModel.js')).default;
const Player = (await import('../models/playerModel.js')).default;

describe('Schedule Routes', () => {
  let user, group, schedule;

  beforeEach(async () => {
    user = await User.create({ id: 'user1', googleId: 'google123', name: 'Test User', email: 'test@example.com' });
    group = await Group.create({ id: 'group1', name: 'Test Group', createdBy: 'user1', admins: ['user1'] });
    await Player.create({ id: 'player1', userId: 'user1', groupid: 'group1' });
    schedule = await Schedule.create({
      id: 'schedule1',
      name: 'Test Schedule',
      groupid: 'group1',
      day: 'Monday',
      time: '18:00',
      duration: 90,
      maxPlayersCount: 4,
    });
  });

  afterEach(async () => {
    await Schedule.deleteMany({});
    await User.deleteMany({});
    await Group.deleteMany({});
    await Player.deleteMany({});
  });

  describe('GET /api/schedules/:groupid', () => {
    it('should get all schedules for a group', async () => {
      const res = await request(app).get('/api/schedules/group1');
      expect(res.statusCode).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].name).toBe('Test Schedule');
    });
  });

  describe('POST /api/schedules', () => {
    it('should create a new schedule', async () => {
      const res = await request(app)
        .post('/api/schedules')
        .send({
          name: 'New Schedule',
          groupid: 'group1',
          day: 'Tuesday',
          time: '20:00',
          duration: 60,
          maxPlayersCount: 2,
        });
      expect(res.statusCode).toBe(201);
      expect(res.body.name).toBe('New Schedule');
    });
  });

  describe('PUT /api/schedules/:id', () => {
    it('should update a schedule', async () => {
      const res = await request(app)
        .put('/api/schedules/schedule1')
        .send({ name: 'Updated Schedule' });
      expect(res.statusCode).toBe(200);
      expect(res.body.name).toBe('Updated Schedule');
    });
  });

  describe('DELETE /api/schedules/:id', () => {
    it('should delete a schedule', async () => {
      const res = await request(app).delete('/api/schedules/schedule1');
      expect(res.statusCode).toBe(200);
      const deletedSchedule = await Schedule.findOne({ id: 'schedule1' });
      expect(deletedSchedule).toBeNull();
    });
  });
});
