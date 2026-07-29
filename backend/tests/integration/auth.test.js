/**
 * Integration tests: drives the real Express app (src/app.js) with Supertest
 * against a live MySQL test database (DB_NAME_TEST in .env). Requires the
 * test database to exist — see README "Run Tests" for setup.
 */
const request = require('supertest');
const app = require('../../src/app');
const { sequelize, User } = require('../../src/models');

beforeAll(async () => {
  // Ephemeral test DB: recreate the schema fresh for this run instead of
  // depending on migrations having been run beforehand.
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

afterEach(async () => {
  // Plain DELETE rather than TRUNCATE: MySQL rejects truncating a table that
  // a foreign key elsewhere (tasks.assignedEngineer) references, even though
  // this suite never populates that table.
  await User.destroy({ where: {} });
});

describe('POST /api/auth/register', () => {
  test('registers a new engineer with a strong password', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test Engineer',
      email: 'newengineer@example.com',
      password: 'Str0ng!Pass',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toEqual(expect.any(String));
    expect(res.body.data.user.role).toBe('ENGINEER');
    expect(res.body.data.user).not.toHaveProperty('password');
  });

  test('rejects registration with a weak password', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Weak Password',
      email: 'weak@example.com',
      password: 'password',
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('rejects duplicate email registration', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'First',
      email: 'dupe@example.com',
      password: 'Str0ng!Pass',
    });

    const res = await request(app).post('/api/auth/register').send({
      name: 'Second',
      email: 'dupe@example.com',
      password: 'Str0ng!Pass',
    });

    expect(res.status).toBe(409);
  });

  test('never allows a client to self-register as PM', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Sneaky',
      email: 'sneaky@example.com',
      password: 'Str0ng!Pass',
      role: 'PM',
    });

    expect(res.status).toBe(201);
    expect(res.body.data.user.role).toBe('ENGINEER');
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Login Test',
      email: 'logintest@example.com',
      password: 'Str0ng!Pass',
    });
  });

  test('logs in with correct credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'logintest@example.com',
      password: 'Str0ng!Pass',
    });

    expect(res.status).toBe(200);
    expect(res.body.data.token).toEqual(expect.any(String));
  });

  test('rejects an incorrect password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'logintest@example.com',
      password: 'WrongPassword1!',
    });

    expect(res.status).toBe(401);
  });

  test('rejects a non-existent email', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'doesnotexist@example.com',
      password: 'Str0ng!Pass',
    });

    expect(res.status).toBe(401);
  });
});

describe('GET /api/auth/me', () => {
  test('returns 401 without a token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  test('returns the current user profile with a valid token', async () => {
    const registerRes = await request(app).post('/api/auth/register').send({
      name: 'Me Test',
      email: 'metest@example.com',
      password: 'Str0ng!Pass',
    });
    const { token } = registerRes.body.data;

    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe('metest@example.com');
  });

  test('rejects a malformed token', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer not-a-valid-token');
    expect(res.status).toBe(401);
  });
});
