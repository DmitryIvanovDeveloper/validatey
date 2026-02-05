'use strict';
// Vercel serverless entry: all requests are rewritten to /api, Express handles paths.
const app = require('../dist/app').default;
module.exports = app;
