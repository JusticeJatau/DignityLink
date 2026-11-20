import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { getJwtSecret } from '../middleware/auth.js';

const signToken = (user) =>
  jwt.sign(
    { id: user._id, role: user.role, community: user.community },
    getJwtSecret(),
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = signToken(user);
    return res.json({
      token,
      user: user.toSafeJSON(),
    });
  } catch (error) {
    return res.status(500).json({ message: 'Login failed.', error: error.message });
  }
};

export const getCurrentUser = async (req, res) => {
  return res.json({ user: req.user.toSafeJSON() });
};
