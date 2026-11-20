import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

import { connectDB } from './server/src/config/db.js';
import { mountApi } from './server/src/app.js';
import { startDailyCron } from './server/src/services/schedulerService.js';
import { ensureSeeded } from './server/src/seed/seed.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT) || 3000;

async function startIntegratedServer() {
  await connectDB();
  await ensureSeeded();
  startDailyCron();

  const app = express();
  app.use(express.json());

  // Mount DignityLink REST API (/api/auth, /api/beneficiaries, /api/messages, /api/scheduler, /api/dashboard)
  mountApi(app);

  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DignityLink full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startIntegratedServer().catch((err) => {
  console.error('Failed to start DignityLink server:', err);
  process.exit(1);
});
