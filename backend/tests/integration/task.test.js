/**
 * Integration tests for the task lifecycle: create -> assign -> engineer
 * submits estimate -> PM calculates end date, plus role-based authorization
 * (an engineer can never see or act on another engineer's tasks, and only a
 * PM can create/assign/calculate/manage settings & holidays).
 */
const bcrypt = require('bcrypt');
const request = require('supertest');
const app = require('../../src/app');
const { sequelize, User, Task, WorkingSettings, RecurringHoliday, OneTimeHoliday } = require('../../src/models');

let pmToken;
let engineerAToken;
let engineerBToken;
let engineerAId;
let engineerBId;

async function createUser({ name, email, role }) {
  const password = await bcrypt.hash('Str0ng!Pass', 4);
  const user = await User.create({ name, email, password, role });

  const loginRes = await request(app).post('/api/auth/login').send({ email, password: 'Str0ng!Pass' });
  return { user, token: loginRes.body.data.token };
}

beforeAll(async () => {
  await sequelize.sync({ force: true });

  const pm = await createUser({ name: 'PM User', email: 'pm.test@example.com', role: 'PM' });
  pmToken = pm.token;

  const engA = await createUser({ name: 'Engineer A', email: 'enga.test@example.com', role: 'ENGINEER' });
  engineerAToken = engA.token;
  engineerAId = engA.user.id;

  const engB = await createUser({ name: 'Engineer B', email: 'engb.test@example.com', role: 'ENGINEER' });
  engineerBToken = engB.token;
  engineerBId = engB.user.id;

  await WorkingSettings.create({ workingStartTime: '08:00:00', workingEndTime: '16:00:00' });
  await RecurringHoliday.create({ month: 5, day: 17 });
  await OneTimeHoliday.create({ holidayDate: '2004-05-27' });
});

afterAll(async () => {
  await sequelize.close();
});

afterEach(async () => {
  // Plain DELETE rather than TRUNCATE — consistent with auth.test.js, and
  // avoids relying on MySQL TRUNCATE/FK behavior at all.
  await Task.destroy({ where: {} });
});

describe('Task creation and authorization', () => {
  test('a PM can create a task', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${pmToken}`)
      .send({ title: 'Design the API', description: 'Draft the OpenAPI spec' });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('PENDING');
  });

  test('an engineer cannot create a task', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${engineerAToken}`)
      .send({ title: 'Should not be allowed' });

    expect(res.status).toBe(403);
  });

  test('creating a task without a title fails validation', async () => {
    const res = await request(app).post('/api/tasks').set('Authorization', `Bearer ${pmToken}`).send({ title: '' });
    expect(res.status).toBe(400);
  });

  test('an unauthenticated request is rejected', async () => {
    const res = await request(app).post('/api/tasks').send({ title: 'No auth' });
    expect(res.status).toBe(401);
  });
});

describe('Task assignment', () => {
  test('a PM can assign an engineer to a task', async () => {
    const createRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${pmToken}`)
      .send({ title: 'Assignable task' });
    const taskId = createRes.body.data.id;

    const assignRes = await request(app)
      .patch(`/api/tasks/${taskId}/assign`)
      .set('Authorization', `Bearer ${pmToken}`)
      .send({ assignedEngineer: engineerAId });

    expect(assignRes.status).toBe(200);
    expect(assignRes.body.data.assignedEngineer).toBe(engineerAId);
  });

  test('an engineer cannot assign a task', async () => {
    const createRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${pmToken}`)
      .send({ title: 'Assignable task 2' });
    const taskId = createRes.body.data.id;

    const res = await request(app)
      .patch(`/api/tasks/${taskId}/assign`)
      .set('Authorization', `Bearer ${engineerAToken}`)
      .send({ assignedEngineer: engineerAId });

    expect(res.status).toBe(403);
  });
});

