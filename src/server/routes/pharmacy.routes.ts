import { Router, Response } from 'express';
import prisma from '../prisma';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { recordAuditLog } from '../services/audit.service';

const router = Router();

// GET /api/pharmacy/inventory - Drug items, stock, batches
router.get('/inventory', authenticate, async (req, res) => {
  try {
    const drugs = await prisma.drugItem.findMany({
      include: {
        batches: {
          orderBy: { expiryDate: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });
    return res.json(drugs);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch drug inventory' });
  }
});

// GET /api/pharmacy/prescriptions - Pending / Dispensed prescriptions
router.get('/prescriptions', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status } = req.query;
    const where = status ? { status: status as string } : {};

    const prescriptions = await prisma.prescription.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        encounter: {
          include: { patient: true },
        },
        items: {
          include: { drug: true },
        },
      },
    });

    return res.json(prescriptions);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch prescriptions' });
  }
});

// POST /api/pharmacy/dispense - Fulfill prescription & Deduct Inventory (Transaction)
router.post('/dispense', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { prescriptionId, items } = req.body as {
      prescriptionId: string;
      items: Array<{
        itemId: string;
        drugId: string;
        quantity: number;
      }>;
    };

    if (!prescriptionId || !items || items.length === 0) {
      return res.status(400).json({ error: 'Prescription ID and items are required' });
    }

    const prescription = await prisma.prescription.findUnique({
      where: { id: prescriptionId },
      include: { encounter: true, items: { include: { drug: true } } },
    });

    if (!prescription) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    // Run in strict database transaction
    const result = await prisma.$transaction(async (tx) => {
      let additionalInvoiceAmount = 0;
      const dispensedItemsSummary = [];

      for (const reqItem of items) {
        // 1. Verify Stock
        const drug = await tx.drugItem.findUnique({
          where: { id: reqItem.drugId },
          include: { batches: { orderBy: { expiryDate: 'asc' } } },
        });

        if (!drug) {
          throw new Error(`Drug record ${reqItem.drugId} not found`);
        }

        if (drug.totalStock < reqItem.quantity) {
          throw new Error(
            `Insufficient stock for ${drug.name}. Available: ${drug.totalStock}, Requested: ${reqItem.quantity}`
          );
        }

        // 2. Deduct from total stock
        const newStock = drug.totalStock - reqItem.quantity;
        await tx.drugItem.update({
          where: { id: drug.id },
          data: { totalStock: newStock },
        });

        // 3. FIFO Batch Depletion
        let remainingToDeduct = reqItem.quantity;
        for (const batch of drug.batches) {
          if (remainingToDeduct <= 0) break;
          const deductFromBatch = Math.min(batch.quantity, remainingToDeduct);
          await tx.drugBatch.update({
            where: { id: batch.id },
            data: { quantity: batch.quantity - deductFromBatch },
          });
          remainingToDeduct -= deductFromBatch;
        }

        // 4. Update Prescription Item
        await tx.prescriptionItem.update({
          where: { id: reqItem.itemId },
          data: {
            quantityDispensed: reqItem.quantity,
            dispensedById: req.user?.id || 'pharmacist-1',
            dispensedAt: new Date(),
          },
        });

        // 5. Record Immutable Stock Movement
        await tx.stockMovement.create({
          data: {
            drugCode: drug.code,
            drugName: drug.name,
            type: 'DISPENSING',
            quantity: -reqItem.quantity,
            performedBy: req.user?.fullName || 'Pharmacist',
            reason: `Prescription #${prescription.id.slice(0, 8)}`,
          },
        });

        additionalInvoiceAmount += drug.sellingPrice * reqItem.quantity;
        dispensedItemsSummary.push({
          name: drug.name,
          qty: reqItem.quantity,
          unitPrice: drug.sellingPrice,
          total: drug.sellingPrice * reqItem.quantity,
        });
      }

      // 6. Mark Prescription as DISPENSED
      const updatedPrescription = await tx.prescription.update({
        where: { id: prescriptionId },
        data: { status: 'DISPENSED' },
      });

      // 7. Update Invoice with dispensed drugs
      let invoice = await tx.invoice.findFirst({
        where: { encounterId: prescription.encounterId },
      });

      if (!invoice) {
        const invCount = await tx.invoice.count();
        invoice = await tx.invoice.create({
          data: {
            invoiceNumber: `INV-2026-${String(invCount + 1).padStart(4, '0')}`,
            encounterId: prescription.encounterId,
            totalAmount: 0,
            netAmount: 0,
          },
        });
      }

      for (const item of dispensedItemsSummary) {
        await tx.invoiceItem.create({
          data: {
            invoiceId: invoice.id,
            description: `Medication: ${item.name}`,
            category: 'PHARMACY',
            quantity: item.qty,
            unitPrice: item.unitPrice,
            totalPrice: item.total,
          },
        });
      }

      await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          totalAmount: invoice.totalAmount + additionalInvoiceAmount,
          netAmount: invoice.netAmount + additionalInvoiceAmount,
        },
      });

      // 8. Complete Pharmacy Queue & Route to BILLING
      await tx.patientQueue.updateMany({
        where: {
          encounterId: prescription.encounterId,
          department: 'PHARMACY',
          status: { in: ['WAITING', 'CALLED', 'IN_PROGRESS'] },
        },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });

      await tx.encounter.update({
        where: { id: prescription.encounterId },
        data: { status: 'BILLING_PENDING' },
      });

      const billCount = await tx.patientQueue.count({
        where: { department: 'BILLING' },
      });

      const nextQueue = await tx.patientQueue.create({
        data: {
          encounterId: prescription.encounterId,
          department: 'BILLING',
          queueNumber: 100 + billCount + 1,
          status: 'WAITING',
        },
      });

      return { prescription: updatedPrescription, invoice, nextQueue };
    }, { maxWait: 15000, timeout: 30000 });

    await recordAuditLog({
      userId: req.user?.id,
      action: 'DISPENSE',
      module: 'PHARMACY',
      entityName: 'Prescription',
      entityId: prescriptionId,
      details: { itemsCount: items.length },
      ipAddress: req.ip,
    });

    return res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Dispensing error:', error);
    return res.status(400).json({ error: error.message || 'Failed to dispense medication' });
  }
});

export default router;
