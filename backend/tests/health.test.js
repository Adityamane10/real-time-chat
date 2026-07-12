require('./setup');
const request = require('supertest');
const app = require('../src/app');

describe('GET /api/health', () => {
  it('should return server and database status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('server', 'running');
    expect(res.body.data).toHaveProperty('database');
  });
});
