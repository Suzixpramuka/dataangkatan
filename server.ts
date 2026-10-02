import express, { Request, Response } from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

import { loadAllFromDisk, initWatcher, subscribeToChanges } from './server/storage.ts';
import { seedInitialData } from './server/seed.ts';
import { apiLimiter } from './server/middleware/rateLimiter.ts';

import authRouter from './server/routes/auth.ts';
import membersRouter from './server/routes/members.ts';
import adminRouter from './server/routes/admin.ts';
import officialRouter from './server/routes/official.ts';
import rosterRouter from './server/routes/roster.ts';
import manageAdminsRouter from './server/routes/manageAdmins.ts';
import auditRouter from './server/routes/audit.ts';
import publicRouter from './server/routes/public.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT || '3000', 10);
const isProduction = process.env.NODE_ENV === 'production';

async function bootstrap() {
  const app = express();
  const server = http.createServer(app);

  // Initialize storage layer and seed data
  console.log('[System] Initializing CSV storage engine...');
  loadAllFromDisk();
  initWatcher();
  await seedInitialData();

  // Basic security middleware
  app.use(
    helmet({
      contentSecurityPolicy: false, // Vite inline scripts & styles
      crossOriginEmbedderPolicy: false,
    })
  );

  app.use(
    cors({
      origin: true,
      credentials: true,
    })
  );

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  // Global API rate limiting
  app.use('/api', apiLimiter);

  // Realtime Server-Sent Events (SSE) stream
  app.get('/api/events', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    // Initial handshake
    res.write(`data: ${JSON.stringify({ type: 'CONNECTED', timestamp: new Date().toISOString() })}\n\n`);

    // Listen to storage mutations
    const unsubscribe = subscribeToChanges((event) => {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    });

    // Heartbeat every 15s to keep connection open through reverse proxies
    const heartbeat = setInterval(() => {
      res.write(': keepalive\n\n');
    }, 15000);

    req.on('close', () => {
      clearInterval(heartbeat);
      unsubscribe();
    });
  });

  // Mount API routers
  app.use('/api/auth', authRouter);
  app.use('/api/members', membersRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/official', officialRouter);
  app.use('/api/roster', rosterRouter);
  app.use('/api/manage-admins', manageAdminsRouter);
  app.use('/api/audit-logs', auditRouter);
  app.use('/api/public', publicRouter);

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'IF26 Member Verification System',
      time: new Date().toISOString(),
    });
  });

  // Frontend Serving: Vite dev middleware or static dist
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`=======================================================`);
    console.log(`🚀 IF26 Member Verification System Server`);
    console.log(`🌐 Running on http://localhost:${PORT}`);
    console.log(`🔒 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`=======================================================`);
  });
}

bootstrap().catch((err) => {
  console.error('Fatal server bootstrap error:', err);
  process.exit(1);
});
