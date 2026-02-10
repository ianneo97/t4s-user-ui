import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, readdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const BUILD_DIR = join(__dirname, 'build');

console.log('Starting server...');
console.log('PORT:', PORT);
console.log('BUILD_DIR:', BUILD_DIR);
console.log('BUILD_DIR exists:', existsSync(BUILD_DIR));

if (existsSync(BUILD_DIR)) {
  console.log('BUILD_DIR contents:', readdirSync(BUILD_DIR));
}

// Serve static files
app.use(express.static(BUILD_DIR));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', port: PORT });
});

// SPA fallback - serve index.html for all routes
app.get('*', (req, res) => {
  const indexPath = join(BUILD_DIR, 'index.html');
  if (existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(500).send('index.html not found at ' + indexPath);
  }
});

const server = app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});

server.on('error', (err) => {
  console.error('Server error:', err);
  process.exit(1);
});
