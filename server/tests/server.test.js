const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../server');

describe('Health Check Endpoint', () => {
  let serverInstance;

  beforeAll((done) => {
    // Port 0 picks any free port to avoid conflict during tests
    serverInstance = app.listen(0, () => done());
  });

  afterAll(async () => {
    await new Promise((resolve) => serverInstance.close(resolve));
    await mongoose.connection.close();
  });

  test('GET /api/health returns 200 and success status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('healthy');
  });

  test('GET /api/docs returns 200 HTML content', async () => {
    const res = await request(app).get('/api/docs');
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
  });

  test('GET /invalid-route returns 404', async () => {
    const res = await request(app).get('/invalid-route');
    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
