import dotenv from 'dotenv';
import app from './app.js';
import { connectDB } from './config/db.js';
import { startDailyCron } from './services/schedulerService.js';
import { ensureSeeded } from './seed/seed.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    await ensureSeeded();
    startDailyCron();

    app.listen(PORT, () => {
      console.log(`DignityLink server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
