const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const BUILD_DIR = path.join(__dirname, 'build');

console.log('=== Server Starting ===');
console.log('Time:', new Date().toISOString());
console.log('PORT:', PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('BUILD_DIR:', BUILD_DIR);
console.log('BUILD_DIR exists:', fs.existsSync(BUILD_DIR));

if (fs.existsSync(BUILD_DIR)) {
  console.log('BUILD_DIR contents:', fs.readdirSync(BUILD_DIR));
}

// Serve static files
app.use(express.static(BUILD_DIR));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    port: PORT,
    time: new Date().toISOString(),
    build_exists: fs.existsSync(BUILD_DIR)
  });
});

// SPA fallback - serve index.html for all routes
app.get('*', (req, res) => {
  const indexPath = path.join(BUILD_DIR, 'index.html');
  console.log('Request for:', req.path);
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(500).send('index.html not found at ' + indexPath);
  }
});

const server = app.listen(Number(PORT), '0.0.0.0', () => {
  console.log('=== Server Ready ===');
  console.log(`Listening on http://0.0.0.0:${PORT}`);
});

server.on('error', (err) => {
  console.error('Server error:', err);
  process.exit(1);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
