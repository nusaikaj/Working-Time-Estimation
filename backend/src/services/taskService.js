const { Op } = require('sequelize');
const { Task, User } = require('../models');
const ApiError = require('../utils/ApiError');
const settingsService = require('./settingsService');
const holidayService = require('./holidayService');
const { calculateEndDateTime } = require('./timeCalculationService');

const engineerSummary = { model: User, as: 'engineer', attributes: ['id', 'name', 'email', 'profileImage'] };

/**
 * Lists tasks scoped by role: a PM sees everything, an ENGINEER only ever
 * sees tasks assigned to them — enforced here in the service layer (not just
 * hidden in the UI) so an engineer can never enumerate another engineer's
 * work even by calling the API directly.
 */
async function listForUser(user, { page = 1, limit = 10, status, search } = {}) {
  const where = {};
  if (user.role === 'ENGINEER') {
    where.assignedEngineer = user.id;
  }
  if (status) {
    where.status = status;
  }
  if (search) {
    where.title = { [Op.like]: `%${search}%` };
  }

  const offset = (Number(page) - 1) * Number(limit);
  const { rows, count } = await Task.findAndCountAll({
    where,
    include: [engineerSummary],
    order: [['createdAt', 'DESC']],
    limit: Number(limit),
    offset,
  });

  return {
    tasks: rows,
    pagination: {
      total: count,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.max(1, Math.ceil(count / Number(limit))),
    },
  };
}

/** Returns dashboard counters, scoped the same way as listForUser. */
async function getStats(user) {
  const where = user.role === 'ENGINEER' ? { assignedEngineer: user.id } : {};

  const [total, completed, pending, engineerCount] = await Promise.all([
    Task.count({ where }),
    Task.count({ where: { ...where, status: 'COMPLETED' } }),
    Task.count({ where: { ...where, status: { [Op.ne]: 'COMPLETED' } } }),
    user.role === 'PM' ? User.count({ where: { role: 'ENGINEER' } }) : Promise.resolve(null),
  ]);

  return { total, completed, pending, engineers: engineerCount };
}

async function getByIdForUser(id, user) {
  const task = await Task.findByPk(id, { include: [engineerSummary] });
  if (!task) {
    throw ApiError.notFound('Task not found');
  }
  if (user.role === 'ENGINEER' && task.assignedEngineer !== user.id) {
    // 404 rather than 403 — an engineer should not be able to distinguish
    // "doesn't exist" from "exists but isn't mine".
    throw ApiError.notFound('Task not found');
  }
  return task;
}

async function create({ title, description, assignedEngineer, status }) {
  if (assignedEngineer) {
    const engineer = await User.findOne({ where: { id: assignedEngineer, role: 'ENGINEER' } });
    if (!engineer) {
      throw ApiError.badRequest('assignedEngineer must reference an existing engineer');
    }
  }
  return Task.create({ title, description, assignedEngineer: assignedEngineer || null, status });
}

async function update(id, { title, description, status }) {
  const task = await Task.findByPk(id);
  if (!task) {
    throw ApiError.notFound('Task not found');
  }
  if (title !== undefined) task.title = title;
  if (description !== undefined) task.description = description;
  if (status !== undefined) task.status = status;
  await task.save();
  return task;
}

async function assign(id, assignedEngineer) {
  const task = await Task.findByPk(id);
  if (!task) {
    throw ApiError.notFound('Task not found');
  }
  const engineer = await User.findOne({ where: { id: assignedEngineer, role: 'ENGINEER' } });
  if (!engineer) {
    throw ApiError.badRequest('assignedEngineer must reference an existing engineer');
  }
  task.assignedEngineer = assignedEngineer;
  await task.save();
  return task;
}

/** An engineer submits (or updates) their own estimate — ownership re-checked here. */
async function submitEstimate(id, user, estimateDays) {
  const task = await Task.findByPk(id);
  if (!task) {
    throw ApiError.notFound('Task not found');
  }
  if (task.assignedEngineer !== user.id) {
    throw ApiError.forbidden('You can only submit an estimate for tasks assigned to you');
  }
  task.estimateDays = estimateDays;
  if (task.status === 'PENDING') {
    task.status = 'IN_PROGRESS';
  }
  await task.save();
  return task;
}

/**
 * Runs the calculation engine and persists the result. This is the ONLY
 * place in the whole app that calls calculateEndDateTime — the frontend
 * never computes this itself, exactly as the spec requires.
 */
async function calculate(id, startDateTime) {
  const task = await Task.findByPk(id);
  if (!task) {
    throw ApiError.notFound('Task not found');
  }
  if (task.estimateDays === null || task.estimateDays === undefined) {
    throw ApiError.badRequest('The assigned engineer has not submitted an estimate yet');
  }

  const [settings, recurringHolidays, oneTimeHolidays] = await Promise.all([
    settingsService.getSettings(),
    holidayService.listRecurring(),
    holidayService.listOneTime(),
  ]);

  const calculatedEndDateTime = calculateEndDateTime({
    startDateTime,
    estimateDays: task.estimateDays,
    workingStartTime: settings.workingStartTime,
    workingEndTime: settings.workingEndTime,
    recurringHolidays: recurringHolidays.map((h) => ({ month: h.month, day: h.day })),
    oneTimeHolidays: oneTimeHolidays.map((h) => h.holidayDate),
  });

  task.startDateTime = new Date(startDateTime);
  task.calculatedEndDateTime = calculatedEndDateTime;
  await task.save();
  return task;
}

module.exports = {
  listForUser,
  getStats,
  getByIdForUser,
  create,
  update,
  assign,
  submitEstimate,
  calculate,
};
