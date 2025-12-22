import { jest, describe, beforeEach, afterEach, it, expect } from '@jest/globals';

// This is the mock function we will use to control the behavior of verifyIdToken
const mockedVerifyIdToken = jest.fn();

// Use jest.unstable_mockModule to mock the ES module for google-auth-library
jest.unstable_mockModule('google-auth-library', () => ({
  // Mock the OAuth2Client class
  OAuth2Client: jest.fn().mockImplementation(() => ({
    // Mock the verifyIdToken method on instances of the class
    verifyIdToken: mockedVerifyIdToken,
  })),
}));

// Mock the config module to provide a dummy JWT secret
jest.unstable_mockModule('../config.js', () => ({
  config: {
    jwt_secret: 'test-secret',
    // Add other config values if they are needed by other parts of the app during tests
  },
}));

// Dynamically import the modules AFTER setting up the mock
const request = (await import('supertest')).default;
const { app } = await import('../server.js');
const User = (await import('../models/userModel.js')).default;

describe('Auth Routes', () => {
  const mockGoogleUser = {
    sub: '12345',
    email: 'test@example.com',
    name: 'Test User',
    picture: 'http://example.com/picture.jpg',
  };

  beforeEach(() => {
    // Before each test, set the mock to return a resolved promise with the mock user payload
    mockedVerifyIdToken.mockResolvedValue({
      getPayload: () => mockGoogleUser,
    });
  });

  afterEach(async () => {
    // Clean up the database and clear the mock after each test
    await User.deleteMany({});
    mockedVerifyIdToken.mockClear();
  });

  describe('POST /api/auth/google', () => {
    it('should create a new user and return user data', async () => {
      const res = await request(app)
        .post('/api/auth/google')
        .send({ credential: 'any_google_token' }); // The actual token doesn't matter because it's mocked

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('email', mockGoogleUser.email);
      expect(res.headers['set-cookie'][0]).toMatch(/token=.+; Max-Age=.+; Path=\/; Expires=.+; HttpOnly; SameSite=Strict/);

      const user = await User.findOne({ googleId: mockGoogleUser.sub });
      expect(user).not.toBeNull();
      expect(user.email).toBe(mockGoogleUser.email);
    });

    it('should log in an existing user and return user data', async () => {
      // Pre-seed the database with an existing user
      await new User({
        googleId: mockGoogleUser.sub,
        id: 'test_id',
        email: mockGoogleUser.email,
        name: mockGoogleUser.name,
      }).save();

      const res = await request(app)
        .post('/api/auth/google')
        .send({ credential: 'any_google_token' });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('email', mockGoogleUser.email);
      expect(res.headers['set-cookie'][0]).toMatch(/token=/);
    });

    it('should return 400 if credential is missing', async () => {
      const res = await request(app).post('/api/auth/google').send({});
      expect(res.statusCode).toBe(400);
    });
  });

  describe('POST /api/auth/google/mobile', () => {
    it('should create a new user and return a token', async () => {
      const res = await request(app)
        .post('/api/auth/google/mobile')
        .send({ token: 'any_google_token' });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
      const user = await User.findOne({ googleId: mockGoogleUser.sub });
      expect(user).not.toBeNull();
      expect(user.email).toBe(mockGoogleUser.email);
    });

    it('should log in an existing user and return a token', async () => {
      // Pre-seed the database
      await new User({
        googleId: mockGoogleUser.sub,
        id: 'test_id',
        email: mockGoogleUser.email,
        name: mockGoogleUser.name,
      }).save();

      const res = await request(app)
        .post('/api/auth/google/mobile')
        .send({ token: 'any_google_token' });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
    });

    it('should return 400 if token is missing', async () => {
      const res = await request(app).post('/api/auth/google/mobile').send({});
      expect(res.statusCode).toBe(400);
    });
  });
});
