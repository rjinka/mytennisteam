import { jest, describe, beforeEach, afterEach, it, expect } from '@jest/globals';

import mongoose from 'mongoose';
const userId = new mongoose.Types.ObjectId();
// Mock the protect middleware before any other imports
jest.unstable_mockModule('../middleware/authMiddleware.js', () => ({
  protect: (req, res, next) => {
    // Simulate a logged-in user
    req.user = { _id: userId, isSuperAdmin: false };
    next();
  },
}));

// Dynamically import modules after the mock is set up
const request = (await import('supertest')).default;
const { app } = await import('../server.js');
const Group = (await import('../models/groupModel.js')).default;
const User = (await import('../models/userModel.js')).default;
const Player = (await import('../models/playerModel.js')).default;

describe('Group Routes', () => {
  let user;

  beforeEach(async () => {
    // Create a user that will be "logged in" by the mocked middleware
    user = await User.create({
      _id: userId,
      googleId: 'google123',
      name: 'Test User',
      email: 'test@example.com',
    });
  });

  afterEach(async () => {
    // Clean up all collections after each test
    await Group.deleteMany({});
    await User.deleteMany({});
    await Player.deleteMany({});
  });

  describe('POST /api/groups', () => {
    it('should create a new group with the authenticated user as the creator and admin', async () => {
      const res = await request(app)
        .post('/api/groups')
        .send({ name: 'Test Group' });

      expect(res.statusCode).toBe(201);
      expect(res.body.name).toBe('Test Group');
      expect(res.body.createdBy).toBe(user._id.toString());
      expect(res.body.admins).toContain(user._id.toString());

      // Verify that a corresponding player entry was created
      const player = await Player.findOne({ userId: user._id, groupId: res.body._id });
      expect(player).not.toBeNull();
    });

    it('should return 400 if the group name is missing', async () => {
      const res = await request(app)
        .post('/api/groups')
        .send({});
      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /api/groups/player', () => {
    it('should get all groups where the user is an admin or a player', async () => {
      const anotherUserId = new mongoose.Types.ObjectId();
      // Create a group where the user is an admin
      const adminGroup = await Group.create({
        name: 'Admin Group',
        createdBy: user._id,
        admins: [user._id],
      });
      await Player.create({ userId: user._id, groupId: adminGroup._id });

      // Create a group where the user is just a player
      const playerGroup = await Group.create({
        name: 'Player Group',
        createdBy: anotherUserId,
        admins: [anotherUserId],
      });
      await Player.create({ userId: user._id, groupId: playerGroup._id });

      const res = await request(app).get('/api/groups/player');
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body.map(g => g.name)).toContain('Admin Group');
      expect(res.body.map(g => g.name)).toContain('Player Group');
    });
  });

  describe('PUT /api/groups/:id', () => {
    it('should update the name of a group if the user is an admin', async () => {
      const group = await Group.create({
        name: 'Old Name',
        createdBy: user._id,
        admins: [user._id],
      });
      const res = await request(app)
        .put(`/api/groups/${group._id}`)
        .send({ name: 'New Name' });

      expect(res.statusCode).toBe(200);
      expect(res.body.name).toBe('New Name');
    });

    it('should return 403 if the user is not an admin of the group', async () => {
      const anotherUserId = new mongoose.Types.ObjectId();
      const group = await Group.create({
        name: 'Another Group',
        createdBy: anotherUserId,
        admins: [anotherUserId],
      });
      const res = await request(app)
        .put(`/api/groups/${group._id}`)
        .send({ name: 'Attempted New Name' });
      expect(res.statusCode).toBe(403);
    });
  });

  describe('PUT /api/groups/:id/admins', () => {
    it('should update the admin list of a group', async () => {
      const group = await Group.create({
        name: 'Test Group',
        createdBy: user._id,
        admins: [user._id],
      });
      const anotherUserId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .put(`/api/groups/${group._id}/admins`)
        .send({ adminUserIds: [user._id.toString(), anotherUserId.toString()] });

      expect(res.statusCode).toBe(200);
      expect(res.body.admins).toEqual([user._id.toString(), anotherUserId.toString()]);
    });

    it('should return 400 if the admin list is empty', async () => {
        const group = await Group.create({
        name: 'Test Group',
        createdBy: user._id,
        admins: [user._id],
      });
      const res = await request(app)
        .put(`/api/groups/${group._id}/admins`)
        .send({ adminUserIds: [] });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('DELETE /api/groups/:id', () => {
    it('should delete a group if the user is an admin', async () => {
      const group = await Group.create({
        name: 'Group to Delete',
        createdBy: user._id,
        admins: [user._id],
      });
      const res = await request(app).delete(`/api/groups/${group._id}`);
      expect(res.statusCode).toBe(200);
      const deletedGroup = await Group.findById(group._id);
      expect(deletedGroup).toBeNull();
    });
  });
});
