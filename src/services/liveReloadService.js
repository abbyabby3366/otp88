const path = require('path');
const fs = require('fs');

let liveReloadClients = [];

function handleLiveReloadSse(req, res) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  if (res.flushHeaders) res.flushHeaders();

  liveReloadClients.push(res);
  req.on('close', () => {
    liveReloadClients = liveReloadClients.filter(c => c !== res);
  });
}

function broadcastLiveReload() {
  liveReloadClients.forEach(client => {
    try {
      client.write('data: reload\n\n');
    } catch (e) {
      // Client already disconnected; it is removed by the 'close' handler
    }
  });
}

/**
 * Watches the Vite output folder during local development and tells open browser
 * tabs to reload when the bundle changes. Disabled in production and in tests.
 */
function initLiveReloadWatcher() {
  const env = process.env.NODE_ENV;
  if (env === 'production' || env === 'test') return;

  const distBundlePath = path.join(__dirname, '../../public', 'dist');
  if (!fs.existsSync(distBundlePath)) return;

  try {
    let reloadTimer = null;
    const watcher = fs.watch(distBundlePath, (eventType, filename) => {
      if (filename && filename.endsWith('.js')) {
        if (reloadTimer) clearTimeout(reloadTimer);
        reloadTimer = setTimeout(broadcastLiveReload, 120);
      }
    });
    // Never keep the process alive just for the watcher
    if (typeof watcher.unref === 'function') watcher.unref();
  } catch (err) {
    console.warn('Live-reload fs.watch disabled:', err.message);
  }
}

module.exports = {
  handleLiveReloadSse,
  broadcastLiveReload,
  initLiveReloadWatcher
};
