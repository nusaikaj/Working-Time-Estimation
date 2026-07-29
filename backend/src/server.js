/**
 * Process entry point: verifies the DB connection, then starts listening.
 * Kept separate from app.js so Supertest can exercise the app without a
 * live network socket.
 */
const app = require('./app');
const env = require('./config/env');
const { sequelize } = require('./models');
const logger = require('./utils/logger');

async function start() {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established.');

    app.listen(env.port, () => {
      logger.info(`Server listening on port ${env.port} [${env.nodeEnv}]`);
    });
  } catch (err) {
    logger.error('Unable to start server:', err);
    process.exit(1);
  }
}

start();
