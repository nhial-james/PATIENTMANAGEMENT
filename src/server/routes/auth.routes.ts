import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../prisma';
import { seedDatabase } from '../services/seed.service';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { recordAuditLog } from '../services/audit.service';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'hmis-super-secure-production-ready-jwt-key-2026';

// POST /api/auth/login
router.post('/login', async (req, res: Response) => {
  try {
    const { email, username, password } = req.body;
    const identifier = email || username;

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Username/email and password are required' });
    }

    let user = await prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { username: identifier }],
      },
    });

    // Auto-heal: If user not found, check if database is empty/unseeded
    if (!user) {
      const totalUsers = await prisma.user.count().catch(() => 0);
      if (totalUsers === 0) {
        console.log('⚡ Detected unseeded database on login attempt. Auto-seeding now...');
        try {
          await seedDatabase();
          user = await prisma.user.findFirst({
            where: {
              OR: [{ email: identifier }, { username: identifier }],
            },
          });
        } catch (seedErr) {
          console.error('Auto-seed during login failed:', seedErr);
        }
      }
    }

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid credentials or inactive account' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        department: user.department,
      },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    await recordAuditLog({
      userId: user.id,
      action: 'LOGIN',
      module: 'AUTH',
      entityName: 'User',
      entityId: user.id,
      ipAddress: req.ip,
      details: { role: user.role },
    });

    return res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        department: user.department,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error during login' });
  }
});

// ALL /api/auth/seed - Manual or programmatic database seed
router.all('/seed', async (req, res: Response) => {
  try {
    const result = await seedDatabase();
    const userCount = await prisma.user.count();
    return res.json({
      success: true,
      message: 'Hospital database seeded successfully with all official demo accounts.',
      userCount,
      details: result,
    });
  } catch (error: any) {
    console.error('Manual seed error:', error);
    return res.status(500).json({ error: error?.message || 'Failed to seed database' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.id },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        department: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json(user);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// POST /api/auth/switch-role (Convenience for testing/evaluating all 11 roles)
router.post('/switch-role', async (req, res) => {
  try {
    const { role } = req.body;
    const user = await prisma.user.findFirst({
      where: { role: role.toUpperCase() },
    });

    if (!user) {
      return res.status(404).json({ error: `No user found with role ${role}` });
    }

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        department: user.department,
      },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        department: user.department,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to switch role' });
  }
});

export default router;
