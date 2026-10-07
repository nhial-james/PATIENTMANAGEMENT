import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { recordAuditLog } from '../services/audit.service';

const router = Router();

const triageSchema = z.object({
  encounterId: z.string(),
  temperature: z.number().min(30).max(45),
  bloodPressureSys: z.number().min(50).max(300),
  bloodPressureDia: z.number().min(30).max(200),
  pulseRate: z.number().min(30).max(250),
  respiratoryRate: z.number().optional().nullable(),
  oxygenSat: z.number().optional().nullable(),
  weightKg: z.number().min(1).max(350),
  heightCm: z.number().min(30).max(250),
  notes: z.string().optional().nullable(),
});

// POST /api/triage - Record vitals & forward to Consultation
router.post('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parseResult = triageSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parseResult.error.flatten().fieldErrors,
      });
    }

    const data = parseResult.data;

    // Automated BMI calculation: weight / (height/100)^2
    const heightInMeters = data.heightCm / 100;
    const bmi = parseFloat((data.weightKg / (heightInMeters * heightInMeters)).toFixed(1));

    const result = await prisma.$transaction(async (tx) => {
      // Upsert Triage
      const triage = await tx.triage.upsert({
        where: { encounterId: data.encounterId },
        update: {
          temperature: data.temperature,
          bloodPressureSys: data.bloodPressureSys,
          bloodPressureDia: data.bloodPressureDia,
          pulseRate: data.pulseRate,
          respiratoryRate: data.respiratoryRate || null,
          oxygenSat: data.oxygenSat || null,
          weightKg: data.weightKg,
          heightCm: data.heightCm,
          bmi,
          notes: data.notes || null,
        },
        create: {
          encounterId: data.encounterId,
          recordedById: req.user?.id || 'triage-nurse',
          temperature: data.temperature,
          bloodPressureSys: data.bloodPressureSys,
          bloodPressureDia: data.bloodPressureDia,
          pulseRate: data.pulseRate,
          respiratoryRate: data.respiratoryRate || null,
          oxygenSat: data.oxygenSat || null,
          weightKg: data.weightKg,
          heightCm: data.heightCm,
          bmi,
          notes: data.notes || null,
        },
      });

      // Update Encounter status to CONSULTATION_WAITING
      await tx.encounter.update({
        where: { id: data.encounterId },
        data: { status: 'CONSULTATION_WAITING' },
      });

      // Complete Triage Queue item
      await tx.patientQueue.updateMany({
        where: {
          encounterId: data.encounterId,
          department: 'TRIAGE',
          status: { in: ['WAITING', 'CALLED', 'IN_PROGRESS'] },
        },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });

      // Create new Queue item for CONSULTATION
      const consultQueueCount = await tx.patientQueue.count({
        where: { department: 'CONSULTATION' },
      });

      const nextQueue = await tx.patientQueue.create({
        data: {
          encounterId: data.encounterId,
          department: 'CONSULTATION',
          queueNumber: 100 + consultQueueCount + 1,
          status: 'WAITING',
          priority: data.bloodPressureSys >= 160 || data.temperature >= 39 ? 2 : 1,
        },
      });

      return { triage, nextQueue };
    });

    await recordAuditLog({
      userId: req.user?.id,
      action: 'CREATE',
      module: 'TRIAGE',
      entityName: 'Triage',
      entityId: result.triage.id,
      details: { encounterId: data.encounterId, bmi },
      ipAddress: req.ip,
    });

    return res.status(201).json(result);
  } catch (error) {
    console.error('Triage save error:', error);
    return res.status(500).json({ error: 'Failed to record triage vitals' });
  }
});

export default router;
