/**
 * Config consumed only by sequelize-cli (migrations/seeders run outside the
 * app, so they can't use the Sequelize instance in database.js directly).
 * Kept in sync with env.js but expressed in the plain-object shape the CLI
 * expects.
 */
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });

const base = {
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  dialect: process.env.DB_DIALECT || 'mysql',
};

module.exports = {
  development: { ...base, database: process.env.DB_NAME || 'working_time_estimation' },
  test: { ...base, database: process.env.DB_NAME_TEST || 'working_time_estimation_test' },
  production: { ...base, database: process.env.DB_NAME || 'working_time_estimation' },
};
