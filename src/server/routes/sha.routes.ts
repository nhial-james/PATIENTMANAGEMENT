import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { recordAuditLog } from '../services/audit.service';

const router = Router();

// Interface for SHA Integration (Adapter Pattern)
export interface ISHAGateway {
  verifyEligibility(params: {
    idNumber: string;
    memberNumber?: string;
  }): Promise<{
    isEligible: boolean;
    memberNumber: string;
    beneficiaryName: string;
    schemeTier: string;
    validUntil: string;
    referenceCode: string;
  }>;

  submitClaim(claim: {
    claimReference: string;
    patientId: string;
    encounterId: string;
    totalAmount: number;
    diagnosisCodes: string[];
  }): Promise<{
    success: boolean;
    claimStatus: 'ACCEPTED' | 'PENDING_REVIEW' | 'REJECTED';
    claimAcknowledgmentId: string;
    timestamp: string;
    rejectionReason?: string;
  }>;
}

// Offline SHA Simulator Adapter (Mock)
class SHAMockAdapter implements ISHAGateway {
  async verifyEligibility(params: { idNumber: string; memberNumber?: string }) {
    // Deterministic simulation
    const isEligible = params.idNumber !== '00000000';
    return {
      isEligible,
      memberNumber: params.memberNumber || `SHA-${params.idNumber.slice(0, 6)}`,
      beneficiaryName: 'Verified SHA Beneficiary',
      schemeTier: 'Comprehensive Public Healthcare Cover (CPHC)',
      validUntil: '2027-12-31',
      referenceCode: `SHA-VER-${Date.now().toString().slice(-6)}`,
    };
  }

  async submitClaim(claim: {
    claimReference: string;
    patientId: string;
    encounterId: string;
    totalAmount: number;
    diagnosisCodes: string[];
  }) {
    return {
      success: true,
      claimStatus: 'ACCEPTED' as const,
      claimAcknowledgmentId: `SHA-ACK-${Math.floor(100000 + Math.random() * 900000)}`,
      timestamp: new Date().toISOString(),
    };
  }
}

// In production, instantiate SHAProductionAdapter using official credentials
const shaGateway: ISHAGateway = new SHAMockAdapter();

// POST /api/sha/verify-eligibility
router.post('/verify-eligibility', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { idNumber, memberNumber } = req.body;
    if (!idNumber) {
      return res.status(400).json({ error: 'National ID number is required for SHA verification' });
    }

    const result = await shaGateway.verifyEligibility({ idNumber, memberNumber });

    await recordAuditLog({
      userId: req.user?.id,
      action: 'UPDATE',
      module: 'SHA',
      entityName: 'SHAVerification',
      entityId: idNumber,
      details: result,
      ipAddress: req.ip,
    });

    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: 'SHA Eligibility Gateway error' });
  }
});

// POST /api/sha/claims - Submit Claim
router.post('/claims', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { encounterId, memberNumber, claimedAmount, diagnosisCodes = [] } = req.body;

    if (!encounterId || !memberNumber || !claimedAmount) {
      return res.status(400).json({ error: 'encounterId, memberNumber, and claimedAmount are required' });
    }

    const claimCount = await prisma.sHAClaim.count();
    const claimReference = `SHA-CLM-2026-${String(claimCount + 1).padStart(4, '0')}`;

    const gatewayResult = await shaGateway.submitClaim({
      claimReference,
      patientId: 'patient',
      encounterId,
      totalAmount: Number(claimedAmount),
      diagnosisCodes,
    });

    const shaRecord = await prisma.sHAClaim.create({
      data: {
        claimReference,
        encounterId,
        memberNumber,
        claimedAmount: Number(claimedAmount),
        status: gatewayResult.claimStatus,
        submittedAt: new Date(),
        responseAt: new Date(),
        responseCode: gatewayResult.claimAcknowledgmentId,
        rawPayloadJson: JSON.stringify(gatewayResult),
      },
    });

    await recordAuditLog({
      userId: req.user?.id,
      action: 'CREATE',
      module: 'SHA',
      entityName: 'SHAClaim',
      entityId: shaRecord.id,
      details: { claimReference, claimedAmount },
      ipAddress: req.ip,
    });

    return res.status(201).json(shaRecord);
  } catch (error) {
    console.error('SHA claim error:', error);
    return res.status(500).json({ error: 'Failed to submit SHA claim' });
  }
});

// GET /api/sha/claims - Claim reconciliation list
router.get('/claims', authenticate, async (req, res) => {
  try {
    const claims = await prisma.sHAClaim.findMany({
      orderBy: { submittedAt: 'desc' },
      include: {
        encounter: {
          include: { patient: true },
        },
      },
    });
    return res.json(claims);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve SHA claims' });
  }
});

export default router;
