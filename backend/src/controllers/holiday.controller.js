const holidayService = require('../services/holidayService');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

const listRecurring = asyncHandler(async (req, res) => {
  const holidays = await holidayService.listRecurring();
  new ApiResponse(200, holidays, 'Recurring holidays retrieved').send(res, 200);
});

const addRecurring = asyncHandler(async (req, res) => {
  const { month, day } = req.body;
  const holiday = await holidayService.addRecurring({ month, day });
  new ApiResponse(201, holiday, 'Recurring holiday added').send(res, 201);
});

const removeRecurring = asyncHandler(async (req, res) => {
  await holidayService.removeRecurring(req.params.id);
  new ApiResponse(200, null, 'Recurring holiday removed').send(res, 200);
});

const listOneTime = asyncHandler(async (req, res) => {
  const holidays = await holidayService.listOneTime();
  new ApiResponse(200, holidays, 'One-time holidays retrieved').send(res, 200);
});

const addOneTime = asyncHandler(async (req, res) => {
  const { holidayDate } = req.body;
  const holiday = await holidayService.addOneTime({ holidayDate });
  new ApiResponse(201, holiday, 'One-time holiday added').send(res, 201);
});

const removeOneTime = asyncHandler(async (req, res) => {
  await holidayService.removeOneTime(req.params.id);
  new ApiResponse(200, null, 'One-time holiday removed').send(res, 200);
});

module.exports = { listRecurring, addRecurring, removeRecurring, listOneTime, addOneTime, removeOneTime };
