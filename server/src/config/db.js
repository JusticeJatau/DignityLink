import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';

let memoryServer = null;

export const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  mongoose.set('strictQuery', true);
  let uri = process.env.MONGODB_URI;

  if (uri) {
    try {
      const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
      console.log(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
      return conn;
    } catch (err) {
      console.warn(
        `Configured MONGODB_URI unreachable (${err.message}). Falling back to local MongoMemoryServer...`
      );
    }
  }

  const { MongoMemoryServer } = await import('mongodb-memory-server');
  const dbPath = path.resolve(process.cwd(), '.mongodb-data');
  fs.mkdirSync(dbPath, { recursive: true });

  try {
    memoryServer = await MongoMemoryServer.create({
      instance: {
        dbName: 'dignitylink',
        dbPath,
        storageEngine: 'wiredTiger',
      },
    });
  } catch (diskErr) {
    console.warn(`WiredTiger disk instance fallback (${diskErr.message}), using in-memory MongoDB.`);
    memoryServer = await MongoMemoryServer.create({
      instance: {
        dbName: 'dignitylink',
      },
    });
  }

  uri = memoryServer.getUri();
  const conn = await mongoose.connect(uri);
  console.log(`MongoDB (local engine) connected: ${conn.connection.host}/${conn.connection.name}`);
  return conn;
};

export const disconnectDB = async () => {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
};
