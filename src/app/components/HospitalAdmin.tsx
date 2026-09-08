import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import {
  CreditCard, BarChart3, Users, Settings2, DollarSign, FileText,
  Download, Search, Plus, TrendingUp, TrendingDown, CheckCircle,
  Clock, Shield, AlertCircle, Eye, Printer
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const invoices = [
  { id: "INV-2026-04521", mrn: "MRN-2026-04521", patient: "John M. Odhiambo", date: "2026-09-07", scheme: "SHA", items: 3, total: 3850, paid: 0, balance: 3850, status: "pending" },
  { id: "INV-2026-04520", mrn: "MRN-2026-04520", patient: "Grace W. Kamau", date: "2026-09-07", scheme: "Cash", items: 5, total: 6200, paid: 6200, balance: 0, status: "paid" },
  { id: "INV-2026-04519", mrn: "MRN-2026-04519", patient: "Peter K. Njoroge", date: "2026-09-07", scheme: "SHA", items: 8, total: 18500, paid: 0, balance: 18500, status: "pending" },
  { id: "INV-2026-04518", mrn: "MRN-2026-04518", patient: "Mary A. Wanjiru", date: "2026-09-07", scheme: "NHIF", items: 4, total: 4850, paid: 2500, balance: 2350, status: "partial" },
  { id: "INV-2026-04517", mrn: "MRN-2026-04517", patient: "Samuel O. Otieno", date: "2026-09-07", scheme: "Cash", items: 2, total: 1500, paid: 1500, balance: 0, status: "paid" },
  { id: "INV-2026-04200", mrn: "MRN-2026-04200", patient: "James K. Muturi", date: "2026-09-06", scheme: "SHA", items: 12, total: 45000, paid: 45000, balance: 0, status: "paid" },
];

const weeklyRevenue = [
  { day: "Mon", opd: 38500, inpatient: 62000, lab: 21000, pharmacy: 18000 },
  { day: "Tue", opd: 42000, inpatient: 58000, lab: 19500, pharmacy: 22000 },
  { day: "Wed", opd: 35000, inpatient: 71000, lab: 24000, pharmacy: 20000 },
  { day: "Thu", opd: 48000, inpatient: 55000, lab: 22000, pharmacy: 25000 },
  { day: "Fri", opd: 51000, inpatient: 68000, lab: 28000, pharmacy: 30000 },
  { day: "Sat", opd: 29000, inpatient: 44000, lab: 15000, pharmacy: 16000 },
  { day: "Sun", opd: 18000, inpatient: 38000, lab: 10000, pharmacy: 12000 },
];

const staff = [
  { id: "EMP-001", name: "Dr. Sarah Chen", dept: "Administration", role: "System Administrator", phone: "0700 000 001", status: "active" },
  { id: "EMP-002", name: "Dr. James Kamau", dept: "Consultation", role: "Senior Physician", phone: "0700 000 002", status: "active" },
  { id: "EMP-003", name: "Dr. Wanjiku Njoroge", dept: "Maternity", role: "Obstetrician", phone: "0700 000 003", status: "active" },
  { id: "EMP-004", name: "Nurse Akinyi Odhiambo", dept: "General Ward", role: "Senior Nurse", phone: "0700 000 004", status: "active" },
  { id: "EMP-005", name: "Lab Tech Mwangi", dept: "Laboratory", role: "Laboratory Technician", phone: "0700 000 005", status: "active" },
  { id: "EMP-006", name: "Pharm. Wambui Kariuki", dept: "Pharmacy", role: "Pharmacist", phone: "0700 000 006", status: "active" },
  { id: "EMP-007", name: "Cashier Otieno Fredrick", dept: "Billing", role: "Cashier", phone: "0700 000 007", status: "active" },
  { id: "EMP-008", name: "Receptionist Kamau Faith", dept: "Reception", role: "Receptionist", phone: "0700 000 008", status: "on_leave" },
];

const statusConfig: Record<string, string> = {
  paid: "bg-emerald-100 text-emerald-700 border-emerald-200",
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  partial: "bg-blue-100 text-blue-700 border-blue-200",
};

const staffStatusConfig: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  on_leave: "bg-amber-100 text-amber-700",
  inactive: "bg-gray-100 text-gray-700",
};

