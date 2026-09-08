import { Router, Response } from 'express';
import prisma from '../prisma';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { recordAuditLog } from '../services/audit.service';

const router = Router();

// GET /api/queue/:department - Department Active Queue
router.get('/:department', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const dept = req.params.department.toUpperCase();

    const queueItems = await prisma.patientQueue.findMany({
      where: {
        department: dept,
        status: { in: ['WAITING', 'CALLED', 'IN_PROGRESS'] },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
      include: {
        encounter: {
          include: {
            patient: true,
            triage: true,
            consultations: {
              take: 1,
              orderBy: { createdAt: 'desc' },
            },
            labOrders: {
              take: 1,
              orderBy: { createdAt: 'desc' },
              include: { items: { include: { test: true } } },
            },
            prescriptions: {
              take: 1,
              orderBy: { createdAt: 'desc' },
              include: { items: { include: { drug: true } } },
            },
          },
        },
      },
    });

    return res.json(queueItems);
  } catch (error) {
    console.error('Fetch queue error:', error);
    return res.status(500).json({ error: 'Failed to retrieve department queue' });
  }
});

// POST /api/queue/:id/call
router.post('/:id/call', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const queue = await prisma.patientQueue.update({
      where: { id: req.params.id },
      data: {
        status: 'CALLED',
        calledAt: new Date(),
      },
    });
    return res.json(queue);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to call patient' });
  }
});

// POST /api/queue/:id/start
router.post('/:id/start', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const queue = await prisma.patientQueue.update({
      where: { id: req.params.id },
      data: {
        status: 'IN_PROGRESS',
        startedAt: new Date(),
      },
    });
    return res.json(queue);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to start session' });
  }
});

// POST /api/queue/:id/route - Transition to next department
router.post('/:id/route', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { nextDepartment, priority = 1, encounterStatus } = req.body;
    const currentQueueId = req.params.id;

    if (!nextDepartment) {
      return res.status(400).json({ error: 'nextDepartment is required' });
    }

    const currentQueue = await prisma.patientQueue.findUnique({
      where: { id: currentQueueId },
    });

    if (!currentQueue) {
      return res.status(404).json({ error: 'Current queue record not found' });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Mark current completed
      await tx.patientQueue.update({
        where: { id: currentQueueId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });

      // Update encounter status if provided
      if (encounterStatus) {
        await tx.encounter.update({
          where: { id: currentQueue.encounterId },
          data: { status: encounterStatus },
        });
      }

      // Count in target department
      const count = await tx.patientQueue.count({
        where: { department: nextDepartment.toUpperCase() },
      });

      // Create new queue item
      const newQueue = await tx.patientQueue.create({
        data: {
          encounterId: currentQueue.encounterId,
          department: nextDepartment.toUpperCase(),
          queueNumber: 100 + count + 1,
          priority: Number(priority),
          status: 'WAITING',
        },
      });

      return newQueue;
    });

    await recordAuditLog({
      userId: req.user?.id,
      action: 'UPDATE',
      module: 'CLINICAL',
      entityName: 'PatientQueue',
      entityId: result.id,
      details: {
        from: currentQueue.department,
        to: nextDepartment,
        encounterId: currentQueue.encounterId,
      },
      ipAddress: req.ip,
    });

    return res.json(result);
  } catch (error) {
    console.error('Routing error:', error);
    return res.status(500).json({ error: 'Failed to route patient to next department' });
  }
});

export default router;
