import { Router, Response } from 'express';
import prisma from '../prisma';
import { authenticate, authorizeRoles, AuthenticatedRequest } from '../middleware/auth';
import { recordAuditLog } from '../services/audit.service';

const router = Router();

router.use(authenticate);

// GET /api/hr/stats - HR KPIs
router.get('/stats', authorizeRoles('ADMINISTRATOR', 'HR'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const totalStaff = await prisma.employee.count();
    const activeStaff = await prisma.employee.count({ where: { isActive: true } });
    const pendingLeaves = await prisma.leaveApplication.count({ where: { status: 'PENDING' } });
    const salaryAggregate = await prisma.employee.aggregate({
      where: { isActive: true },
      _sum: { basicSalary: true },
    });

    return res.json({
      totalEmployees: totalStaff,
      activeEmployees: activeStaff,
      pendingLeaveRequests: pendingLeaves,
      monthlyPayrollLiability: salaryAggregate._sum.basicSalary || 0,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch HR statistics' });
  }
});

// GET /api/hr/employees - List employees
router.get('/employees', authorizeRoles('ADMINISTRATOR', 'HR'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const employees = await prisma.employee.findMany({
      include: {
        leaves: { take: 5, orderBy: { appliedAt: 'desc' } },
        payrolls: { take: 1, orderBy: { year: 'desc' } },
      },
      orderBy: { staffNumber: 'asc' },
    });
    return res.json(employees);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

// POST /api/hr/employees - Register new employee
router.post('/employees', authorizeRoles('ADMINISTRATOR', 'HR'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { fullName, department, designation, phone, email, basicSalary } = req.body;
    if (!fullName || !department || !email || !basicSalary) {
      return res.status(400).json({ error: 'Full name, department, email, and salary are required' });
    }

    const count = await prisma.employee.count();
    const staffNumber = `EMP-${String(count + 1).padStart(3, '0')}`;

    const employee = await prisma.employee.create({
      data: {
        staffNumber,
        fullName,
        department,
        designation: designation || 'Staff Member',
        phone: phone || '',
        email,
        basicSalary: parseFloat(basicSalary) || 0,
        hireDate: new Date(),
      },
    });

    await recordAuditLog({
      userId: req.user?.id,
      action: 'CREATE',
      module: 'HR',
      entityName: 'Employee',
      entityId: employee.id,
      details: { staffNumber, fullName, department },
    });

    return res.status(201).json(employee);
  } catch (error) {
    console.error('Create employee error:', error);
    return res.status(500).json({ error: 'Failed to register employee' });
  }
});

// GET /api/hr/leaves - List leave applications
router.get('/leaves', authorizeRoles('ADMINISTRATOR', 'HR', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'TRIAGE_NURSE', 'LABORATORY', 'PHARMACIST', 'BILLING', 'PROCUREMENT', 'ACCOUNTS'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const leaves = await prisma.leaveApplication.findMany({
      include: { employee: true },
      orderBy: { appliedAt: 'desc' },
    });
    return res.json(leaves);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch leave applications' });
  }
});

// POST /api/hr/leaves - Apply for leave
router.post('/leaves', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { employeeId, leaveType, startDate, endDate, daysCount, reason } = req.body;
    if (!employeeId || !leaveType || !startDate || !endDate) {
      return res.status(400).json({ error: 'Missing required leave fields' });
    }

    const leave = await prisma.leaveApplication.create({
      data: {
        employeeId,
        leaveType,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        daysCount: parseInt(daysCount, 10) || 1,
        reason: reason || 'Personal/Medical',
        status: 'PENDING',
      },
      include: { employee: true },
    });

    await recordAuditLog({
      userId: req.user?.id,
      action: 'CREATE',
      module: 'HR',
      entityName: 'LeaveApplication',
      entityId: leave.id,
      details: { employeeId, leaveType, daysCount },
    });

    return res.status(201).json(leave);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to submit leave application' });
  }
});

// PUT /api/hr/leaves/:id/status - Approve or reject leave
router.put('/leaves/:id/status', authorizeRoles('ADMINISTRATOR', 'HR'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // APPROVED, REJECTED

    const updated = await prisma.leaveApplication.update({
      where: { id },
      data: { status },
      include: { employee: true },
    });

    await recordAuditLog({
      userId: req.user?.id,
      action: 'UPDATE',
      module: 'HR',
      entityName: 'LeaveApplication',
      entityId: id,
      details: { status },
    });

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update leave status' });
  }
});

// GET /api/hr/payroll - List payroll records
router.get('/payroll', authorizeRoles('ADMINISTRATOR', 'HR', 'ACCOUNTS'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const payrolls = await prisma.payroll.findMany({
      include: { employee: true },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
    return res.json(payrolls);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch payroll records' });
  }
});

// POST /api/hr/payroll/process - Run payroll batch for a month
router.post('/payroll/process', authorizeRoles('ADMINISTRATOR', 'HR'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { month, year } = req.body;
    const m = parseInt(month, 10) || new Date().getMonth() + 1;
    const y = parseInt(year, 10) || new Date().getFullYear();

    const employees = await prisma.employee.findMany({ where: { isActive: true } });
    const processed = [];

    for (const emp of employees) {
      const existing = await prisma.payroll.findFirst({
        where: { employeeId: emp.id, month: m, year: y },
      });

      if (!existing) {
        const allowances = Math.round(emp.basicSalary * 0.15);
        const deductions = Math.round(emp.basicSalary * 0.12);
        const netSalary = emp.basicSalary + allowances - deductions;

        const record = await prisma.payroll.create({
          data: {
            employeeId: emp.id,
            month: m,
            year: y,
            basicSalary: emp.basicSalary,
            allowances,
            deductions,
            netSalary,
            isDisbursed: true,
            disbursedAt: new Date(),
          },
        });
        processed.push(record);
      }
    }

    await recordAuditLog({
      userId: req.user?.id,
      action: 'PROCESS',
      module: 'HR',
      entityName: 'PayrollBatch',
      entityId: `${y}-${m}`,
      details: { month: m, year: y, count: processed.length },
    });

    return res.json({ message: `Payroll successfully processed for ${processed.length} employees`, count: processed.length });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to process payroll' });
  }
});

export default router;
