import request from 'supertest';
import { app } from '../server.js';
import { promises as fs } from 'fs';
import path from 'path';

describe('Version API', () => {
  it('should return the correct version from package.json', async () => {
    const packageJsonPath = path.resolve(process.cwd(), 'package.json');
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
    const expectedVersion = packageJson.version;

    const response = await request(app).get('/api/version');

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('version', expectedVersion);
  });
});
