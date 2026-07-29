/**
 * Express application wiring: security/middleware stack + routes + central
 * error handler. Deliberately does NOT call app.listen() — see server.js —
 * so tests/integration/*.test.js can import this module and drive it with
 * Supertest without binding a real port.
 */
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');

const env = require('./config/env');
const routes = require('./routes');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler.middleware');

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.clientOrigin,
    credentials: true,
  })
);
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

if (env.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

// Uploaded profile photos. Always reached through the same-origin proxy
// (Vite dev proxy / Nginx in prod — see vite.config.js and nginx.conf), but
// the resource policy is relaxed anyway so a direct cross-origin <img> tag
// never gets silently blocked.
app.use(
  '/uploads',
  (req, res, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
  },
  express.static(path.resolve(__dirname, '..', 'uploads'))
);

app.use('/api', routes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
