import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { isConnected } from '../config/db.js';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const USER_DATA_FILE = path.resolve(__dirname, '../../data/users.json');

// Ensure users.json exists for fallback mode
if (!fs.existsSync(path.dirname(USER_DATA_FILE))) {
  fs.mkdirSync(path.dirname(USER_DATA_FILE), { recursive: true });
}
if (!fs.existsSync(USER_DATA_FILE)) {
  fs.writeFileSync(USER_DATA_FILE, JSON.stringify([]));
}

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['superadmin', 'admin', 'employee'], default: 'employee' },
  title: { type: String, default: 'Staff Member' },
  phone: { type: String, default: '' },
  email: { type: String, default: '' },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  createdBy: { type: String, default: 'System' }
}, {
  timestamps: true
});

// Hash password before saving in Mongoose
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const UserMongooseModel = mongoose.model('User', userSchema);

// JSON Document fallback store for Users
class JSONUserStore {
  static readData() {
    try {
      if (!fs.existsSync(USER_DATA_FILE)) return [];
      const raw = fs.readFileSync(USER_DATA_FILE, 'utf-8');
      return JSON.parse(raw || '[]');
    } catch (e) {
      return [];
    }
  }

  static writeData(data) {
    try {
      fs.writeFileSync(USER_DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error writing JSON user store:', e);
    }
  }

  static async find(query = {}) {
    let list = this.readData();
    if (query.role) list = list.filter(u => u.role === query.role);
    return list;
  }

  static async findById(id) {
    const list = this.readData();
    return list.find(u => u._id === id || u.id === id) || null;
  }

  static async findOne(query = {}) {
    const list = this.readData();
    if (query.username) {
      return list.find(u => u.username?.toLowerCase() === query.username.toLowerCase()) || null;
    }
    return list[0] || null;
  }

  static async create(data) {
    const list = this.readData();
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const doc = {
      _id: crypto.randomUUID(),
      ...data,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    list.push(doc);
    this.writeData(list);
    return doc;
  }

  static async findByIdAndDelete(id) {
    const list = this.readData();
    const filtered = list.filter(u => u._id !== id && u.id !== id);
    this.writeData(filtered);
    return { success: true };
  }

  static async countDocuments() {
    return this.readData().length;
  }
}

export const User = {
  find: (...args) => isConnected() ? UserMongooseModel.find(...args).select('-password') : JSONUserStore.find(...args),
  findById: (...args) => isConnected() ? UserMongooseModel.findById(...args) : JSONUserStore.findById(...args),
  findOne: (...args) => isConnected() ? UserMongooseModel.findOne(...args) : JSONUserStore.findOne(...args),
  create: async (data) => {
    if (isConnected()) {
      return UserMongooseModel.create(data);
    }
    return JSONUserStore.create(data);
  },
  findByIdAndDelete: (...args) => isConnected() ? UserMongooseModel.findByIdAndDelete(...args) : JSONUserStore.findByIdAndDelete(...args),
  countDocuments: (...args) => isConnected() ? UserMongooseModel.countDocuments(...args) : JSONUserStore.countDocuments(...args)
};

export default User;