const schemeColors: Record<string, string> = {
  SHA: "bg-green-100 text-green-700",
  Cash: "bg-gray-100 text-gray-700",
  NHIF: "bg-blue-100 text-blue-700",
};

export function HospitalAdmin() {
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<typeof invoices[0] | null>(null);

  const totalRevenue = invoices.filter(i => i.status === "paid" || i.status === "partial").reduce((s, i) => s + i.paid, 0);
  const outstanding = invoices.reduce((s, i) => s + i.balance, 0);
  const paidCount = invoices.filter(i => i.status === "paid").length;

  const filteredInvoices = invoices.filter(inv => {
    const q = invoiceSearch.toLowerCase();
    return !q || inv.patient.toLowerCase().includes(q) || inv.id.toLowerCase().includes(q) || inv.mrn.toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f8faf9" }}>
      <div className="p-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Administration</h1>
            <p className="text-muted-foreground mt-1">Billing, staff, reports, and system settings</p>
          </div>
        </div>

        <Tabs defaultValue="billing" className="w-full">
          <TabsList className="h-9">
            <TabsTrigger value="billing" className="gap-1.5 text-xs">
              <CreditCard className="w-3.5 h-3.5" />Billing
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-1.5 text-xs">
              <BarChart3 className="w-3.5 h-3.5" />Reports
            </TabsTrigger>
            <TabsTrigger value="staff" className="gap-1.5 text-xs">
              <Users className="w-3.5 h-3.5" />Staff & HR
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-1.5 text-xs">
              <Settings2 className="w-3.5 h-3.5" />Settings
            </TabsTrigger>
          </TabsList>

          {/* BILLING TAB */}
          <TabsContent value="billing" className="mt-4 space-y-5">
            {/* Revenue Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Today's Revenue", value: `KES ${totalRevenue.toLocaleString()}`, icon: DollarSign, up: true, change: "+8%", color: "text-emerald-600", bg: "bg-emerald-50" },
                { label: "Outstanding", value: `KES ${outstanding.toLocaleString()}`, icon: AlertCircle, up: false, change: `${invoices.filter(i => i.balance > 0).length} invoices`, color: "text-amber-600", bg: "bg-amber-50" },
                { label: "Invoices Today", value: invoices.length.toString(), icon: FileText, up: true, change: `${paidCount} settled`, color: "text-primary", bg: "bg-primary/5" },
                { label: "SHA Claims", value: "3 pending", icon: Shield, up: false, change: "Verification needed", color: "text-purple-600", bg: "bg-purple-50" },
              ].map((s) => {
                const Icon = s.icon;
                return (
                  <Card key={s.label} className="border border-border/50">
                    <CardContent className="p-4 flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-5 h-5 ${s.color}`} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">{s.label}</p>
                        <p className="font-semibold text-foreground text-base leading-tight mt-0.5">{s.value}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          {s.up ? <TrendingUp className="w-3 h-3 text-emerald-600" /> : <TrendingDown className="w-3 h-3 text-amber-500" />}
                          <span className="text-xs text-muted-foreground">{s.change}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Invoice List */}
            <Card className="border border-border/50">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    Invoices
                  </CardTitle>
                  <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search invoices…"
                      value={invoiceSearch}
                      onChange={(e) => setInvoiceSearch(e.target.value)}
                      className="pl-9 h-8 text-sm"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/50 bg-muted/30">
                        {["Invoice #", "Patient", "Date", "Scheme", "Total (KES)", "Paid (KES)", "Balance (KES)", "Status", ""].map(h => (
                          <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {filteredInvoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-accent/20 transition-colors">
                          <td className="px-4 py-3 font-mono text-xs text-primary font-medium">{inv.id}</td>
                          <td className="px-4 py-3">
                            <p className="font-medium text-foreground">{inv.patient}</p>
                            <p className="text-xs text-muted-foreground font-mono">{inv.mrn}</p>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground text-xs">{inv.date}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium ${schemeColors[inv.scheme]}`}>
                              <Shield className="w-2.5 h-2.5" />{inv.scheme}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-medium">{inv.total.toLocaleString()}</td>
                          <td className="px-4 py-3 text-emerald-700 font-medium">{inv.paid.toLocaleString()}</td>
                          <td className={`px-4 py-3 font-medium ${inv.balance > 0 ? "text-amber-600" : "text-muted-foreground"}`}>
                            {inv.balance.toLocaleString()}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border ${statusConfig[inv.status]}`}>
                              {inv.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => { setSelectedInvoice(inv); setPaymentOpen(true); }}>
                                <Eye className="w-3.5 h-3.5" />
                              </Button>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                <Printer className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* REPORTS TAB */}
          <TabsContent value="reports" className="mt-4 space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {[
                { title: "Daily Revenue Report", desc: "Revenue by department and payment method", icon: DollarSign },
                { title: "Patient Attendance Report", desc: "Registration, visits, and scheme breakdown", icon: Users },
                { title: "Laboratory Report", desc: "Tests performed, pending, and turnaround times", icon: FileText },
                { title: "Pharmacy Report", desc: "Dispensing, stock movements, low stock alerts", icon: FileText },
                { title: "Billing & Payments Report", desc: "Collections, outstanding, and SHA claims", icon: CreditCard },
                { title: "Staff Activity Report", desc: "Logins, actions, and audit trail", icon: Shield },
              ].map((r) => {
                const Icon = r.icon;
                return (
                  <Card key={r.title} className="border border-border/50 hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4 flex items-start gap-3">
                      <div className="w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground text-sm">{r.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{r.desc}</p>
                        <div className="flex gap-2 mt-2">
                          <Button size="sm" variant="outline" className="h-6 text-xs gap-1 px-2">
                            <Eye className="w-3 h-3" />Preview
                          </Button>
                          <Button size="sm" variant="outline" className="h-6 text-xs gap-1 px-2">
                            <Download className="w-3 h-3" />PDF
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <Card className="border border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  Weekly Revenue Breakdown (KES)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={weeklyRevenue} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v / 1000}k`} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v: number) => [`KES ${v.toLocaleString()}`, ""]} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="opd" name="OPD" fill="#030213" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="inpatient" name="Inpatient" fill="#6366f1" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="lab" name="Laboratory" fill="#8b5cf6" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="pharmacy" name="Pharmacy" fill="#10b981" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* STAFF TAB */}
          <TabsContent value="staff" className="mt-4 space-y-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{staff.length} staff members</p>
              <Button className="gap-2 h-8 text-sm">
                <Plus className="w-4 h-4" />Add Staff
              </Button>
            </div>
            <Card className="border border-border/50">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/50 bg-muted/30">
                        {["Employee ID", "Name", "Department", "Role", "Phone", "Status", ""].map(h => (
                          <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {staff.map((s) => (
                        <tr key={s.id} className="hover:bg-accent/20 transition-colors">
                          <td className="px-4 py-3 font-mono text-xs text-primary">{s.id}</td>
                          <td className="px-4 py-3 font-medium text-foreground">{s.name}</td>
                          <td className="px-4 py-3 text-muted-foreground text-sm">{s.dept}</td>
                          <td className="px-4 py-3 text-muted-foreground text-sm">{s.role}</td>
                          <td className="px-4 py-3 text-muted-foreground text-xs">{s.phone}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${staffStatusConfig[s.status]}`}>
                              {s.status === "on_leave" ? "On Leave" : s.status.charAt(0).toUpperCase() + s.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <Button variant="ghost" size="sm" className="h-7 text-xs">Edit</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SETTINGS TAB */}
          <TabsContent value="settings" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Hospital Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { label: "Hospital Name", value: "Sunrise General Hospital" },
                    { label: "Registration No.", value: "KE-MOH-2018-04521" },
                    { label: "Address", value: "123 Health Avenue, Nairobi" },
                    { label: "Phone", value: "+254 20 123 4567" },
                    { label: "Email", value: "admin@sunrisehospital.co.ke" },
                    { label: "Currency", value: "KES (Kenya Shilling)" },
                    { label: "Invoice Prefix", value: "INV-2026-" },
                    { label: "MRN Format", value: "MRN-YYYY-NNNNN" },
                  ].map((f) => (
                    <div key={f.label} className="space-y-1">
                      <Label className="text-xs">{f.label}</Label>
                      <Input defaultValue={f.value} className="h-8 text-sm" />
                    </div>
                  ))}
                  <Button className="w-full mt-2">Save Changes</Button>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <Card className="border border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Shield className="w-4 h-4 text-primary" />
                      SHA Integration
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg border border-amber-100 text-sm text-amber-700">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      Pending official SHA API credentials
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">SHA Integration Mode</Label>
                      <Select defaultValue="mock">
                        <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mock">Mock / Test Mode</SelectItem>
                          <SelectItem value="staging">Staging</SelectItem>
                          <SelectItem value="production">Production</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">SHA Facility Code</Label>
                      <Input placeholder="Pending official credentials" className="h-8 text-sm" disabled />
                    </div>
                    <div className="text-xs text-muted-foreground p-2 bg-accent/30 rounded">
                      Integration architecture is ready. Plug in official SHA API credentials to activate.
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Payment Methods</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {["Cash", "M-Pesa", "Bank Transfer", "SHA", "NHIF", "Private Insurance"].map((pm) => (
                        <div key={pm} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
                          <span className="text-sm text-foreground">{pm}</span>
                          <Badge className="bg-emerald-100 text-emerald-700 text-xs">Active</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>

      </div>

      {/* Payment Dialog */}
      {selectedInvoice && (
        <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                Invoice {selectedInvoice.id}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 bg-accent/30 rounded-xl">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Patient</span>
                  <span className="font-medium">{selectedInvoice.patient}</span>
                </div>
                <div className="flex justify-between text-sm mt-1.5">
                  <span className="text-muted-foreground">Scheme</span>
                  <span className="font-medium">{selectedInvoice.scheme}</span>
                </div>
                <div className="flex justify-between text-sm mt-1.5">
                  <span className="text-muted-foreground">Invoice Total</span>
                  <span className="font-semibold">KES {selectedInvoice.total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm mt-1.5">
                  <span className="text-muted-foreground">Amount Paid</span>
                  <span className="text-emerald-700 font-medium">KES {selectedInvoice.paid.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm mt-1.5 pt-1.5 border-t border-border/50">
                  <span className="font-semibold">Balance Due</span>
                  <span className={`font-bold ${selectedInvoice.balance > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                    KES {selectedInvoice.balance.toLocaleString()}
                  </span>
                </div>
              </div>
              {selectedInvoice.balance > 0 && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Payment Amount (KES)</Label>
                    <Input defaultValue={selectedInvoice.balance} className="h-8 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Payment Method</Label>
                    <Select>
                      <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select…" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="mpesa">M-Pesa</SelectItem>
                        <SelectItem value="bank">Bank Transfer</SelectItem>
                        <SelectItem value="sha">SHA</SelectItem>
                        <SelectItem value="nhif">NHIF</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Reference / Receipt #</Label>
                    <Input placeholder="e.g. MPesa code, bank ref…" className="h-8 text-sm" />
                  </div>
                </div>
              )}
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" size="sm" className="gap-1.5">
                <Printer className="w-4 h-4" /> Print Invoice
              </Button>
              {selectedInvoice.balance > 0 && (
                <Button size="sm" className="gap-1.5" onClick={() => setPaymentOpen(false)}>
                  <CheckCircle className="w-4 h-4" /> Record Payment
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => setPaymentOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
