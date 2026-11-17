import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const DATA_FILE = path.join(DATA_DIR, 'quotations.json');

// Ensure local fallback data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
}

export function isConnected() {
  return mongoose.connection.readyState === 1;
}

export async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/quotation_tracker';
  const maskedUri = uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');

  try {
    console.log(`[Database] Connecting to MongoDB: ${maskedUri}`);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    });
    console.log(`✅ [Database] MongoDB successfully connected to Atlas cluster! (DB: ${mongoose.connection.name})`);
  } catch (err) {
    console.warn(`⚠️ [Database] Could not connect to MongoDB server: ${err.message}`);
    console.log(`⚡ [Database] Active mode: High-performance persistent JSON Document Engine (${DATA_FILE}).`);
  }
}

export function getDBStatus() {
  const connected = mongoose.connection.readyState === 1;
  return {
    isMongooseConnected: connected,
    mode: connected ? 'MongoDB Atlas (Mongoose)' : 'Embedded JSON Document Store',
    database: connected ? mongoose.connection.name : 'JSON File',
    host: connected ? mongoose.connection.host : null
  };
}

export { DATA_FILE };
