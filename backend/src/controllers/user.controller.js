const { User } = require('../models');
const userService = require('../services/userService');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

/** PM-only: list every engineer, used to populate the "assign engineer" dropdown. */
const listEngineers = asyncHandler(async (req, res) => {
  const engineers = await User.findAll({
    where: { role: 'ENGINEER' },
    attributes: ['id', 'name', 'email', 'profileImage'],
    order: [['name', 'ASC']],
  });
  new ApiResponse(200, engineers, 'Engineers retrieved').send(res, 200);
});

/** Self-service: update your own display name — any authenticated role. */
const updateMe = asyncHandler(async (req, res) => {
  const user = await userService.updateProfile(req.user.id, { name: req.body.name });
  new ApiResponse(200, user.toSafeJSON(), 'Profile updated').send(res, 200);
});

/** Self-service: replace your own avatar — any authenticated role. */
const uploadAvatar = asyncHandler(async (req, res) => {
  const user = await userService.setAvatar(req.user.id, req.file.filename);
  new ApiResponse(200, user.toSafeJSON(), 'Profile photo updated').send(res, 200);
});

/** Self-service: remove your own avatar, reverting to initials — any authenticated role. */
const removeAvatar = asyncHandler(async (req, res) => {
  const user = await userService.removeAvatar(req.user.id);
  new ApiResponse(200, user.toSafeJSON(), 'Profile photo removed').send(res, 200);
});

module.exports = { listEngineers, updateMe, uploadAvatar, removeAvatar };
