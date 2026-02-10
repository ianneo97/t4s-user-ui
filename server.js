import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const BUILD_DIR = join(__dirname, 'build');

// Serve static files
app.use(express.static(BUILD_DIR));

// SPA fallback - serve index.html for all routes
app.get('*', (req, res) => {
  res.sendFile(join(BUILD_DIR, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
