import { Router, Response } from 'express';
import prisma from '../prisma';
import { authenticate, authorizeRoles, AuthenticatedRequest } from '../middleware/auth';
import { recordAuditLog } from '../services/audit.service';

const router = Router();

router.use(authenticate);

// GET /api/accounts/stats - Financial KPIs
router.get('/stats', authorizeRoles('ADMINISTRATOR', 'ACCOUNTS'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const totalPayments = await prisma.payment.aggregate({ _sum: { amount: true } });
    const invoices = await prisma.invoice.aggregate({
      _sum: { netAmount: true, paidAmount: true },
    });

    const journalCredits = await prisma.journalEntry.aggregate({ _sum: { credit: true } });
    const journalDebits = await prisma.journalEntry.aggregate({ _sum: { debit: true } });

    const totalCollected = invoices._sum.paidAmount || totalPayments._sum.amount || 0;
    const totalBilled = invoices._sum.netAmount || 0;
    const outstandingReceivables = Math.max(0, totalBilled - totalCollected);

    return res.json({
      totalRevenue: totalBilled,
      totalCollected,
      outstandingReceivables,
      totalJournalDebits: journalDebits._sum.debit || 0,
      totalJournalCredits: journalCredits._sum.credit || 0,
    });
  } catch (error) {
    console.error('Accounts stats error:', error);
    return res.status(500).json({ error: 'Failed to fetch accounts statistics' });
  }
});

// GET /api/accounts/journals - List all journal entries
router.get('/journals', authorizeRoles('ADMINISTRATOR', 'ACCOUNTS'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const journals = await prisma.journalEntry.findMany({
      orderBy: { date: 'desc' },
    });
    return res.json(journals);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch journal entries' });
  }
});

// POST /api/accounts/journals - Post new manual journal entry
router.post('/journals', authorizeRoles('ADMINISTRATOR', 'ACCOUNTS'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { description, accountCode, accountName, debit, credit, reference } = req.body;
    if (!description || !accountCode || !accountName) {
      return res.status(400).json({ error: 'Description, account code, and account name are required' });
    }

    const count = await prisma.journalEntry.count();
    const entryNumber = `JRN-2026-${String(count + 1).padStart(4, '0')}`;

    const entry = await prisma.journalEntry.create({
      data: {
        entryNumber,
        description,
        accountCode,
        accountName,
        debit: parseFloat(debit) || 0,
        credit: parseFloat(credit) || 0,
        reference: reference || null,
      },
    });

    await recordAuditLog({
      userId: req.user?.id,
      action: 'CREATE',
      module: 'ACCOUNTS',
      entityName: 'JournalEntry',
      entityId: entry.id,
      details: { entryNumber, accountCode, debit, credit },
    });

    return res.status(201).json(entry);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create journal entry' });
  }
});

// GET /api/accounts/trial-balance - Generate trial balance statement
router.get('/trial-balance', authorizeRoles('ADMINISTRATOR', 'ACCOUNTS'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const entries = await prisma.journalEntry.findMany();
    const accountsMap: Record<string, { code: string; name: string; debit: number; credit: number }> = {};

    for (const e of entries) {
      if (!accountsMap[e.accountCode]) {
        accountsMap[e.accountCode] = {
          code: e.accountCode,
          name: e.accountName,
          debit: 0,
          credit: 0,
        };
      }
      accountsMap[e.accountCode].debit += e.debit;
      accountsMap[e.accountCode].credit += e.credit;
    }

    const rows = Object.values(accountsMap);
    const totalDebit = rows.reduce((s, r) => s + r.debit, 0);
    const totalCredit = rows.reduce((s, r) => s + r.credit, 0);

    return res.json({
      rows,
      totalDebit,
      totalCredit,
      isBalanced: Math.abs(totalDebit - totalCredit) < 0.01,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to compute trial balance' });
  }
});

export default router;
