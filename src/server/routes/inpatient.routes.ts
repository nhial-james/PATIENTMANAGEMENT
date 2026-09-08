import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { recordAuditLog } from '../services/audit.service';

const router = Router();

// GET /api/inpatient/wards - Wards, Rooms, and Bed status matrix
router.get('/wards', authenticate, async (req, res) => {
  try {
    const wards = await prisma.ward.findMany({
      include: {
        rooms: {
          include: {
            beds: {
              include: {
                admissions: {
                  where: { dischargedAt: null },
                  include: {
                    patient: true,
                    nursingNotes: { take: 1, orderBy: { recordedAt: 'desc' } },
                    drugCharts: { take: 5, orderBy: { scheduledTime: 'desc' } },
                  },
                },
              },
            },
          },
        },
      },
    });

    return res.json(wards);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch wards and beds' });
  }
});

// POST /api/inpatient/nursing-note - Timestamped nursing notes
router.post('/nursing-note', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { admissionId, note } = req.body;
    if (!admissionId || !note) {
      return res.status(400).json({ error: 'admissionId and note are required' });
    }

    const created = await prisma.nursingNote.create({
      data: {
        admissionId,
        nurseId: req.user?.id || 'nurse-1',
        nurseName: req.user?.fullName || 'Ward Nurse',
        note,
      },
    });

    await recordAuditLog({
      userId: req.user?.id,
      action: 'CREATE',
      module: 'INPATIENT',
      entityName: 'NursingNote',
      entityId: created.id,
      details: { admissionId },
      ipAddress: req.ip,
    });

    return res.status(201).json(created);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to record nursing note' });
  }
});

// POST /api/inpatient/drug-admin - Medication Administration Record (MAR / Drug Chart)
router.post('/drug-admin', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { admissionId, drugName, dose, route, scheduledTime, status = 'GIVEN', notes } = req.body;

    if (!admissionId || !drugName || !dose) {
      return res.status(400).json({ error: 'admissionId, drugName, and dose are required' });
    }

    const record = await prisma.drugAdministration.create({
      data: {
        admissionId,
        drugName,
        dose,
        route: route || 'ORAL',
        scheduledTime: new Date(scheduledTime || Date.now()),
        administeredAt: status === 'GIVEN' ? new Date() : null,
        nurseId: req.user?.id || 'nurse-1',
        nurseName: req.user?.fullName || 'Ward Nurse',
        status,
        notes: notes || null,
      },
    });

    await recordAuditLog({
      userId: req.user?.id,
      action: 'UPDATE',
      module: 'INPATIENT',
      entityName: 'DrugAdministration',
      entityId: record.id,
      details: { drugName, status },
      ipAddress: req.ip,
    });

    return res.status(201).json(record);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to record drug administration' });
  }
});

// POST /api/inpatient/discharge - Close admission, release bed, finalize discharge summary
router.post('/discharge', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { admissionId, dischargeNotes } = req.body;
    if (!admissionId) {
      return res.status(400).json({ error: 'admissionId is required' });
    }

    const admission = await prisma.admission.findUnique({
      where: { id: admissionId },
      include: { bed: { include: { room: { include: { ward: true } } } }, encounter: true },
    });

    if (!admission) {
      return res.status(404).json({ error: 'Admission record not found' });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Calculate Bed Stay Days & Charge
      const dischargeTime = new Date();
      const diffHours = (dischargeTime.getTime() - admission.admittedAt.getTime()) / (1000 * 3600);
      const stayDays = Math.max(1, Math.ceil(diffHours / 24));
      const dailyRate = admission.bed.room.ward.dailyRate;
      const totalBedCharge = stayDays * dailyRate;

      // 2. Close Admission
      const updatedAdmission = await tx.admission.update({
        where: { id: admissionId },
        data: {
          dischargedAt: dischargeTime,
          dischargeNotes: dischargeNotes || 'Patient recovered and cleared for home rest.',
          dischargeDocId: req.user?.id || 'doctor-1',
        },
      });

      // 3. Mark Bed AVAILABLE
      await tx.bed.update({
        where: { id: admission.bedId },
        data: { status: 'AVAILABLE' },
      });

      // 4. Update Invoice with Ward Bed Charge
      let invoice = await tx.invoice.findFirst({
        where: { encounterId: admission.encounterId },
      });

      if (invoice) {
        await tx.invoiceItem.create({
          data: {
            invoiceId: invoice.id,
            description: `Ward Stay: ${admission.bed.room.ward.name} (${stayDays} days @ ${dailyRate}/day)`,
            category: 'WARD',
            quantity: stayDays,
            unitPrice: dailyRate,
            totalPrice: totalBedCharge,
          },
        });

        await tx.invoice.update({
          where: { id: invoice.id },
          data: {
            totalAmount: invoice.totalAmount + totalBedCharge,
            netAmount: invoice.netAmount + totalBedCharge,
          },
        });
      }

      // 5. Route to BILLING
      await tx.encounter.update({
        where: { id: admission.encounterId },
        data: { status: 'BILLING_PENDING' },
      });

      const billCount = await tx.patientQueue.count({
        where: { department: 'BILLING' },
      });

      await tx.patientQueue.create({
        data: {
          encounterId: admission.encounterId,
          department: 'BILLING',
          queueNumber: 100 + billCount + 1,
          status: 'WAITING',
        },
      });

      return { admission: updatedAdmission, stayDays, totalBedCharge };
    }, { maxWait: 15000, timeout: 30000 });

    await recordAuditLog({
      userId: req.user?.id,
      action: 'DISCHARGE',
      module: 'INPATIENT',
      entityName: 'Admission',
      entityId: admissionId,
      details: { stayDays: result.stayDays, totalBedCharge: result.totalBedCharge },
      ipAddress: req.ip,
    });

    return res.json({ success: true, ...result });
  } catch (error) {
    console.error('Discharge error:', error);
    return res.status(500).json({ error: 'Failed to process inpatient discharge' });
  }
});

export default router;
