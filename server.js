require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const { PORT } = require('./src/config/constants');
const { connectDb } = require('./src/config/db');
const { initLiveReloadWatcher } = require('./src/services/liveReloadService');
const routes = require('./src/routes');

const app = express();

// Core Express Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public'), { index: false }));

// Connect to MongoDB Atlas
connectDb();

// Development Live-Reload Watcher
initLiveReloadWatcher();

// Mount Application Routes
app.use(routes);

// Server Startup with Port In-Use Fallback
const startServer = (port) => {
  const server = app.listen(port, () => {
    console.log(`====================================================`);
    console.log(`🚀 OTP88 Platform Server running on port ${port}`);
    console.log(`🌐 Open: http://localhost:${port}`);
    console.log(`====================================================`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${port} is in use, trying port ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('Server error:', err);
    }
  });
};

startServer(parseInt(PORT, 10));

module.exports = app;
