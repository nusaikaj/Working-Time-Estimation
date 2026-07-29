const { RecurringHoliday, OneTimeHoliday } = require('../models');
const ApiError = require('../utils/ApiError');

async function listRecurring() {
  return RecurringHoliday.findAll({ order: [['month', 'ASC'], ['day', 'ASC']] });
}

async function addRecurring({ month, day }) {
  const existing = await RecurringHoliday.findOne({ where: { month, day } });
  if (existing) {
    throw ApiError.conflict('This recurring holiday already exists');
  }
  return RecurringHoliday.create({ month, day });
}

async function removeRecurring(id) {
  const holiday = await RecurringHoliday.findByPk(id);
  if (!holiday) {
    throw ApiError.notFound('Recurring holiday not found');
  }
  await holiday.destroy();
}

async function listOneTime() {
  return OneTimeHoliday.findAll({ order: [['holidayDate', 'ASC']] });
}

async function addOneTime({ holidayDate }) {
  const existing = await OneTimeHoliday.findOne({ where: { holidayDate } });
  if (existing) {
    throw ApiError.conflict('This one-time holiday already exists');
  }
  return OneTimeHoliday.create({ holidayDate });
}

async function removeOneTime(id) {
  const holiday = await OneTimeHoliday.findByPk(id);
  if (!holiday) {
    throw ApiError.notFound('One-time holiday not found');
  }
  await holiday.destroy();
}

module.exports = { listRecurring, addRecurring, removeRecurring, listOneTime, addOneTime, removeOneTime };