describe('Row-level visibility between engineers', () => {
  let taskAssignedToA;

  beforeEach(async () => {
    const createRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${pmToken}`)
      .send({ title: "Engineer A's task", assignedEngineer: engineerAId });
    taskAssignedToA = createRes.body.data.id;
  });

  test('engineer A can see their own assigned task', async () => {
    const res = await request(app).get(`/api/tasks/${taskAssignedToA}`).set('Authorization', `Bearer ${engineerAToken}`);
    expect(res.status).toBe(200);
  });

  test("engineer B cannot see engineer A's task (returns 404, not 403, to avoid leaking existence)", async () => {
    const res = await request(app).get(`/api/tasks/${taskAssignedToA}`).set('Authorization', `Bearer ${engineerBToken}`);
    expect(res.status).toBe(404);
  });

  test("engineer B's task list never includes engineer A's task", async () => {
    const res = await request(app).get('/api/tasks').set('Authorization', `Bearer ${engineerBToken}`);
    expect(res.status).toBe(200);
    const ids = res.body.data.tasks.map((t) => t.id);
    expect(ids).not.toContain(taskAssignedToA);
  });

  test('engineer B cannot submit an estimate for engineer A\'s task', async () => {
    const res = await request(app)
      .patch(`/api/tasks/${taskAssignedToA}/estimate`)
      .set('Authorization', `Bearer ${engineerBToken}`)
      .send({ estimateDays: 3.5 });
    expect(res.status).toBe(403);
  });

  test('a PM can see every task regardless of assignment', async () => {
    const res = await request(app).get('/api/tasks').set('Authorization', `Bearer ${pmToken}`);
    expect(res.status).toBe(200);
    const ids = res.body.data.tasks.map((t) => t.id);
    expect(ids).toContain(taskAssignedToA);
  });
});

describe('Estimate submission', () => {
  test('the assigned engineer can submit a fractional, negative-capable estimate', async () => {
    const createRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${pmToken}`)
      .send({ title: 'Estimate task', assignedEngineer: engineerAId });
    const taskId = createRes.body.data.id;

    const res = await request(app)
      .patch(`/api/tasks/${taskId}/estimate`)
      .set('Authorization', `Bearer ${engineerAToken}`)
      .send({ estimateDays: -6.747 });

    expect(res.status).toBe(200);
    expect(Number(res.body.data.estimateDays)).toBeCloseTo(-6.747, 5);
    expect(res.body.data.status).toBe('IN_PROGRESS');
  });

  test('rejects a non-numeric estimate', async () => {
    const createRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${pmToken}`)
      .send({ title: 'Bad estimate task', assignedEngineer: engineerAId });
    const taskId = createRes.body.data.id;

    const res = await request(app)
      .patch(`/api/tasks/${taskId}/estimate`)
      .set('Authorization', `Bearer ${engineerAToken}`)
      .send({ estimateDays: 'not-a-number' });

    expect(res.status).toBe(400);
  });
});

describe('End-to-end: create -> assign -> estimate -> calculate', () => {
  test('reproduces one of the assignment\'s official worked examples end-to-end through the API', async () => {
    const createRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${pmToken}`)
      .send({ title: 'End to end task', assignedEngineer: engineerAId });
    const taskId = createRes.body.data.id;

    await request(app)
      .patch(`/api/tasks/${taskId}/estimate`)
      .set('Authorization', `Bearer ${engineerAToken}`)
      .send({ estimateDays: 12.782709 });

    const calcRes = await request(app)
      .post(`/api/tasks/${taskId}/calculate`)
      .set('Authorization', `Bearer ${pmToken}`)
      .send({ startDateTime: '2004-05-24T08:03:00' });

    expect(calcRes.status).toBe(200);
    const endDate = new Date(calcRes.body.data.calculatedEndDateTime);
    // Expected: 10-06-2004 14:18 (matches services/timeCalculationService.js's own unit test for this vector)
    expect(endDate.getFullYear()).toBe(2004);
    expect(endDate.getMonth()).toBe(5); // June (0-indexed)
    expect(endDate.getDate()).toBe(10);
    expect(endDate.getHours()).toBe(14);
    expect(endDate.getMinutes()).toBe(18);
  });

  test('calculating before an estimate has been submitted fails with a clear error', async () => {
    const createRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${pmToken}`)
      .send({ title: 'No estimate yet', assignedEngineer: engineerAId });
    const taskId = createRes.body.data.id;

    const res = await request(app)
      .post(`/api/tasks/${taskId}/calculate`)
      .set('Authorization', `Bearer ${pmToken}`)
      .send({ startDateTime: '2004-05-24T08:03:00' });

    expect(res.status).toBe(400);
  });

  test('an engineer cannot trigger the calculation themselves', async () => {
    const createRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${pmToken}`)
      .send({ title: 'Engineer cannot calculate', assignedEngineer: engineerAId });
    const taskId = createRes.body.data.id;

    await request(app)
      .patch(`/api/tasks/${taskId}/estimate`)
      .set('Authorization', `Bearer ${engineerAToken}`)
      .send({ estimateDays: 2 });

    const res = await request(app)
      .post(`/api/tasks/${taskId}/calculate`)
      .set('Authorization', `Bearer ${engineerAToken}`)
      .send({ startDateTime: '2004-05-24T08:03:00' });

    expect(res.status).toBe(403);
  });
});

