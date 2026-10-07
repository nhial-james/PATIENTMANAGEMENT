import { Router, Response } from 'express';
import prisma from '../prisma';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { recordAuditLog } from '../services/audit.service';

const router = Router();

// GET /api/lab/tests - Test Catalog
router.get('/tests', authenticate, async (req, res) => {
  try {
    const tests = await prisma.laboratoryTest.findMany({
      orderBy: { category: 'asc' },
    });
    return res.json(tests);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch lab test catalog' });
  }
});

// GET /api/lab/orders - Pending / In-progress / Completed orders
router.get('/orders', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status } = req.query;
    const where = status ? { status: status as string } : {};

    const orders = await prisma.laboratoryOrder.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        encounter: {
          include: { patient: true },
        },
        items: {
          include: { test: true },
        },
      },
    });

    return res.json(orders);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch lab orders' });
  }
});

// POST /api/lab/orders/:id/results - Record Results & Forward back to Doctor
router.post('/orders/:id/results', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orderId = req.params.id;
    const { results } = req.body as {
      results: Array<{
        itemId: string;
        resultValue: string;
        isAbnormal?: boolean;
        technicianNotes?: string;
      }>;
    };

    if (!results || results.length === 0) {
      return res.status(400).json({ error: 'Results payload is required' });
    }

    const order = await prisma.laboratoryOrder.findUnique({
      where: { id: orderId },
      include: { encounter: true },
    });

    if (!order) {
      return res.status(404).json({ error: 'Lab order not found' });
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      // 1. Update order items with results
      for (const r of results) {
        await tx.laboratoryOrderItem.update({
          where: { id: r.itemId },
          data: {
            resultValue: r.resultValue,
            isAbnormal: r.isAbnormal || false,
            technicianNotes: r.technicianNotes || null,
            testedAt: new Date(),
            testedById: req.user?.id || 'lab-tech-1',
            verifiedAt: new Date(),
            verifiedById: req.user?.id || 'lab-tech-1',
          },
        });
      }

      // 2. Mark order completed
      const updated = await tx.laboratoryOrder.update({
        where: { id: orderId },
        data: { status: 'COMPLETED' },
      });

      // 3. Mark current Laboratory Queue item completed
      await tx.patientQueue.updateMany({
        where: {
          encounterId: order.encounterId,
          department: 'LABORATORY',
          status: { in: ['WAITING', 'CALLED', 'IN_PROGRESS'] },
        },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });

      // 4. Route back to CONSULTATION
      await tx.encounter.update({
        where: { id: order.encounterId },
        data: { status: 'CONSULTATION_WAITING' },
      });

      const count = await tx.patientQueue.count({
        where: { department: 'CONSULTATION' },
      });

      await tx.patientQueue.create({
        data: {
          encounterId: order.encounterId,
          department: 'CONSULTATION',
          queueNumber: 100 + count + 1,
          priority: 2, // High priority because lab results returned!
          status: 'WAITING',
        },
      });

      return updated;
    });

    await recordAuditLog({
      userId: req.user?.id,
      action: 'UPDATE',
      module: 'LAB',
      entityName: 'LaboratoryOrder',
      entityId: orderId,
      details: { itemsRecorded: results.length },
      ipAddress: req.ip,
    });

    return res.json({ success: true, order: updatedOrder });
  } catch (error) {
    console.error('Record lab results error:', error);
    return res.status(500).json({ error: 'Failed to record laboratory results' });
  }
});

export default router;
