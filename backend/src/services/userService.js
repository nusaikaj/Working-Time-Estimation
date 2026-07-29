const fs = require('fs');
const path = require('path');
const { User } = require('../models');
const ApiError = require('../utils/ApiError');

/** Updates the current user's own display name (self-service, any role). */
async function updateProfile(userId, { name }) {
  const user = await User.findByPk(userId);
  if (!user) {
    throw ApiError.notFound('User not found');
  }
  user.name = name;
  await user.save();
  return user;
}

/**
 * Replaces the current user's avatar with the newly uploaded file, deleting
 * the previous one from disk (if any) so orphaned images don't accumulate.
 */
async function setAvatar(userId, uploadedFilename) {
  const user = await User.findByPk(userId);
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  const previousImage = user.profileImage;
  user.profileImage = `/uploads/avatars/${uploadedFilename}`;
  await user.save();

  if (previousImage) {
    const previousPath = path.resolve(__dirname, '..', '..', previousImage.replace(/^\//, ''));
    fs.unlink(previousPath, () => {}); // best-effort cleanup, never blocks the response
  }

  return user;
}

async function removeAvatar(userId) {
  const user = await User.findByPk(userId);
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  const previousImage = user.profileImage;
  user.profileImage = null;
  await user.save();

  if (previousImage) {
    const previousPath = path.resolve(__dirname, '..', '..', previousImage.replace(/^\//, ''));
    fs.unlink(previousPath, () => {});
  }

  return user;
}

module.exports = { updateProfile, setAvatar, removeAvatar };
