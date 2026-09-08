import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { recordAuditLog } from '../services/audit.service';

const router = Router();

const consultationSchema = z.object({
  encounterId: z.string(),
  chiefComplaint: z.string().min(3),
  history: z.string().min(3),
  examination: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  diagnoses: z.array(
    z.object({
      icdCode: z.string().optional().nullable(),
      description: z.string().min(2),
      isPrimary: z.boolean().default(false),
    })
  ),
  labTestIds: z.array(z.string()).optional(),
  prescriptions: z
    .array(
      z.object({
        drugId: z.string(),
        dosage: z.string(),
        frequency: z.string(),
        durationDays: z.number().min(1),
        quantityPrescribed: z.number().min(1),
      })
    )
    .optional(),
  nextDepartment: z.enum(['LABORATORY', 'PHARMACY', 'BILLING', 'INPATIENT', 'COMPLETED']),
  admissionDetails: z
    .object({
      wardId: z.string(),
      bedId: z.string(),
      admissionReason: z.string(),
    })
    .optional()
    .nullable(),
});

// POST /api/clinical/consultation
router.post('/consultation', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parseResult = consultationSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parseResult.error.flatten().fieldErrors,
      });
    }

    const data = parseResult.data;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Consultation
      const consultation = await tx.consultation.create({
        data: {
          encounterId: data.encounterId,
          doctorId: req.user?.id || 'doctor-1',
          doctorName: req.user?.fullName || 'Dr. Attending Clinician',
          chiefComplaint: data.chiefComplaint,
          history: data.history,
          examination: data.examination || null,
          notes: data.notes || null,
          diagnoses: {
            create: data.diagnoses.map((d) => ({
              icdCode: d.icdCode || null,
              description: d.description,
              isPrimary: d.isPrimary,
            })),
          },
        },
      });

      // 2. If Lab Tests ordered
      let labOrder = null;
      if (data.labTestIds && data.labTestIds.length > 0) {
        labOrder = await tx.laboratoryOrder.create({
          data: {
            encounterId: data.encounterId,
            orderedById: req.user?.id || 'doctor-1',
            orderedByName: req.user?.fullName || 'Dr. Attending Clinician',
            status: 'PENDING',
            items: {
              create: data.labTestIds.map((testId) => ({
                testId,
              })),
            },
          },
        });

        // Add lab tests to invoice
        const invoice = await tx.invoice.findFirst({
          where: { encounterId: data.encounterId },
        });

        if (invoice) {
          const tests = await tx.laboratoryTest.findMany({
            where: { id: { in: data.labTestIds } },
          });
          let additionalAmount = 0;
          for (const t of tests) {
            additionalAmount += t.price;
            await tx.invoiceItem.create({
              data: {
                invoiceId: invoice.id,
                description: `Lab Test: ${t.name}`,
                category: 'LAB',
                quantity: 1,
                unitPrice: t.price,
                totalPrice: t.price,
              },
            });
          }
          await tx.invoice.update({
            where: { id: invoice.id },
            data: {
              totalAmount: invoice.totalAmount + additionalAmount,
              netAmount: invoice.netAmount + additionalAmount,
            },
          });
        }
      }

      // 3. If Prescriptions ordered
      let prescription = null;
      if (data.prescriptions && data.prescriptions.length > 0) {
        prescription = await tx.prescription.create({
          data: {
            encounterId: data.encounterId,
            prescribedById: req.user?.id || 'doctor-1',
            doctorName: req.user?.fullName || 'Dr. Attending Clinician',
            status: 'PENDING',
            items: {
              create: data.prescriptions.map((rx) => ({
                drugId: rx.drugId,
                dosage: rx.dosage,
                frequency: rx.frequency,
                durationDays: rx.durationDays,
                quantityPrescribed: rx.quantityPrescribed,
              })),
            },
          },
        });
      }

      // 4. If Inpatient Admission ordered
      let admission = null;
      if (data.nextDepartment === 'INPATIENT' && data.admissionDetails) {
        // Mark bed occupied
        await tx.bed.update({
          where: { id: data.admissionDetails.bedId },
          data: { status: 'OCCUPIED' },
        });

        // Get patient id
        const enc = await tx.encounter.findUnique({
          where: { id: data.encounterId },
        });

        if (enc) {
          admission = await tx.admission.create({
            data: {
              patientId: enc.patientId,
              encounterId: enc.id,
              bedId: data.admissionDetails.bedId,
              admissionReason: data.admissionDetails.admissionReason,
              admittingDocId: req.user?.id || 'doctor-1',
              admittingDocName: req.user?.fullName || 'Dr. Attending Clinician',
            },
          });
        }
      }

      // 5. Complete Current Consultation Queue item
      await tx.patientQueue.updateMany({
        where: {
          encounterId: data.encounterId,
          department: 'CONSULTATION',
          status: { in: ['WAITING', 'CALLED', 'IN_PROGRESS'] },
        },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });

      // 6. Route to Next Department Queue
      let nextQueue = null;
      let nextEncounterStatus = 'COMPLETED';

      if (data.nextDepartment === 'LABORATORY') {
        nextEncounterStatus = 'LAB_PENDING';
      } else if (data.nextDepartment === 'PHARMACY') {
        nextEncounterStatus = 'PHARMACY_PENDING';
      } else if (data.nextDepartment === 'BILLING') {
        nextEncounterStatus = 'BILLING_PENDING';
      } else if (data.nextDepartment === 'INPATIENT') {
        nextEncounterStatus = 'ADMITTED';
      }

      await tx.encounter.update({
        where: { id: data.encounterId },
        data: { status: nextEncounterStatus },
      });

      if (data.nextDepartment !== 'COMPLETED') {
        const nextCount = await tx.patientQueue.count({
          where: { department: data.nextDepartment },
        });

        nextQueue = await tx.patientQueue.create({
          data: {
            encounterId: data.encounterId,
            department: data.nextDepartment,
            queueNumber: 100 + nextCount + 1,
            status: 'WAITING',
          },
        });
      }

      return { consultation, labOrder, prescription, admission, nextQueue };
    });

    await recordAuditLog({
      userId: req.user?.id,
      action: 'CREATE',
      module: 'CLINICAL',
      entityName: 'Consultation',
      entityId: result.consultation.id,
      details: {
        encounterId: data.encounterId,
        nextDepartment: data.nextDepartment,
        diagnosesCount: data.diagnoses.length,
      },
      ipAddress: req.ip,
    });

    return res.status(201).json(result);
  } catch (error) {
    console.error('Consultation save error:', error);
    return res.status(500).json({ error: 'Failed to record consultation and clinical orders' });
  }
});

export default router;
