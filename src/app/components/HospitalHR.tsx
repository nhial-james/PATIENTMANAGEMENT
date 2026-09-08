import { useState, useEffect } from 'react';
import { hrApi } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import {
  Users, UserCheck, Calendar, DollarSign, Plus, RefreshCw,
  Clock, CheckCircle, AlertCircle, Briefcase, FileCheck
} from 'lucide-react';

export function HospitalHR() {
  const [stats, setStats] = useState<any>({
    totalEmployees: 0,
    activeEmployees: 0,
    pendingLeaveRequests: 0,
    monthlyPayrollLiability: 0,
  });
  const [employees, setEmployees] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [payroll, setPayroll] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // New Employee Modal
  const [isNewEmpOpen, setIsNewEmpOpen] = useState(false);
  const [empForm, setEmpForm] = useState({
    fullName: '',
    department: 'Clinical Medicine',
    designation: 'Medical Officer',
    phone: '',
    email: '',
    basicSalary: 120000,
  });

  // Leave Modal
  const [isNewLeaveOpen, setIsNewLeaveOpen] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    employeeId: '',
    leaveType: 'ANNUAL',
    startDate: '',
    endDate: '',
    daysCount: 5,
    reason: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [sData, eData, lData, pData] = await Promise.all([
        hrApi.getStats(),
        hrApi.getEmployees(),
        hrApi.getLeaves(),
        hrApi.getPayroll(),
      ]);
      setStats(sData);
      setEmployees(eData);
      setLeaves(lData);
      setPayroll(pData);
      if (eData.length > 0 && !leaveForm.employeeId) {
        setLeaveForm((prev) => ({ ...prev, employeeId: eData[0].id }));
      }
    } catch (err) {
      console.error('Failed to load HR data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await hrApi.createEmployee(empForm);
      setIsNewEmpOpen(false);
      setEmpForm({ fullName: '', department: 'Clinical Medicine', designation: 'Medical Officer', phone: '', email: '', basicSalary: 120000 });
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to add employee');
    }
  };

  const handleCreateLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await hrApi.createLeave(leaveForm);
      setIsNewLeaveOpen(false);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to submit leave');
    }
  };

  const handleUpdateLeave = async (id: string, status: string) => {
    try {
      await hrApi.updateLeaveStatus(id, status);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update leave');
    }
  };

  const handleProcessPayroll = async () => {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    if (!confirm(`Run batch payroll for Month ${currentMonth}/${currentYear} for all active staff?`)) return;

    try {
      const res = await hrApi.processPayroll({ month: currentMonth, year: currentYear });
      alert(res.message);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to process payroll');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Human Resources & Payroll</h1>
            <Badge variant="outline" className="bg-fuchsia-50 text-fuchsia-800 border-fuchsia-300">
              Staffing & Compensation
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage hospital medical staff records, duty rosters, leave applications, and monthly payroll.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading} className="gap-1.5 text-xs">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setIsNewEmpOpen(true)} className="gap-1.5 text-xs">
            <Plus className="w-3.5 h-3.5" />
            Add Staff Member
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Active Staff Members</p>
              <h3 className="text-2xl font-bold text-foreground mt-1">{stats.activeEmployees}</h3>
              <p className="text-[11px] text-emerald-600 mt-0.5">Across all hospital units</p>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600">
              <Users className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Pending Leave Requests</p>
              <h3 className="text-2xl font-bold text-amber-600 mt-1">{stats.pendingLeaveRequests}</h3>
              <p className="text-[11px] text-amber-600 mt-0.5">Awaiting HR authorization</p>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600">
              <Calendar className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Monthly Salary Liability</p>
              <h3 className="text-2xl font-bold text-foreground mt-1">
                KES {(stats.monthlyPayrollLiability || 0).toLocaleString()}
              </h3>
              <p className="text-[11px] text-primary mt-0.5">Base salary commitment</p>
            </div>
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <DollarSign className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Historical Payroll Runs</p>
              <h3 className="text-2xl font-bold text-foreground mt-1">{payroll.length}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Disbursed salary vouchers</p>
            </div>
            <div className="p-2.5 rounded-xl bg-fuchsia-500/10 text-fuchsia-700">
              <FileCheck className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="staff" className="space-y-4">
        <TabsList className="bg-muted/60 p-1">
          <TabsTrigger value="staff" className="text-xs gap-1.5">
            <Users className="w-3.5 h-3.5" />
            Staff Directory ({employees.length})
          </TabsTrigger>
          <TabsTrigger value="leaves" className="text-xs gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            Leave Management ({leaves.length})
          </TabsTrigger>
          <TabsTrigger value="payroll" className="text-xs gap-1.5">
            <DollarSign className="w-3.5 h-3.5" />
            Payroll Processing ({payroll.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Staff Directory */}
        <TabsContent value="staff">
          <Card className="border-border">
            <CardHeader className="p-4 border-b border-border">
              <CardTitle className="text-sm font-semibold">Active Hospital Personnel</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/40 text-muted-foreground font-semibold border-b border-border">
                  <tr>
                    <th className="p-3">Staff #</th>
                    <th className="p-3">Full Name</th>
                    <th className="p-3">Department</th>
                    <th className="p-3">Designation</th>
                    <th className="p-3">Phone</th>
                    <th className="p-3">Email</th>
                    <th className="p-3 text-right">Basic Salary</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {employees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-muted/20">
                      <td className="p-3 font-mono font-medium">{emp.staffNumber}</td>
                      <td className="p-3 font-bold text-foreground">{emp.fullName}</td>
                      <td className="p-3">{emp.department}</td>
                      <td className="p-3 text-muted-foreground">{emp.designation}</td>
                      <td className="p-3 font-mono">{emp.phone}</td>
                      <td className="p-3 text-muted-foreground">{emp.email}</td>
                      <td className="p-3 font-mono text-right font-semibold text-foreground">
                        KES {emp.basicSalary.toLocaleString()}
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                          ACTIVE
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Leaves */}
        <TabsContent value="leaves">
          <Card className="border-border">
            <CardHeader className="p-4 border-b border-border flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold">Leave Applications & Approvals</CardTitle>
              <Button size="sm" onClick={() => setIsNewLeaveOpen(true)} className="gap-1 text-xs h-8">
                <Plus className="w-3.5 h-3.5" /> Submit Leave Request
              </Button>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/40 text-muted-foreground font-semibold border-b border-border">
                  <tr>
                    <th className="p-3">Employee</th>
                    <th className="p-3">Department</th>
                    <th className="p-3">Leave Type</th>
                    <th className="p-3">Dates</th>
                    <th className="p-3">Days</th>
                    <th className="p-3">Reason</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {leaves.map((l) => (
                    <tr key={l.id} className="hover:bg-muted/20">
                      <td className="p-3 font-bold text-foreground">{l.employee?.fullName}</td>
                      <td className="p-3 text-muted-foreground">{l.employee?.department}</td>
                      <td className="p-3 font-medium">{l.leaveType}</td>
                      <td className="p-3 text-muted-foreground">
                        {new Date(l.startDate).toLocaleDateString()} - {new Date(l.endDate).toLocaleDateString()}
                      </td>
                      <td className="p-3 font-bold">{l.daysCount}</td>
                      <td className="p-3 text-muted-foreground max-w-[200px] truncate">{l.reason}</td>
                      <td className="p-3">
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${
                            l.status === 'APPROVED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : l.status === 'PENDING'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-destructive/10 text-destructive'
                          }`}
                        >
                          {l.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-right">
                        {l.status === 'PENDING' && (
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateLeave(l.id, 'APPROVED')}
                              className="h-7 px-2 text-[11px] text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateLeave(l.id, 'REJECTED')}
                              className="h-7 px-2 text-[11px] text-destructive border-destructive/20 hover:bg-destructive/10"
                            >
                              Reject
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {leaves.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-muted-foreground">
                        No leave applications submitted.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Payroll */}
        <TabsContent value="payroll">
          <Card className="border-border">
            <CardHeader className="p-4 border-b border-border flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold">Hospital Payroll Ledger</CardTitle>
                <p className="text-xs text-muted-foreground">Automated statutory computations (PAYE, SHA, NSSF, Housing Levy)</p>
              </div>
              <Button size="sm" onClick={handleProcessPayroll} className="gap-1.5 text-xs">
                <DollarSign className="w-3.5 h-3.5" />
                Run Monthly Batch Payroll
              </Button>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/40 text-muted-foreground font-semibold border-b border-border">
                  <tr>
                    <th className="p-3">Period</th>
                    <th className="p-3">Staff Member</th>
                    <th className="p-3">Department</th>
                    <th className="p-3 text-right">Gross Basic</th>
                    <th className="p-3 text-right">Allowances</th>
                    <th className="p-3 text-right">Deductions</th>
                    <th className="p-3 text-right">Net Disbursed</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {payroll.map((p) => (
                    <tr key={p.id} className="hover:bg-muted/20">
                      <td className="p-3 font-mono font-medium">{p.year}-{String(p.month).padStart(2, '0')}</td>
                      <td className="p-3 font-bold text-foreground">{p.employee?.fullName}</td>
                      <td className="p-3 text-muted-foreground">{p.employee?.department}</td>
                      <td className="p-3 font-mono text-right">KES {p.basicSalary.toLocaleString()}</td>
                      <td className="p-3 font-mono text-right text-emerald-600">+KES {p.allowances.toLocaleString()}</td>
                      <td className="p-3 font-mono text-right text-amber-600">-KES {p.deductions.toLocaleString()}</td>
                      <td className="p-3 font-mono text-right font-bold text-foreground">
                        KES {p.netSalary.toLocaleString()}
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                          DISBURSED
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* New Employee Modal */}
      <Dialog open={isNewEmpOpen} onOpenChange={setIsNewEmpOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Register Hospital Staff Member</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateEmployee} className="space-y-3 text-xs">
            <div>
              <Label className="text-xs">Full Legal Name</Label>
              <Input
                value={empForm.fullName}
                onChange={(e) => setEmpForm({ ...empForm, fullName: e.target.value })}
                required
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Department</Label>
                <Input
                  value={empForm.department}
                  onChange={(e) => setEmpForm({ ...empForm, department: e.target.value })}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Designation / Role</Label>
                <Input
                  value={empForm.designation}
                  onChange={(e) => setEmpForm({ ...empForm, designation: e.target.value })}
                  required
                  className="mt-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Phone Number</Label>
                <Input
                  value={empForm.phone}
                  onChange={(e) => setEmpForm({ ...empForm, phone: e.target.value })}
                  className="mt-1 font-mono"
                />
              </div>
              <div>
                <Label className="text-xs">Official Hospital Email</Label>
                <Input
                  type="email"
                  value={empForm.email}
                  onChange={(e) => setEmpForm({ ...empForm, email: e.target.value })}
                  required
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">Basic Monthly Salary (KES)</Label>
              <Input
                type="number"
                min="10000"
                value={empForm.basicSalary}
                onChange={(e) => setEmpForm({ ...empForm, basicSalary: parseFloat(e.target.value) || 0 })}
                required
                className="mt-1 font-mono"
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsNewEmpOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm">
                Save Employee Record
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Leave Application Modal */}
      <Dialog open={isNewLeaveOpen} onOpenChange={setIsNewLeaveOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Submit Leave Application</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateLeave} className="space-y-3 text-xs">
            <div>
              <Label className="text-xs">Staff Member</Label>
              <select
                value={leaveForm.employeeId}
                onChange={(e) => setLeaveForm({ ...leaveForm, employeeId: e.target.value })}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm mt-1"
                required
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.fullName} ({emp.staffNumber} - {emp.department})
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Leave Type</Label>
                <select
                  value={leaveForm.leaveType}
                  onChange={(e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value })}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm mt-1"
                >
                  <option value="ANNUAL">Annual Leave</option>
                  <option value="SICK">Medical / Sick Leave</option>
                  <option value="MATERNITY">Maternity Leave</option>
                  <option value="EMERGENCY">Compassionate / Emergency</option>
                </select>
              </div>
              <div>
                <Label className="text-xs">Duration (Days)</Label>
                <Input
                  type="number"
                  min="1"
                  value={leaveForm.daysCount}
                  onChange={(e) => setLeaveForm({ ...leaveForm, daysCount: parseInt(e.target.value, 10) || 1 })}
                  required
                  className="mt-1 font-mono"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Start Date</Label>
                <Input
                  type="date"
                  value={leaveForm.startDate}
                  onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">End Date</Label>
                <Input
                  type="date"
                  value={leaveForm.endDate}
                  onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                  required
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">Reason / Handover Notes</Label>
              <Input
                placeholder="e.g. Scheduled annual break. Handover to Dr. Kevin."
                value={leaveForm.reason}
                onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                className="mt-1"
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsNewLeaveOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm">
                Submit Request
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
