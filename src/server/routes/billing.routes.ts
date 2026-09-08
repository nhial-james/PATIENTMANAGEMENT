import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { recordAuditLog } from '../services/audit.service';

const router = Router();

// GET /api/billing/invoices - Invoices list
router.get('/invoices', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status } = req.query;
    const where = status ? { status: status as string } : {};

    const invoices = await prisma.invoice.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        encounter: {
          include: { patient: true },
        },
        items: true,
        payments: true,
      },
    });

    return res.json(invoices);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

// GET /api/billing/invoices/:id - Single Invoice Details
router.get('/invoices/:id', authenticate, async (req, res) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id },
      include: {
        encounter: {
          include: { patient: true },
        },
        items: true,
        payments: true,
      },
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    return res.json(invoice);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve invoice' });
  }
});

const paymentSchema = z.object({
  invoiceId: z.string(),
  amount: z.number().positive(),
  method: z.enum(['CASH', 'MPESA', 'BANK_TRANSFER', 'SHA_CLAIM', 'INSURANCE']),
  referenceNumber: z.string().optional().nullable(),
});

// POST /api/billing/payments - Record Payment (Transaction)
router.post('/payments', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parseResult = paymentSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parseResult.error.flatten().fieldErrors,
      });
    }

    const data = parseResult.data;

    const invoice = await prisma.invoice.findUnique({
      where: { id: data.invoiceId },
      include: { encounter: true },
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const remainingBalance = invoice.netAmount - invoice.paidAmount;
    if (data.amount > remainingBalance) {
      return res.status(400).json({
        error: `Payment amount (${data.amount}) exceeds outstanding balance (${remainingBalance})`,
      });
    }

    const payCount = await prisma.payment.count();
    const receiptNumber = `REC-2026-${String(payCount + 1).padStart(4, '0')}`;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Payment
      const payment = await tx.payment.create({
        data: {
          receiptNumber,
          invoiceId: invoice.id,
          amount: data.amount,
          method: data.method,
          referenceNumber: data.referenceNumber || null,
          receivedById: req.user?.id || 'cashier-1',
          receivedByName: req.user?.fullName || 'Cashier Officer',
        },
      });

      // 2. Update Invoice Status
      const newPaidAmount = invoice.paidAmount + data.amount;
      const isFullyPaid = newPaidAmount >= invoice.netAmount;
      const updatedInvoice = await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          paidAmount: newPaidAmount,
          status: isFullyPaid ? 'PAID' : 'PARTIALLY_PAID',
        },
      });

      // 3. If fully paid, complete Billing Queue and Encounter
      if (isFullyPaid) {
        await tx.patientQueue.updateMany({
          where: {
            encounterId: invoice.encounterId,
            department: 'BILLING',
            status: { in: ['WAITING', 'CALLED', 'IN_PROGRESS'] },
          },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
          },
        });

        await tx.encounter.update({
          where: { id: invoice.encounterId },
          data: {
            status: 'COMPLETED',
            endedAt: new Date(),
          },
        });
      }

      return { payment, invoice: updatedInvoice };
    });

    await recordAuditLog({
      userId: req.user?.id,
      action: 'PAY',
      module: 'BILLING',
      entityName: 'Payment',
      entityId: result.payment.id,
      details: {
        receiptNumber: result.payment.receiptNumber,
        amount: data.amount,
        method: data.method,
      },
      ipAddress: req.ip,
    });

    return res.status(201).json(result);
  } catch (error) {
    console.error('Payment error:', error);
    return res.status(500).json({ error: 'Failed to process payment' });
  }
});

export default router;
