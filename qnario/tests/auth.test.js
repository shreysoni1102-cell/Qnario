const request = require('supertest');
const app = require('../server');

describe('Auth Routes', () => {
  test('POST /api/auth/register returns 400 with missing fields', async () => {
    const res = await request(app).post('/api/auth/register').send({});
    expect(res.statusCode).toBe(400);
  });

  test('POST /api/auth/login returns 400 with wrong credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'fake@test.com', password: 'wrongpass' });
    expect(res.statusCode).toBeGreaterThanOrEqual(400);
  });
});

describe('Health Check', () => {
  test('GET /api/health returns 200', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
  });
});
