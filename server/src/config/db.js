import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const IS_SERVERLESS = !!(process.env.VERCEL || process.env.VERCEL_ENV || process.env.AWS_LAMBDA_FUNCTION_NAME);

export const DATA_DIR = IS_SERVERLESS
  ? path.join(os.tmpdir(), 'quotation_tracker_data')
  : path.resolve(__dirname, '../../data');

export const DATA_FILE = path.join(DATA_DIR, 'quotations.json');
export const USER_DATA_FILE = path.join(DATA_DIR, 'users.json');

// Safely ensure data directory and files exist without crashing on read-only environments
export function ensureDataFiles() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
    }
    if (!fs.existsSync(USER_DATA_FILE)) {
      fs.writeFileSync(USER_DATA_FILE, JSON.stringify([], null, 2));
    }
  } catch (err) {
    // Non-fatal warning if filesystem is read-only
    console.warn('[Database] Read-only filesystem notice:', err.message);
  }
}

// Initialise safely
ensureDataFiles();

export function isConnected() {
  return mongoose.connection.readyState === 1;
}

const ATLAS_DEFAULT = 'mongodb+srv://QTracker:tracker123@quotationtracker.vcusln6.mongodb.net/quotation_tracker?retryWrites=true&w=majority';

// Global connection cache for serverless environments
let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }
  if (cached.conn) {
    return cached.conn;
  }

  const uri = process.env.MONGODB_URI || ATLAS_DEFAULT;
  const maskedUri = uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');

  if (!cached.promise) {
    console.log(`[Database] Connecting to MongoDB: ${maskedUri}`);
    cached.promise = mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 8000,
    }).then((m) => {
      console.log(`✅ [Database] MongoDB successfully connected to Atlas cluster! (DB: ${m.connection.name})`);
      return m;
    });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (err) {
    cached.promise = null;
    console.warn(`⚠️ [Database] Could not connect to MongoDB server: ${err.message}`);
    console.log(`⚡ [Database] Active mode: Fallback JSON Document Engine (${DATA_FILE}).`);
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
