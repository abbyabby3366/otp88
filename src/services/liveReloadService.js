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
    } catch (e) {}
  });
}

function initLiveReloadWatcher() {
  if (process.env.NODE_ENV !== 'production') {
    const distBundlePath = path.join(__dirname, '../../public', 'dist');
    if (fs.existsSync(distBundlePath)) {
      try {
        let reloadTimer = null;
        fs.watch(distBundlePath, (eventType, filename) => {
          if (filename && filename.endsWith('.js')) {
            if (reloadTimer) clearTimeout(reloadTimer);
            reloadTimer = setTimeout(() => {
              broadcastLiveReload();
            }, 120);
          }
        });
      } catch (err) {
        console.warn('Live-reload fs.watch disabled:', err.message);
      }
    }
  }
}

module.exports = {
  handleLiveReloadSse,
  broadcastLiveReload,
  initLiveReloadWatcher
};