describe('Dashboard statistics', () => {
  test('PM stats include the engineer count; engineer stats are scoped to their own tasks', async () => {
    await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${pmToken}`)
      .send({ title: 'Stat task 1', assignedEngineer: engineerAId, status: 'COMPLETED' });
    await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${pmToken}`)
      .send({ title: 'Stat task 2', assignedEngineer: engineerBId });

    const pmStats = await request(app).get('/api/tasks/stats').set('Authorization', `Bearer ${pmToken}`);
    expect(pmStats.body.data.total).toBeGreaterThanOrEqual(2);
    expect(pmStats.body.data.engineers).toBeGreaterThanOrEqual(2);

    const engineerAStats = await request(app).get('/api/tasks/stats').set('Authorization', `Bearer ${engineerAToken}`);
    expect(engineerAStats.body.data.total).toBe(1);
    expect(engineerAStats.body.data.completed).toBe(1);
  });
});

describe('Settings authorization', () => {
  test('any authenticated user can read working settings', async () => {
    const res = await request(app).get('/api/settings').set('Authorization', `Bearer ${engineerAToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.workingStartTime).toBe('08:00:00');
  });

  test('only a PM can update working settings', async () => {
    const forbidden = await request(app)
      .put('/api/settings')
      .set('Authorization', `Bearer ${engineerAToken}`)
      .send({ workingStartTime: '09:00', workingEndTime: '17:00' });
    expect(forbidden.status).toBe(403);

    const allowed = await request(app)
      .put('/api/settings')
      .set('Authorization', `Bearer ${pmToken}`)
      .send({ workingStartTime: '09:00', workingEndTime: '17:00' });
    expect(allowed.status).toBe(200);

    // restore for other tests
    await request(app)
      .put('/api/settings')
      .set('Authorization', `Bearer ${pmToken}`)
      .send({ workingStartTime: '08:00', workingEndTime: '16:00' });
  });

  test('rejects a working window where start is not before end', async () => {
    const res = await request(app)
      .put('/api/settings')
      .set('Authorization', `Bearer ${pmToken}`)
      .send({ workingStartTime: '17:00', workingEndTime: '09:00' });
    expect(res.status).toBe(400);
  });
});

describe('Holiday management authorization', () => {
  test('only a PM can add a recurring holiday', async () => {
    const forbidden = await request(app)
      .post('/api/holidays/recurring')
      .set('Authorization', `Bearer ${engineerAToken}`)
      .send({ month: 12, day: 25 });
    expect(forbidden.status).toBe(403);

    const allowed = await request(app)
      .post('/api/holidays/recurring')
      .set('Authorization', `Bearer ${pmToken}`)
      .send({ month: 12, day: 25 });
    expect(allowed.status).toBe(201);
  });

  test('only a PM can add a one-time holiday', async () => {
    const res = await request(app)
      .post('/api/holidays/one-time')
      .set('Authorization', `Bearer ${pmToken}`)
      .send({ holidayDate: '2030-01-01' });
    expect(res.status).toBe(201);
  });

  test('any authenticated user can list holidays', async () => {
    const res = await request(app).get('/api/holidays/recurring').set('Authorization', `Bearer ${engineerAToken}`);
    expect(res.status).toBe(200);
  });
});
