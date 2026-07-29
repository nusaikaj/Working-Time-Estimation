/**
 * Centralised, validated access to process.env.
 * Every other module reads configuration from here instead of process.env
 * directly, so a missing/invalid variable fails fast at boot with a clear
 * message instead of surfacing as a confusing runtime error later.
 */
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });

const REQUIRED_IN_PRODUCTION = ['JWT_SECRET', 'DB_HOST', 'DB_NAME', 'DB_USER'];

const nodeEnv = process.env.NODE_ENV || 'development';

if (nodeEnv === 'production') {
  const missing = REQUIRED_IN_PRODUCTION.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

const env = {
  nodeEnv,
  isProduction: nodeEnv === 'production',
  isTest: nodeEnv === 'test',
  port: parseInt(process.env.PORT, 10) || 5000,
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',

  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    name: nodeEnv === 'test' ? process.env.DB_NAME_TEST || 'working_time_estimation_test' : process.env.DB_NAME || 'working_time_estimation',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    dialect: process.env.DB_DIALECT || 'mysql',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'dev_only_insecure_secret_change_me',
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  },

  bcrypt: {
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10,
  },
};

module.exports = env;
