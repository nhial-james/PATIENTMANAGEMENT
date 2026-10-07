import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import prisma from './prisma';
import { seedDatabase } from './services/seed.service';
import authRoutes from './routes/auth.routes';
import patientRoutes from './routes/patient.routes';
import queueRoutes from './routes/queue.routes';
import triageRoutes from './routes/triage.routes';
import clinicalRoutes from './routes/clinical.routes';
import labRoutes from './routes/lab.routes';
import pharmacyRoutes from './routes/pharmacy.routes';
import billingRoutes from './routes/billing.routes';
import inpatientRoutes from './routes/inpatient.routes';
import shaRoutes from './routes/sha.routes';
import adminRoutes from './routes/admin.routes';
import procurementRoutes from './routes/procurement.routes';
import accountsRoutes from './routes/accounts.routes';
import hrRoutes from './routes/hr.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: '*' }));
app.use(express.json());

// Request logging in development
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });
}

// Health Check with live database diagnostics
app.get('/api/health', async (req, res) => {
  try {
    const userCount = await prisma.user.count();
    res.json({
      status: 'ok',
      service: 'Puche Medical Clinic Backend API Engine',
      userCount,
      timestamp: new Date(),
    });
  } catch (err: any) {
    res.json({
      status: 'ok',
      service: 'Puche Medical Clinic Backend API Engine',
      databaseStatus: 'uninitialized',
      error: err?.message,
      timestamp: new Date(),
    });
  }
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/triage', triageRoutes);
app.use('/api/clinical', clinicalRoutes);
app.use('/api/lab', labRoutes);
app.use('/api/pharmacy', pharmacyRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/inpatient', inpatientRoutes);
app.use('/api/sha', shaRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/procurement', procurementRoutes);
app.use('/api/accounts', accountsRoutes);
app.use('/api/hr', hrRoutes);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Auto-seed database if empty or unseeded
async function ensureDatabaseReady() {
  try {
    const adminUser = await prisma.user.findFirst({ where: { username: 'admin' } });
    if (!adminUser) {
      console.log('⚡ Admin account not found. Automatically initializing & seeding database...');
      await seedDatabase();
      console.log('✅ Auto-seed completed successfully!');
    } else {
      console.log('✅ Database verified: staff accounts are ready.');
    }
  } catch (error: any) {
    console.warn('⚠️ Database query failed on startup, checking schema state...', error?.message);
    try {
      const { execSync } = await import('child_process');
      console.log('🔄 Executing automatic prisma db push...');
      execSync('npx prisma db push --skip-generate', { stdio: 'inherit' });
      console.log('✅ Prisma db push executed. Now seeding database...');
      await seedDatabase();
      console.log('✅ Auto-seed completed successfully!');
    } catch (pushErr) {
      console.error('❌ Failed to auto-initialize database schema:', pushErr);
    }
  }
}

app.listen(PORT, async () => {
  console.log(`🚀 Puche Medical Clinic Backend API server running on http://localhost:${PORT}`);
  await ensureDatabaseReady();
});

export default app;
