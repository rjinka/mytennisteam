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
const Schedule = (await import('../models/scheduleModel.js')).default;
const User = (await import('../models/userModel.js')).default;
const Group = (await import('../models/groupModel.js')).default;
const Player = (await import('../models/playerModel.js')).default;

describe('Schedule Routes', () => {
  let user, group, schedule, player;

  beforeEach(async () => {
    const groupId = new mongoose.Types.ObjectId();
    const scheduleId = new mongoose.Types.ObjectId();

    user = await User.create({ _id: userId, googleId: 'google123', name: 'Test User', email: 'test@example.com' });
    group = await Group.create({ _id: groupId, name: 'Test Group', createdBy: userId, admins: [userId] });
    player = await Player.create({ userId: userId, groupId: groupId });
    schedule = await Schedule.create({
      _id: scheduleId,
      name: 'Test Schedule',
      groupId: groupId,
      day: 1,
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
      const res = await request(app).get(`/api/schedules/${group._id}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].name).toBe('Test Schedule');
    });
  });

  describe('POST /api/schedules', () => {
    it('should create a new schedule with PLANNING status', async () => {
      const res = await request(app)
        .post('/api/schedules')
        .send({
          name: 'New Schedule',
          groupId: group._id,
          day: 'Tuesday',
          time: '20:00',
          duration: 60,
          maxPlayersCount: 2,
        });
      expect(res.statusCode).toBe(201);
      expect(res.body.name).toBe('New Schedule');
      const newSchedule = await Schedule.findOne({ name: 'New Schedule' });
      expect(newSchedule.status).toBe('PLANNING');
    });
  });

  describe('PUT /api/schedules/:id', () => {
    it('should update a schedule', async () => {
      const res = await request(app)
        .put(`/api/schedules/${schedule._id}`)
        .send({ name: 'Updated Schedule' });
      expect(res.statusCode).toBe(200);
      expect(res.body.name).toBe('Updated Schedule');
    });
  });

  describe('DELETE /api/schedules/:id', () => {
    it('should delete a schedule', async () => {
      const res = await request(app).delete(`/api/schedules/${schedule._id}`);
      expect(res.statusCode).toBe(200);
      const deletedSchedule = await Schedule.findById(schedule._id);
      expect(deletedSchedule).toBeNull();
    });
  });

  describe('GET /api/schedules/:scheduleId/signups', () => {
    it('should get all signups for a schedule', async () => {
      await Player.updateOne({ _id: player._id }, { $push: { availability: { scheduleId: schedule._id, type: 'Rotation' } } });
      const res = await request(app).get(`/api/schedules/${schedule._id}/signups`);
      expect(res.statusCode).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].playerName).toBe('Test User');
      expect(res.body[0].availabilityType).toBe('Rotation');
    });

    it('should return 403 for non-admin', async () => {
      await group.updateOne({ admins: [] });
      const res = await request(app).get(`/api/schedules/${schedule._id}/signups`);
      expect(res.statusCode).toBe(403);
    });
  });

  describe('POST /api/schedules/:scheduleId/complete-planning', () => {
    it('should complete planning for a schedule and set status to ACTIVE', async () => {
      const res = await request(app).post(`/api/schedules/${schedule._id}/complete-planning`);
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('ACTIVE');
      expect(res.body.isRotationGenerated).toBe(true);
    });

    it('should return 400 if schedule is not in PLANNING status', async () => {
      await schedule.updateOne({ status: 'ACTIVE' });
      const res = await request(app).post(`/api/schedules/${schedule._id}/complete-planning`);
      expect(res.statusCode).toBe(400);
    });

    it('should return 403 for non-admin', async () => {
      await group.updateOne({ admins: [] });
      const res = await request(app).post(`/api/schedules/${schedule._id}/complete-planning`);
      expect(res.statusCode).toBe(403);
    });
  });

  describe('GET /api/schedules/:id/rotation-button-state', () => {
    it('should return visible and enabled for admin if rotation not generated', async () => {
      const res = await request(app).get(`/api/schedules/${schedule._id}/rotation-button-state`);
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({
        visible: false,
        text: 'Finish Planning',
        disabled: true,
      });
    });

    it('should return visible and disabled for admin if schedule is completed', async () => {
      await schedule.updateOne({ status: 'COMPLETED' });
      const res = await request(app).get(`/api/schedules/${schedule._id}/rotation-button-state`);
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({
        visible: true,
        text: 'Schedule Finished',
        disabled: true,
      });
    });

    it('should return visible and disabled if rotation generated and not due', async () => {
      await schedule.updateOne({
        isRotationGenerated: true,
        lastRotationGeneratedDate: new Date(),
        frequency: '2', // Weekly
        status: 'ACTIVE',
        recurring: true,
      });
      const res = await request(app).get(`/api/schedules/${schedule._id}/rotation-button-state`);
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({
        visible: true,
        text: 'Rotation Generated',
        disabled: true,
      });
    });

    it('should return visible and enabled if rotation generated and due', async () => {
      const lastDate = new Date();
      lastDate.setDate(lastDate.getDate() - 7);
      await schedule.updateOne({
        isRotationGenerated: true,
        lastRotationGeneratedDate: lastDate,
        frequency: '2', // Weekly
        status: 'ACTIVE',
        recurring: true,
      });
      const res = await request(app).get(`/api/schedules/${schedule._id}/rotation-button-state`);
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({
        visible: true,
        text: 'Generate Rotation',
        disabled: false,
      });
    });

    it('should return not visible for non-admin', async () => {
      await group.updateOne({ admins: [] });
      const res = await request(app).get(`/api/schedules/${schedule._id}/rotation-button-state`);
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({
        visible: false,
      });
    });
  });
});
