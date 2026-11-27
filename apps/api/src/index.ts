import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

import { connectDatabase, dbState, flushMongoWrites, localStore } from './config/database';
import { seedDatabase } from './seed/seedData';

import authRoutes from './routes/authRoutes';
import mailRoutes from './routes/mailRoutes';
import scanRoutes from './routes/scanRoutes';
import sortingRoutes from './routes/sortingRoutes';
import deliveryRoutes from './routes/deliveryRoutes';
import staffRoutes from './routes/staffRoutes';
import cashbookRoutes from './routes/cashbookRoutes';
import enquiryRoutes from './routes/enquiryRoutes';
import reportRoutes from './routes/reportRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import notificationRoutes from './routes/notificationRoutes';
import adminRoutes from './routes/adminRoutes';
import syncRoutes from './routes/syncRoutes';

const app = express();
const PORT = process.env.PORT || 5000;

function normalizeOrigin(origin: string): string {
  return origin.trim().replace(/\/+$/, '');
}

function parseConfiguredOrigins(): string[] {
  const raw = [
    process.env.FRONTEND_URL,
    process.env.WEB_CLIENT_URL,
    process.env.ALLOWED_ORIGINS
  ]
    .filter(Boolean)
    .join(',');

  return raw
    .split(',')
    .map(normalizeOrigin)
    .filter(Boolean);
}

// Middleware — CORS
const allowedOrigins: (string | RegExp)[] = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:8081',
  'http://127.0.0.1:5173',
  /^https:\/\/.*\.vercel\.app$/,
  /^https:\/\/.*\.netlify\.app$/,
  /^https:\/\/.*\.pages\.dev$/,
  /^https:\/\/.*\.onrender\.com$/,
  /^https:\/\/.*\.up\.railway\.app$/,
  ...parseConfiguredOrigins()
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser clients (health probes, curl, mobile apps) and whitelisted origins
    if (!origin) return callback(null, true);
    const normalized = normalizeOrigin(origin);
    if (allowedOrigins.includes('*')) return callback(null, true);
    const allowed = allowedOrigins.some(o =>
      typeof o === 'string' ? o === normalized : o.test(normalized)
    );
    if (allowed) {
      callback(null, true);
    } else {
      console.warn(`[POSTMATE CORS] Blocked origin: ${origin}`);
      callback(null, process.env.NODE_ENV !== 'production');
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Root & Health Check
app.get('/', (req: Request, res: Response) => {
  res.json({
    status: 'ONLINE',
    system: 'POSTMATE Smart Postal Operations Management API',
    healthCheck: '/api/health',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ONLINE',
    system: 'POSTMATE Smart Postal Operations Management System',
    tagline: 'Less Manual Work. More Smart Operations.',
    database: dbState.isFallback ? 'local-fallback' : dbState.isConnected ? 'mongodb-atlas' : 'initializing',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/mail', mailRoutes);
app.use('/api/scan', scanRoutes);
app.use('/api/sorting', sortingRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/cashbook', cashbookRoutes);
app.use('/api/enquiry', enquiryRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/sync', syncRoutes);

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[POSTMATE API Error]', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error occurred.',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Start Server
async function startServer() {
  await connectDatabase();

  // If store is empty, auto-seed realistic sample data
  const existingUsers = localStore.getCollection('users');
  if (existingUsers.length === 0) {
    console.log('[POSTMATE API] Initializing fresh database with realistic postal seed records...');
    await seedDatabase();
    await flushMongoWrites();
  }

  const server = app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(` POSTMATE Smart Postal Operations Engine Running`);
    console.log(` Port: ${PORT} (${process.env.NODE_ENV || 'development'})`);
    console.log(` Health Check: /api/health`);
    console.log(` Tagline: Less Manual Work. More Smart Operations.`);
    console.log(`=======================================================`);
  });

  const gracefulShutdown = async (signal: string) => {
    console.log(`[POSTMATE API] Received ${signal}, flushing writes...`);
    await flushMongoWrites();
    server.close(() => process.exit(0));
  };

  process.on('SIGTERM', () => void gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => void gracefulShutdown('SIGINT'));
}

if (require.main === module) {
  startServer().catch(err => {
    console.error('Fatal API startup error:', err);
  });
}

export { app, startServer };
