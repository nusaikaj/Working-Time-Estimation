const path = require('path');
const fs = require('fs');
const multer = require('multer');
const ApiError = require('../utils/ApiError');

const AVATARS_DIR = path.resolve(__dirname, '..', '..', 'uploads', 'avatars');
fs.mkdirSync(AVATARS_DIR, { recursive: true });

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_FILE_SIZE_BYTES = 3 * 1024 * 1024; // 3MB

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, AVATARS_DIR),
  filename: (req, file, cb) => {
    // req.user is attached by requireAuth, which always runs before this
    // middleware on every avatar route — the filename ties one user to at
    // most one current file, so re-uploading naturally replaces the old one
    // once the old file is removed by the controller.
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `${req.user.id}-${Date.now()}${ext}`);
  },
});

const uploadAvatar = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return cb(ApiError.badRequest('Only JPEG, PNG, WEBP or GIF images are allowed'));
    }
    return cb(null, true);
  },
}).single('avatar');

/** Wraps multer so its errors flow through the app's normal error handler. */
function handleAvatarUpload(req, res, next) {
  uploadAvatar(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(ApiError.badRequest('Image must be 3MB or smaller'));
      }
      return next(ApiError.badRequest(err.message));
    }
    if (err) return next(err);
    if (!req.file) return next(ApiError.badRequest('No image file was provided'));
    return next();
  });
}

module.exports = { handleAvatarUpload, AVATARS_DIR };
