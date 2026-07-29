const { body } = require('express-validator');

// Accepts 'HH:MM' or 'HH:MM:SS', 24-hour clock.
const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/;

const updateSettingsValidator = [
  body('workingStartTime').matches(TIME_REGEX).withMessage('workingStartTime must be a valid 24-hour time (HH:MM)'),
  body('workingEndTime').matches(TIME_REGEX).withMessage('workingEndTime must be a valid 24-hour time (HH:MM)'),
  body().custom((value) => {
    const { workingStartTime, workingEndTime } = value;
    if (TIME_REGEX.test(workingStartTime) && TIME_REGEX.test(workingEndTime)) {
      if (workingStartTime >= workingEndTime) {
        throw new Error('workingStartTime must be earlier than workingEndTime');
      }
    }
    return true;
  }),
];

module.exports = { updateSettingsValidator };
