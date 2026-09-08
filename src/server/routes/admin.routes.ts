import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../prisma';
import { authenticate, AuthenticatedRequest, authorizeRoles } from '../middleware/auth';
import { recordAuditLog } from '../services/audit.service';

const router = Router();

// GET /api/admin/stats - Hospital Dashboard KPI Summary
router.get('/stats', authenticate, authorizeRoles('ADMINISTRATOR'), async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalPatients,
      todayPatients,
      activeEncounters,
      pendingLabOrders,
      pendingPrescriptions,
      totalInvoices,
      admittedCount,
      totalBeds,
      occupiedBeds,
    ] = await Promise.all([
      prisma.patient.count(),
      prisma.encounter.count({ where: { startedAt: { gte: today } } }),
      prisma.encounter.count({ where: { status: { not: 'COMPLETED' } } }),
      prisma.laboratoryOrder.count({ where: { status: 'PENDING' } }),
      prisma.prescription.count({ where: { status: 'PENDING' } }),
      prisma.invoice.aggregate({ _sum: { paidAmount: true, netAmount: true } }),
      prisma.admission.count({ where: { dischargedAt: null } }),
      prisma.bed.count(),
      prisma.bed.count({ where: { status: 'OCCUPIED' } }),
    ]);

    // Active queues count by department
    const queueCounts = await prisma.patientQueue.groupBy({
      by: ['department'],
      where: { status: { in: ['WAITING', 'CALLED', 'IN_PROGRESS'] } },
      _count: { id: true },
    });

    const queueMap: Record<string, number> = {};
    queueCounts.forEach((q) => {
      queueMap[q.department] = q._count.id;
    });

    return res.json({
      totalPatients,
      todayPatients,
      activeEncounters,
      pendingLabOrders,
      pendingPrescriptions,
      totalRevenue: totalInvoices._sum.paidAmount || 0,
      outstandingRevenue: (totalInvoices._sum.netAmount || 0) - (totalInvoices._sum.paidAmount || 0),
      admittedCount,
      bedOccupancy: {
        total: totalBeds,
        occupied: occupiedBeds,
        available: totalBeds - occupiedBeds,
        occupancyRate: totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0,
      },
      queues: queueMap,
    });
  } catch (error) {
    console.error('Stats error:', error);
    return res.status(500).json({ error: 'Failed to retrieve hospital statistics' });
  }
});

// GET /api/admin/users - List Users
router.get('/users', authenticate, authorizeRoles('ADMINISTRATOR'), async (req, res) => {
  try {
    const users = await prisma.user.findMany({
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
      orderBy: { createdAt: 'desc' },
    });
    return res.json(users);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// POST /api/admin/users - Create User
router.post('/users', authenticate, authorizeRoles('ADMINISTRATOR'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { username, email, fullName, role, department, password } = req.body;
    if (!username || !email || !password || !role) {
      return res.status(400).json({ error: 'Username, email, role, and password are required' });
    }

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });
    if (existing) {
      return res.status(409).json({ error: 'Username or email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        username,
        email,
        fullName: fullName || username,
        role,
        department: department || null,
        passwordHash,
      },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        department: true,
        isActive: true,
      },
    });

    await recordAuditLog({
      userId: req.user?.id,
      action: 'CREATE',
      module: 'ADMIN',
      entityName: 'User',
      entityId: user.id,
      details: { username: user.username, role: user.role },
      ipAddress: req.ip,
    });

    return res.status(201).json(user);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create user' });
  }
});

// GET /api/admin/audit-logs - Immutable System Audit Trail
router.get('/audit-logs', authenticate, authorizeRoles('ADMINISTRATOR'), async (req, res) => {
  try {
    const logs = await prisma.auditLog.findMany({
      take: 50,
      orderBy: { timestamp: 'desc' },
      include: {
        user: {
          select: { fullName: true, role: true, username: true },
        },
      },
    });
    return res.json(logs);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve audit trail' });
  }
});

export default router;
