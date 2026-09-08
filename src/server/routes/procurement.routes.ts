import { Router, Response } from 'express';
import prisma from '../prisma';
import { authenticate, authorizeRoles, AuthenticatedRequest } from '../middleware/auth';
import { recordAuditLog } from '../services/audit.service';

const router = Router();

// Protect all procurement routes
router.use(authenticate);

// GET /api/procurement/stats - Summary KPI stats
router.get('/stats', authorizeRoles('ADMINISTRATOR', 'PROCUREMENT'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const totalSuppliers = await prisma.supplier.count();
    const totalPOs = await prisma.purchaseOrder.count();
    const pendingReqs = await prisma.requisition.count({ where: { status: 'PENDING' } });
    const poTotals = await prisma.purchaseOrder.aggregate({ _sum: { totalAmount: true } });

    return res.json({
      totalSuppliers,
      totalPurchaseOrders: totalPOs,
      pendingRequisitions: pendingReqs,
      totalSpend: poTotals._sum.totalAmount || 0,
    });
  } catch (error) {
    console.error('Procurement stats error:', error);
    return res.status(500).json({ error: 'Failed to fetch procurement statistics' });
  }
});

// GET /api/procurement/requisitions - List all requisitions
router.get('/requisitions', authorizeRoles('ADMINISTRATOR', 'PROCUREMENT', 'DOCTOR', 'NURSE', 'LABORATORY', 'PHARMACIST'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const requisitions = await prisma.requisition.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return res.json(requisitions);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch requisitions' });
  }
});

// POST /api/procurement/requisitions - Create new requisition
router.post('/requisitions', authorizeRoles('ADMINISTRATOR', 'PROCUREMENT', 'DOCTOR', 'NURSE', 'LABORATORY', 'PHARMACIST'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { department, itemDescription, quantity, purpose } = req.body;
    if (!itemDescription || !quantity || !department) {
      return res.status(400).json({ error: 'Department, item description, and quantity are required' });
    }

    const count = await prisma.requisition.count();
    const reqNumber = `REQ-2026-${String(count + 1).padStart(4, '0')}`;

    const requisition = await prisma.requisition.create({
      data: {
        reqNumber,
        department,
        itemDescription,
        quantity: parseInt(quantity, 10),
        purpose: purpose || 'Clinical routine supply',
        requestedBy: req.user?.fullName || 'Hospital Staff',
        status: 'PENDING',
      },
    });

    await recordAuditLog({
      userId: req.user?.id,
      action: 'CREATE',
      module: 'PROCUREMENT',
      entityName: 'Requisition',
      entityId: requisition.id,
      details: { reqNumber, department, itemDescription, quantity },
    });

    return res.status(201).json(requisition);
  } catch (error) {
    console.error('Create requisition error:', error);
    return res.status(500).json({ error: 'Failed to create requisition' });
  }
});

// PUT /api/procurement/requisitions/:id/status - Update requisition status (Approve / Reject)
router.put('/requisitions/:id/status', authorizeRoles('ADMINISTRATOR', 'PROCUREMENT'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // APPROVED, REJECTED, ORDERED

    const updated = await prisma.requisition.update({
      where: { id },
      data: { status },
    });

    await recordAuditLog({
      userId: req.user?.id,
      action: 'UPDATE',
      module: 'PROCUREMENT',
      entityName: 'Requisition',
      entityId: id,
      details: { newStatus: status },
    });

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update requisition status' });
  }
});

// GET /api/procurement/purchase-orders - List purchase orders
router.get('/purchase-orders', authorizeRoles('ADMINISTRATOR', 'PROCUREMENT'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orders = await prisma.purchaseOrder.findMany({
      include: { supplier: true },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(orders);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch purchase orders' });
  }
});

// POST /api/procurement/purchase-orders - Create purchase order
router.post('/purchase-orders', authorizeRoles('ADMINISTRATOR', 'PROCUREMENT'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { supplierId, totalAmount, status } = req.body;
    if (!supplierId) {
      return res.status(400).json({ error: 'Supplier ID is required' });
    }

    const count = await prisma.purchaseOrder.count();
    const poNumber = `PO-2026-${String(count + 1).padStart(4, '0')}`;

    const po = await prisma.purchaseOrder.create({
      data: {
        poNumber,
        supplierId,
        totalAmount: parseFloat(totalAmount) || 0,
        status: status || 'ORDERED',
      },
      include: { supplier: true },
    });

    await recordAuditLog({
      userId: req.user?.id,
      action: 'CREATE',
      module: 'PROCUREMENT',
      entityName: 'PurchaseOrder',
      entityId: po.id,
      details: { poNumber, totalAmount },
    });

    return res.status(201).json(po);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create purchase order' });
  }
});

// GET /api/procurement/suppliers - List suppliers
router.get('/suppliers', authorizeRoles('ADMINISTRATOR', 'PROCUREMENT'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const suppliers = await prisma.supplier.findMany({
      include: { purchaseOrders: true },
      orderBy: { name: 'asc' },
    });
    return res.json(suppliers);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch suppliers' });
  }
});

// POST /api/procurement/suppliers - Add supplier
router.post('/suppliers', authorizeRoles('ADMINISTRATOR', 'PROCUREMENT'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, contactPerson, phone, email, address } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ error: 'Supplier name and phone are required' });
    }

    const supplier = await prisma.supplier.create({
      data: {
        name,
        contactPerson,
        phone,
        email,
        address,
      },
    });

    await recordAuditLog({
      userId: req.user?.id,
      action: 'CREATE',
      module: 'PROCUREMENT',
      entityName: 'Supplier',
      entityId: supplier.id,
      details: { name },
    });

    return res.status(201).json(supplier);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create supplier' });
  }
});

export default router;
