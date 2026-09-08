import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { recordAuditLog } from '../services/audit.service';

const router = Router();

const registerPatientSchema = z.object({
  fullName: z.string().min(3, 'Full name is required'),
  dateOfBirth: z.string().refine((val) => !isNaN(Date.parse(val)), 'Valid date of birth required'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  phone: z.string().min(9, 'Valid phone number required'),
  nationalId: z.string().optional().nullable(),
  occupation: z.string().optional().nullable(),
  residence: z.string().min(2, 'Residence is required'),
  nextOfKinName: z.string().min(2, 'Next of kin name required'),
  nextOfKinRelation: z.string().min(2, 'Next of kin relation required'),
  nextOfKinPhone: z.string().min(9, 'Next of kin phone required'),
  nextOfKinAltPhone: z.string().optional().nullable(),
  primaryScheme: z.enum(['CASH', 'SHA', 'INSURANCE']).default('CASH'),
  schemePolicyNumber: z.string().optional().nullable(),
  initialDepartment: z.enum(['TRIAGE', 'CONSULTATION']).default('TRIAGE'),
});

// GET /api/patients - Search & List
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { q, page = '1', limit = '20' } = req.query;
    const queryStr = typeof q === 'string' ? q.trim() : '';
    const take = parseInt(limit as string, 10) || 20;
    const skip = ((parseInt(page as string, 10) || 1) - 1) * take;

    const where = queryStr
      ? {
          OR: [
            { mrn: { contains: queryStr } },
            { fullName: { contains: queryStr } },
            { phone: { contains: queryStr } },
            { nationalId: { contains: queryStr } },
          ],
        }
      : {};

    const [patients, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        take,
        skip,
        orderBy: { createdAt: 'desc' },
        include: {
          encounters: {
            orderBy: { startedAt: 'desc' },
            take: 1,
            include: {
              queueEntries: {
                where: { status: 'WAITING' },
                take: 1,
              },
            },
          },
        },
      }),
      prisma.patient.count({ where }),
    ]);

    return res.json({
      data: patients,
      meta: {
        total,
        page: parseInt(page as string, 10) || 1,
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    });
  } catch (error) {
    console.error('Fetch patients error:', error);
    return res.status(500).json({ error: 'Failed to search patients' });
  }
});

// POST /api/patients - Register patient
router.post('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parseResult = registerPatientSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parseResult.error.flatten().fieldErrors,
      });
    }

    const data = parseResult.data;

    // Check duplicate national ID if provided
    if (data.nationalId) {
      const existing = await prisma.patient.findUnique({
        where: { nationalId: data.nationalId },
      });
      if (existing) {
        return res.status(409).json({
          error: `Patient already registered with National ID ${data.nationalId} (MRN: ${existing.mrn})`,
        });
      }
    }

    // Generate MRN and Encounter numbers
    const count = await prisma.patient.count();
    const mrn = `PAT-2026-${String(count + 1).padStart(4, '0')}`;
    const encCount = await prisma.encounter.count();
    const encounterNumber = `ENC-2026-${String(encCount + 1).padStart(4, '0')}`;

    // Transactional creation: Patient + Encounter + Initial Queue + Audit
    const result = await prisma.$transaction(async (tx) => {
      const patient = await tx.patient.create({
        data: {
          mrn,
          nationalId: data.nationalId || null,
          fullName: data.fullName,
          dateOfBirth: new Date(data.dateOfBirth),
          gender: data.gender,
          phone: data.phone,
          occupation: data.occupation || null,
          residence: data.residence,
          nextOfKinName: data.nextOfKinName,
          nextOfKinRelation: data.nextOfKinRelation,
          nextOfKinPhone: data.nextOfKinPhone,
          nextOfKinAltPhone: data.nextOfKinAltPhone || null,
          primaryScheme: data.primaryScheme,
          schemePolicyNumber: data.schemePolicyNumber || null,
        },
      });

      const encounter = await tx.encounter.create({
        data: {
          encounterNumber,
          patientId: patient.id,
          status: 'TRIAGE_WAITING',
          paymentScheme: data.primaryScheme,
          schemeNumber: data.schemePolicyNumber || null,
        },
      });

      const queueCount = await tx.patientQueue.count({
        where: { department: data.initialDepartment },
      });

      const queue = await tx.patientQueue.create({
        data: {
          encounterId: encounter.id,
          department: data.initialDepartment,
          queueNumber: 100 + queueCount + 1,
          status: 'WAITING',
        },
      });

      return { patient, encounter, queue };
    });

    await recordAuditLog({
      userId: req.user?.id,
      action: 'CREATE',
      module: 'PATIENT',
      entityName: 'Patient',
      entityId: result.patient.id,
      details: { mrn: result.patient.mrn, name: result.patient.fullName },
      ipAddress: req.ip,
    });

    return res.status(201).json(result);
  } catch (error) {
    console.error('Patient registration error:', error);
    return res.status(500).json({ error: 'Failed to register patient' });
  }
});

// GET /api/patients/:id - Complete Master Profile
router.get('/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const patient = await prisma.patient.findFirst({
      where: {
        OR: [{ id: req.params.id }, { mrn: req.params.id }],
      },
      include: {
        encounters: {
          orderBy: { startedAt: 'desc' },
          include: {
            triage: true,
            consultations: {
              include: { diagnoses: true },
            },
            labOrders: {
              include: {
                items: { include: { test: true } },
              },
            },
            prescriptions: {
              include: {
                items: { include: { drug: true } },
              },
            },
            invoices: {
              include: {
                items: true,
                payments: true,
              },
            },
            admission: {
              include: {
                bed: { include: { room: { include: { ward: true } } } },
                nursingNotes: true,
                drugCharts: true,
              },
            },
            queueEntries: true,
          },
        },
      },
    });

    if (!patient) {
      return res.status(404).json({ error: 'Patient record not found' });
    }

    return res.json(patient);
  } catch (error) {
    console.error('Fetch patient profile error:', error);
    return res.status(500).json({ error: 'Failed to retrieve patient profile' });
  }
});

export default router;
