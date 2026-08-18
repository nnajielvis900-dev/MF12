import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import 'dotenv/config';
import authRoutes from './routes/auth.routes.js';
import transactionRoutes from './routes/transactions.routes.js';
import budgetRoutes from './routes/budgets.routes.js';
import { validationErrorHandler } from './middleware/validate.js';

const app = express();

// Security hardening
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') ?? [], credentials: false }));
app.use(express.json({ limit: '10kb' })); // small bodies only
app.disable('x-powered-by');

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/budgets', budgetRoutes);

app.use(validationErrorHandler);

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => {
  console.log(`Ledgerly API listening on :${port}`);
});
