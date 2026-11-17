import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/userModel.js';
import { protect, adminOnly, JWT_SECRET } from '../middleware/authMiddleware.js';

const router = express.Router();

function generateToken(id) {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: '30d' });
}

// ==========================================
// 1. LOGIN
// ==========================================
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Please enter both username and password' });
    }

    const user = await User.findOne({ username: username.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid username or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid username or password' });
    }

    const token = generateToken(user._id || user.id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id || user.id,
        name: user.name,
        username: user.username,
        role: user.role,
        title: user.title,
        phone: user.phone,
        email: user.email,
        status: user.status
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 2. GET CURRENT LOGGED IN USER
// ==========================================
router.get('/me', protect, async (req, res) => {
  const user = req.user;
  res.json({
    success: true,
    user: {
      id: user._id || user.id,
      name: user.name,
      username: user.username,
      role: user.role,
      title: user.title,
      phone: user.phone,
      email: user.email,
      status: user.status
    }
  });
});

// ==========================================
// 3. GET ALL USERS (ADMIN ONLY)
// ==========================================
router.get('/users', protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find({});
    const sanitized = users.map(u => ({
      id: u._id || u.id,
      name: u.name,
      username: u.username,
      role: u.role,
      title: u.title,
      phone: u.phone,
      email: u.email,
      status: u.status,
      createdAt: u.createdAt
    }));
    res.json({ success: true, count: sanitized.length, data: sanitized });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 4. ADD NEW USER / EMPLOYEE (ADMIN ONLY)
// ==========================================
router.post('/users', protect, adminOnly, async (req, res) => {
  try {
    const { name, username, password, phone, email, title, role } = req.body;

    if (!name || !username || !password) {
      return res.status(400).json({ success: false, error: 'Name, username, and password are required.' });
    }

    const existing = await User.findOne({ username: username.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ success: false, error: `Username '${username}' is already taken.` });
    }

    const assignedRole = (role === 'admin' || role === 'superadmin') ? role : 'employee';

    const newUser = await User.create({
      name,
      username: username.toLowerCase().trim(),
      password,
      role: assignedRole,
      title: title || (assignedRole === 'admin' ? 'Administrator' : 'Staff Member'),
      phone: phone || '',
      email: email || '',
      status: 'active',
      createdBy: req.user.name
    });

    res.status(201).json({
      success: true,
      message: `Account created successfully for ${name} with ${assignedRole.toUpperCase()} access`,
      data: {
        id: newUser._id || newUser.id,
        name: newUser.name,
        username: newUser.username,
        role: newUser.role,
        title: newUser.title,
        phone: newUser.phone,
        email: newUser.email,
        status: newUser.status
      }
    });
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 5. DELETE EMPLOYEE (ADMIN ONLY)
// ==========================================
router.delete('/users/:id', protect, adminOnly, async (req, res) => {
  try {
    const userToDelete = await User.findById(req.params.id);
    if (!userToDelete) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Protect root superadmin account from deletion
    if (userToDelete.username?.toLowerCase() === 'qtracker' || userToDelete.role === 'superadmin') {
      return res.status(400).json({ success: false, error: 'Cannot delete the root Super Admin account.' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: `Account '${userToDelete.name}' deleted successfully.` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;

