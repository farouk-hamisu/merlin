import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { logger } from './utils/logger';
import { supabaseAdmin } from './db/supabase';

// Import Routes
import authRouter from './routes/auth';
import documentsRouter from './routes/documents';
import verifyRouter from './routes/verify';
import adminRouter from './routes/admin';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middlewares
app.use(
  helmet({
    crossOriginResourcePolicy: false, // Allow iframes to load resources across ports
    contentSecurityPolicy: false,
    frameguard: false,
  })
);

// CORS configuration matching our React frontend Vite dev server origin
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

// Rate Limiter to prevent brute force and resource exhaustion
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again later.' },
});
app.use('/api/', limiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Server health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Public settings route (for landing page info, e.g. Telegram Admin URL)
app.get('/api/settings/public', async (req, res) => {
  try {
    const { data: setting, error } = await supabaseAdmin
      .from('settings')
      .select('value')
      .eq('key', 'telegram_username')
      .single();

    if (error || !setting) {
      return res.json({ telegram_username: '@merlin_admin' });
    }

    res.json({ telegram_username: setting.value });
  } catch (err) {
    res.json({ telegram_username: '@merlin_admin' });
  }
});

// Connect Routes
app.use('/api/auth', authRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/verify', verifyRouter);
app.use('/api/admin', adminRouter);

// Global Unhandled Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error(`Unhandled Exception: ${err.message || err}`);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});
export default app;
