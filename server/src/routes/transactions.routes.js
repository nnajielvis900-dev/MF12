import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/validate.js';

const router = Router();
router.use(requireAuth);

const EXPENSE_CATEGORIES = ['groceries', 'dining', 'transport', 'housing', 'shopping', 'health', 'entertainment', 'bills', 'other-expense'];
const INCOME_CATEGORIES = ['salary', 'freelance', 'investments', 'other-income'];

const createSchema = z
  .object({
    type: z.enum(['income', 'expense']),
    amountCents: z.number().int().positive().max(10_000_000_000),
    category: z.string().min(1),
    note: z.string().trim().max(80).optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  })
  .refine((v) => (v.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).includes(v.category), {
    message: 'Invalid category for transaction type',
    path: ['category'],
  });

// GET /api/transactions?month=YYYY-MM
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const month = typeof req.query.month === 'string' && /^\d{4}-\d{2}$/.test(req.query.month) ? req.query.month : null;
    const params = [req.userId];
    let sql = `
      SELECT id, type, amount_cents AS "amountCents", category, note, occurred_on AS date, created_at AS "createdAt"
      FROM transactions WHERE user_id = $1`;
    if (month) {
      params.push(month);
      sql += ` AND to_char(occurred_on, 'YYYY-MM') = $2`;
    }
    sql += ' ORDER BY occurred_on DESC, created_at DESC LIMIT 500';
    const result = await query(sql, params);
    res.json({ transactions: result.rows });
  }),
);

// POST /api/transactions
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = createSchema.parse(req.body);
    const result = await query(
      `INSERT INTO transactions (user_id, type, amount_cents, category, note, occurred_on)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, type, amount_cents AS "amountCents", category, note, occurred_on AS date, created_at AS "createdAt"`,
      [req.userId, body.type, body.amountCents, body.category, body.note ?? null, body.date],
    );
    res.status(201).json({ transaction: result.rows[0] });
  }),
);

// DELETE /api/transactions/:id  (scoped to the owner — WHERE user_id = $2)
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const idSchema = z.string().uuid();
    const id = idSchema.parse(req.params.id);
    const result = await query('DELETE FROM transactions WHERE id = $1 AND user_id = $2', [id, req.userId]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Transaction not found' });
    res.status(204).end();
  }),
);

export default router;
