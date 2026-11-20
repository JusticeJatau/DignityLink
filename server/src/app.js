import express from 'express';
import cors from 'cors';

import authRoutes from './routes/authRoutes.js';
import beneficiaryRoutes from './routes/beneficiaryRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import schedulerRoutes from './routes/schedulerRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';

export const mountApi = (app) => {
  app.use('/api/auth', authRoutes);
  app.use('/api/beneficiaries', beneficiaryRoutes);
  app.use('/api/messages', messageRoutes);
  app.use('/api/scheduler', schedulerRoutes);
  app.use('/api/dashboard', dashboardRoutes);

  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'DignityLink API',
      timestamp: new Date().toISOString(),
    });
  });

  app.use('/api', (req, res) => {
    res.status(404).json({ message: `API route not found: ${req.originalUrl}` });
  });
};

const app = express();
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());
mountApi(app);

export default app;
