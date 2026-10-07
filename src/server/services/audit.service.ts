import prisma from '../prisma';

export interface AuditParams {
  userId?: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'DISPENSE' | 'PAY' | 'ADMIT' | 'DISCHARGE' | 'LOGIN';
  module: 'AUTH' | 'PATIENT' | 'TRIAGE' | 'CLINICAL' | 'LAB' | 'PHARMACY' | 'BILLING' | 'INPATIENT' | 'ADMIN' | 'SHA';
  entityName: string;
  entityId: string;
  details?: Record<string, any>;
  ipAddress?: string;
}

export async function recordAuditLog(params: AuditParams) {
  try {
    return await prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        module: params.module,
        entityName: params.entityName,
        entityId: params.entityId,
        detailsJson: params.details ? JSON.stringify(params.details) : null,
        ipAddress: params.ipAddress,
      },
    });
  } catch (error) {
    console.error('Failed to record audit log:', error);
  }
}
