/**
 * Bootstraps every model against the shared Sequelize instance and wires up
 * associations. Import `db.User`, `db.Task`, etc. from this file everywhere
 * else in the app instead of requiring individual model files directly.
 */
const sequelize = require('../config/database');

const db = {};

db.User = require('./user.model')(sequelize);
db.Task = require('./task.model')(sequelize);
db.WorkingSettings = require('./workingSettings.model')(sequelize);
db.RecurringHoliday = require('./recurringHoliday.model')(sequelize);
db.OneTimeHoliday = require('./oneTimeHoliday.model')(sequelize);

Object.values(db).forEach((model) => {
  if (typeof model.associate === 'function') {
    model.associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = sequelize.constructor;

module.exports = db;
