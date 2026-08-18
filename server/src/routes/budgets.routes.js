import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/validate.js';

const router = Router();
router.use(requireAuth);

const upsertSchema = z.object({
  category: z.string().min(1),
  limitCents: z.number().int().min(0).max(10_000_000_000), // 0 removes the budget
});

// GET /api/budgets
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const result = await query(
      'SELECT category, limit_cents AS "limitCents" FROM budgets WHERE user_id = $1 ORDER BY category',
      [req.userId],
    );
    res.json({ budgets: result.rows });
  }),
);

// PUT /api/budgets  — upsert per (user, category)
router.put(
  '/',
  asyncHandler(async (req, res) => {
    const { category, limitCents } = upsertSchema.parse(req.body);

    if (limitCents === 0) {
      await query('DELETE FROM budgets WHERE user_id = $1 AND category = $2', [req.userId, category]);
      return res.status(204).end();
    }

    const result = await query(
      `INSERT INTO budgets (user_id, category, limit_cents)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, category)
       DO UPDATE SET limit_cents = EXCLUDED.limit_cents, updated_at = now()
       RETURNING category, limit_cents AS "limitCents"`,
      [req.userId, category, limitCents],
    );
    res.json({ budget: result.rows[0] });
  }),
);

export default router;
