'use strict';

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');

const env = require('./config/env');
const routes = require('./routes');
const { UPLOAD_ROOT } = require('./middlewares/upload');
const { apiLimiter } = require('./middlewares/rateLimit');
const { notFoundHandler, errorHandler } = require('./middlewares/error');

const app = express();

// Behind a reverse proxy (nginx/ELB): trust X-Forwarded-* so rate-limit & IPs work.
if (env.trustProxy) app.set('trust proxy', 1);

// Security & parsing
app.use(helmet());
const allowAllCors = env.corsOrigins.includes('*');
app.use(
  cors({
    origin: allowAllCors ? true : env.corsOrigins,
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
if (!env.isTest) app.use(morgan(env.isProd ? 'combined' : 'dev'));

// Serve uploaded files (documents, avatars, selfies)
app.use('/uploads', express.static(UPLOAD_ROOT));

// Rate limiting on the API surface
app.use(env.apiPrefix, apiLimiter);

// Routes
app.use(env.apiPrefix, routes);

// 404 + error handling
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
