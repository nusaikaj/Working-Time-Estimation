const taskService = require('../services/taskService');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

const list = asyncHandler(async (req, res) => {
  const { page, limit, status, search } = req.query;
  const result = await taskService.listForUser(req.user, { page, limit, status, search });
  new ApiResponse(200, result, 'Tasks retrieved').send(res, 200);
});

const stats = asyncHandler(async (req, res) => {
  const result = await taskService.getStats(req.user);
  new ApiResponse(200, result, 'Dashboard statistics retrieved').send(res, 200);
});

const getById = asyncHandler(async (req, res) => {
  const task = await taskService.getByIdForUser(req.params.id, req.user);
  new ApiResponse(200, task, 'Task retrieved').send(res, 200);
});

const create = asyncHandler(async (req, res) => {
  const { title, description, assignedEngineer, status } = req.body;
  const task = await taskService.create({ title, description, assignedEngineer, status });
  new ApiResponse(201, task, 'Task created').send(res, 201);
});

const update = asyncHandler(async (req, res) => {
  const { title, description, status } = req.body;
  const task = await taskService.update(req.params.id, { title, description, status });
  new ApiResponse(200, task, 'Task updated').send(res, 200);
});

const assign = asyncHandler(async (req, res) => {
  const task = await taskService.assign(req.params.id, req.body.assignedEngineer);
  new ApiResponse(200, task, 'Engineer assigned').send(res, 200);
});

const submitEstimate = asyncHandler(async (req, res) => {
  const task = await taskService.submitEstimate(req.params.id, req.user, req.body.estimateDays);
  new ApiResponse(200, task, 'Estimate submitted').send(res, 200);
});

const calculate = asyncHandler(async (req, res) => {
  const task = await taskService.calculate(req.params.id, req.body.startDateTime);
  new ApiResponse(200, task, 'End date calculated').send(res, 200);
});

module.exports = { list, stats, getById, create, update, assign, submitEstimate, calculate };
