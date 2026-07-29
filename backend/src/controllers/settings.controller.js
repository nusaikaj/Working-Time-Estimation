const settingsService = require('../services/settingsService');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

const getSettings = asyncHandler(async (req, res) => {
  const settings = await settingsService.getSettings();
  new ApiResponse(200, settings, 'Working settings retrieved').send(res, 200);
});

const updateSettings = asyncHandler(async (req, res) => {
  const { workingStartTime, workingEndTime } = req.body;
  const settings = await settingsService.updateSettings({ workingStartTime, workingEndTime });
  new ApiResponse(200, settings, 'Working settings updated').send(res, 200);
});

module.exports = { getSettings, updateSettings };
