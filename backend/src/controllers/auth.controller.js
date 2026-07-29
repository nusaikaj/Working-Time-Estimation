const authService = require('../services/authService');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const result = await authService.register({ name, email, password });
  new ApiResponse(201, result, 'Registration successful').send(res, 201);
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login({ email, password });
  new ApiResponse(200, result, 'Login successful').send(res, 200);
});

const me = asyncHandler(async (req, res) => {
  new ApiResponse(200, req.user.toSafeJSON(), 'Current user').send(res, 200);
});

module.exports = { register, login, me };
