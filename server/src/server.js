import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { connectDB, getDBStatus } from './config/db.js';
import quotationRoutes from './routes/quotationRoutes.js';
import authRoutes from './routes/authRoutes.js';
import { Quotation } from './models/quotationModel.js';
import { User } from './models/userModel.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for assets (logo, templates)
app.use('/assets', express.static(path.resolve(__dirname, '../assets')));

// Seed Super Admin account if not already present
async function seedUsersIfEmpty() {
  try {
    const superAdmin = await User.findOne({ username: 'qtracker' });
    if (!superAdmin) {
      console.log('👑 Seeding Super Admin (QTracker)...');
      await User.create({
        name: 'System Super Admin',
        username: 'qtracker',
        password: 'tracker123',
        role: 'superadmin',
        title: 'Super Administrator',
        phone: '011-2614317',
        email: 'superadmin@subodhi.org',
        status: 'active',
        createdBy: 'MongoDB Atlas Root'
      });
    }
  } catch (err) {
    console.error('Error seeding users:', err);
  }
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/quotations', quotationRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    time: new Date(),
    database: getDBStatus()
  });
});

// Serve frontend build if client/dist exists
const clientDistPath = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  console.log(`📦 Serving React frontend from: ${clientDistPath}`);
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/assets')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Start Server
async function startServer() {
  await connectDB();
  await seedUsersIfEmpty();

  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚀 Subodhi Quotation Tracker Backend running on port ${PORT}`);
    console.log(`📡 API Endpoints: http://localhost:${PORT}/api/quotations`);
    console.log(`🔐 Auth Endpoints: http://localhost:${PORT}/api/auth`);
    console.log(`🔍 Health Check:  http://localhost:${PORT}/api/health`);
    console.log(`🖥️ Web UI:        http://localhost:${PORT}`);
    console.log(`=======================================================`);
  });
}

startServer();
