require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const { PORT, IS_PRODUCTION, ALLOWED_ORIGINS, assertProductionConfig } = require('./src/config/constants');
const { connectDb } = require('./src/config/db');
const { initLiveReloadWatcher } = require('./src/services/liveReloadService');
const routes = require('./src/routes');

assertProductionConfig();

const app = express();

// Behind Render / any reverse proxy: trust the first hop so req.ip and rate limits use the client IP
app.set('trust proxy', 1);

// Security headers. CSP is left off because the marketing pages use inline scripts and Google Fonts.
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));

// CORS: same-origin requests and server-to-server API calls carry no Origin header and are always allowed.
// Browser requests from other origins are only allowed when listed in ALLOWED_ORIGINS (comma separated).
app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (!IS_PRODUCTION && ALLOWED_ORIGINS.length === 0) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    return callback(null, false);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Webhook-Token']
}));

app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));
app.use(express.static(path.join(__dirname, 'public'), { index: false }));

connectDb();
initLiveReloadWatcher();

app.use(routes);

// JSON error handler for API routes (malformed JSON bodies, unexpected throws)
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  const status = err.type === 'entity.parse.failed' ? 400 : (err.status || 500);
  const message = status === 400 ? 'Malformed JSON request body.' : (status === 413 ? 'Request body too large.' : 'Internal server error.');
  if (status >= 500) console.error('Unhandled error:', err);
  res.status(status).json({ success: false, error: message });
});

// Server startup. In development, fall back to the next port if the requested one is busy.
const startServer = (port) => {
  app.listen(port, () => {
    console.log(`====================================================`);
    console.log(`🚀 OTP88 Platform Server running on port ${port}`);
    console.log(`🌐 Open: http://localhost:${port}`);
    console.log(`====================================================`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE' && !IS_PRODUCTION) {
      console.log(`Port ${port} is in use, trying port ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('Server error:', err);
      process.exit(1);
    }
  });
};

if (require.main === module) {
  startServer(parseInt(PORT, 10));
}

module.exports = app;
