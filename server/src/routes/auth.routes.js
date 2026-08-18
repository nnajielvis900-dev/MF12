import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { query } from '../db.js';
import { asyncHandler } from '../middleware/validate.js';

const router = Router();
const BCRYPT_ROUNDS = 12;

// Brute-force protection on credential endpoints.
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false });
router.use(authLimiter);

const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(8).max(128),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

function signToken(userId) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  });
}

// POST /api/auth/register
router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { name, email, password } = registerSchema.parse(req.body);
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const result = await query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       ON CONFLICT DO NOTHING
       RETURNING id, name, email, created_at`,
      [name, email, passwordHash],
    );
    if (result.rowCount === 0) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const user = result.rows[0];
    return res.status(201).json({ user, token: signToken(user.id) });
  }),
);

// POST /api/auth/login
router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);

    const result = await query('SELECT id, name, email, password_hash, created_at FROM users WHERE lower(email) = $1', [email]);
    const user = result.rows[0];

    // Same generic message either way — no user enumeration.
    const ok = user ? await bcrypt.compare(password, user.password_hash) : false;
    if (!user || !ok) return res.status(401).json({ error: 'Invalid email or password.' });

    const { password_hash, ...publicUser } = user;
    return res.json({ user: publicUser, token: signToken(user.id) });
  }),
);

export default router;
