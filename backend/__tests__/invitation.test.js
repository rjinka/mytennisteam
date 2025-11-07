import { jest, describe, beforeEach, afterEach, it, expect } from '@jest/globals';

// Mock middleware and config
jest.unstable_mockModule('../middleware/authMiddleware.js', () => ({
  protect: (req, res, next) => {
    req.user = { id: 'user1', email: 'test@example.com', isSuperAdmin: false };
    next();
  },
}));
jest.unstable_mockModule('../config.js', () => ({
  config: { jwt_secret: 'test-secret' },
}));

// Dynamic imports after mocks
const request = (await import('supertest')).default;
const { app } = await import('../server.js');
const Invitation = (await import('../models/invitationModel.js')).default;
const User = (await import('../models/userModel.js')).default;
const Group = (await import('../models/groupModel.js')).default;
const Player = (await import('../models/playerModel.js')).default;

describe('Invitation Routes', () => {
  let user, group, invitation;

  beforeEach(async () => {
    user = await User.create({ id: 'user1', googleId: 'google123', name: 'Test User', email: 'test@example.com' });
    group = await Group.create({ id: 'group1', name: 'Test Group', createdBy: 'user1', admins: ['user1'] });
    invitation = await Invitation.create({
      email: 'test@example.com',
      groupId: group.id,
      join_token: 'test_token',
    });
  });

  afterEach(async () => {
    await Invitation.deleteMany({});
    await User.deleteMany({});
    await Group.deleteMany({});
    await Player.deleteMany({});
  });

  describe('GET /api/invitations/verify/:join_token', () => {
    it('should verify a valid invitation token', async () => {
      const res = await request(app).get('/api/invitations/verify/test_token');
      expect(res.statusCode).toBe(200);
      expect(res.body.email).toBe('test@example.com');
      expect(res.body.groupName).toBe('Test Group');
    });

    it('should return 400 for an invalid token', async () => {
      const res = await request(app).get('/api/invitations/verify/invalid_token');
      expect(res.statusCode).toBe(400);
    });
  });

  describe('POST /api/invitations/accept/:token', () => {
    it('should allow a user to accept a valid invitation', async () => {
      const res = await request(app).post('/api/invitations/accept/test_token');
      expect(res.statusCode).toBe(200);
      const player = await Player.findOne({ userId: 'user1', groupid: 'group1' });
      expect(player).not.toBeNull();
    });

    it('should return 403 if the user email does not match the invitation email', async () => {
        await invitation.updateOne({$set: {email: 'another@example.com' }});
        const res = await request(app).post('/api/invitations/accept/test_token');
        expect(res.statusCode).toBe(403);
    });
  });
});
