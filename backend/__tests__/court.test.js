import { jest, describe, beforeEach, afterEach, it, expect } from '@jest/globals';

import mongoose from 'mongoose';
const userId = new mongoose.Types.ObjectId();
// Mock the protect middleware
jest.unstable_mockModule('../middleware/authMiddleware.js', () => ({
  protect: (req, res, next) => {
    req.user = { _id: userId, isSuperAdmin: false }; // Mock a regular user
    next();
  },
}));

// Mock config for JWT secret
jest.unstable_mockModule('../config.js', () => ({
  config: {
    jwt_secret: 'test-secret',
  },
}));


// Dynamically import modules after mocks
const request = (await import('supertest')).default;
const { app } = await import('../server.js');
const Court = (await import('../models/courtModel.js')).default;
const Group = (await import('../models/groupModel.js')).default;
const User = (await import('../models/userModel.js')).default;
const Player = (await import('../models/playerModel.js')).default;


describe('Court Routes', () => {
  let user, group;

  beforeEach(async () => {
    const groupId = new mongoose.Types.ObjectId();
    user = await User.create({
      _id: userId,
      googleId: 'google123',
      name: 'Test User',
      email: 'test@example.com',
    });
    group = await Group.create({
      _id: groupId,
      name: 'Test Group',
      createdBy: userId,
      admins: [userId],
    });
    await Player.create({
      userId: userId,
      groupId: groupId,
    });
  });

  afterEach(async () => {
    await Court.deleteMany({});
    await Group.deleteMany({});
    await User.deleteMany({});
    await Player.deleteMany({});
  });

  describe('POST /api/courts', () => {
    it('should create a new court if user is an admin', async () => {
      const res = await request(app)
        .post('/api/courts')
        .send({ name: 'Court 1', groupId: group._id });

      expect(res.statusCode).toBe(201);
      expect(res.body.name).toBe('Court 1');
      expect(res.body.groupId).toBe(group._id.toString());
    });

    it('should return 403 if user is not an admin', async () => {
       await group.updateOne({$set: {admins: [new mongoose.Types.ObjectId()] }});

      const res = await request(app)
        .post('/api/courts')
        .send({ name: 'Court 1', groupId: group._id });

      expect(res.statusCode).toBe(403);
    });
  });

  describe('GET /api/courts/:groupid', () => {
    it('should get all courts for a specific group', async () => {
      await Court.create({ name: 'Court 1', groupId: group._id });
      const res = await request(app).get(`/api/courts/${group._id}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].name).toBe('Court 1');
    });
  });

  describe('GET /api/courts', () => {
    it('should get all courts for the groups a user is a player in', async () => {
      await Court.create({ name: 'Court 1', groupId: group._id });
      const res = await request(app).get('/api/courts');
      expect(res.statusCode).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].name).toBe('Court 1');
    });
  });

  describe('PUT /api/courts/:id', () => {
    it('should update a court', async () => {
      const court = await Court.create({ name: 'Old Name', groupId: group._id });
      const res = await request(app)
        .put(`/api/courts/${court._id}`)
        .send({ name: 'New Name', groupId: group._id });

      expect(res.statusCode).toBe(200);
      expect(res.body.name).toBe('New Name');
    });
  });

  describe('DELETE /api/courts/:id', () => {
    it('should delete a court if user is an admin', async () => {
      const court = await Court.create({ name: 'Court 1', groupId: group._id });
      const res = await request(app).delete(`/api/courts/${court._id}`);
      expect(res.statusCode).toBe(200);
      const deletedCourt = await Court.findById(court._id);
      expect(deletedCourt).toBeNull();
    });

     it('should return 403 if user is not an admin', async () => {
       await group.updateOne({$set: {admins: [new mongoose.Types.ObjectId()] }});
       const court = await Court.create({ name: 'Court 1', groupId: group._id });
       const res = await request(app).delete(`/api/courts/${court._id}`);
       expect(res.statusCode).toBe(403);
    });
  });
});
