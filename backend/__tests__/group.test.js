import { jest, describe, beforeEach, afterEach, it, expect } from '@jest/globals';

// Mock the protect middleware before any other imports
jest.unstable_mockModule('../middleware/authMiddleware.js', () => ({
  protect: (req, res, next) => {
    // Simulate a logged-in user
    req.user = { id: 'user1', isSuperAdmin: false };
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
      id: 'user1',
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
      expect(res.body.createdBy).toBe('user1');
      expect(res.body.admins).toContain('user1');

      // Verify that a corresponding player entry was created
      const player = await Player.findOne({ userId: 'user1', groupid: res.body.id });
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
      // Create a group where the user is an admin
      const adminGroup = await Group.create({
        id: 'group1',
        name: 'Admin Group',
        createdBy: 'user1',
        admins: ['user1'],
      });
      await Player.create({ id: 'player1', userId: 'user1', groupid: 'group1' });

      // Create a group where the user is just a player
      const playerGroup = await Group.create({
        id: 'group2',
        name: 'Player Group',
        createdBy: 'anotherUser',
        admins: ['anotherUser'],
      });
      await Player.create({ id: 'player2', userId: 'user1', groupid: 'group2' });

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
        id: 'group1',
        name: 'Old Name',
        createdBy: 'user1',
        admins: ['user1'],
      });
      const res = await request(app)
        .put('/api/groups/group1')
        .send({ name: 'New Name' });

      expect(res.statusCode).toBe(200);
      expect(res.body.name).toBe('New Name');
    });

    it('should return 403 if the user is not an admin of the group', async () => {
      const group = await Group.create({
        id: 'group1',
        name: 'Another Group',
        createdBy: 'anotherUser',
        admins: ['anotherUser'],
      });
      const res = await request(app)
        .put('/api/groups/group1')
        .send({ name: 'Attempted New Name' });
      expect(res.statusCode).toBe(403);
    });
  });

  describe('PUT /api/groups/:id/admins', () => {
    it('should update the admin list of a group', async () => {
      const group = await Group.create({
        id: 'group1',
        name: 'Test Group',
        createdBy: 'user1',
        admins: ['user1'],
      });
      const res = await request(app)
        .put('/api/groups/group1/admins')
        .send({ adminUserIds: ['user1', 'user2'] });

      expect(res.statusCode).toBe(200);
      expect(res.body.admins).toEqual(['user1', 'user2']);
    });

    it('should return 400 if the admin list is empty', async () => {
        const group = await Group.create({
        id: 'group1',
        name: 'Test Group',
        createdBy: 'user1',
        admins: ['user1'],
      });
      const res = await request(app)
        .put('/api/groups/group1/admins')
        .send({ adminUserIds: [] });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('DELETE /api/groups/:id', () => {
    it('should delete a group if the user is an admin', async () => {
      const group = await Group.create({
        id: 'group1',
        name: 'Group to Delete',
        createdBy: 'user1',
        admins: ['user1'],
      });
      const res = await request(app).delete('/api/groups/group1');
      expect(res.statusCode).toBe(200);
      const deletedGroup = await Group.findOne({ id: group.id });
      expect(deletedGroup).toBeNull();
    });
  });
});
