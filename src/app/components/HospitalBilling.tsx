import { useState, useEffect } from 'react';
import { billingApi } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
  CreditCard,
  Receipt,
  Search,
  CheckCircle2,
  Clock,
  Printer,
  ShieldCheck,
  AlertCircle,
  FileText,
} from 'lucide-react';

export function HospitalBilling() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'MPESA' | 'SHA_CLAIM' | 'BANK_TRANSFER'>('CASH');
  const [refNumber, setRefNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [receiptSuccess, setReceiptSuccess] = useState<any | null>(null);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const data = await billingApi.getInvoices();
      setInvoices(data);
    } catch (err) {
      console.error('Failed to fetch invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleOpenPayment = (inv: any) => {
    setSelectedInvoice(inv);
    const balance = inv.netAmount - inv.paidAmount;
    setPaymentAmount(balance.toString());
    setRefNumber('');
    setReceiptSuccess(null);
    setPayModalOpen(true);
  };

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    try {
      setSubmitting(true);
      const res = await billingApi.recordPayment({
        invoiceId: selectedInvoice.id,
        amount: parseFloat(paymentAmount),
        method: paymentMethod,
        referenceNumber: refNumber || null,
      });
      setReceiptSuccess(res.payment);
      fetchInvoices();
    } catch (err: any) {
      alert(err.message || 'Payment processing failed');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    const q = search.toLowerCase();
    const patName = inv.encounter?.patient?.fullName?.toLowerCase() || '';
    const mrn = inv.encounter?.patient?.mrn?.toLowerCase() || '';
    const invNum = inv.invoiceNumber?.toLowerCase() || '';
    return !q || patName.includes(q) || mrn.includes(q) || invNum.includes(q);
  });

  const totalCollected = invoices.reduce((acc, inv) => acc + (inv.paidAmount || 0), 0);
  const totalOutstanding = invoices.reduce((acc, inv) => acc + Math.max(0, (inv.netAmount || 0) - (inv.paidAmount || 0)), 0);

  return (
    <div className="p-8 space-y-6">
      {/* Top Banner & KPI Cards */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Billing & Cashier Ledger</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Department fee aggregation, M-Pesa / SHA settlement, receipts, and revenue reconciliation
          </p>
        </div>
        <Button onClick={fetchInvoices} variant="outline" size="sm">
          Refresh Ledger
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Total Collections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">KES {totalCollected.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Settled payments to date</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Outstanding Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600">KES {totalOutstanding.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Pending patient & claim balances</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Active Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{invoices.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Total encounters billed</p>
          </CardContent>
        </Card>
      </div>

      {/* Invoice Filter & Search */}
      <div className="flex items-center gap-4 bg-card p-4 rounded-xl border border-border/50">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Patient Name, MRN, or Invoice number..."
            className="pl-9 text-xs"
          />
        </div>
      </div>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Patient Invoices</CardTitle>
          <CardDescription className="text-xs">
            Live database ledger from Triage, Consultation, Laboratory, Pharmacy, and Wards
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">Loading database invoices...</div>
          ) : filteredInvoices.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">No invoices found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/50 text-muted-foreground border-b">
                  <tr>
                    <th className="p-3">Invoice #</th>
                    <th className="p-3">Patient</th>
                    <th className="p-3">Encounter</th>
                    <th className="p-3">Scheme</th>
                    <th className="p-3">Total Amount</th>
                    <th className="p-3">Paid</th>
                    <th className="p-3">Balance</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {filteredInvoices.map((inv) => {
                    const balance = (inv.netAmount || 0) - (inv.paidAmount || 0);
                    const isPaid = balance <= 0;
                    return (
                      <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3 font-mono font-medium text-foreground">{inv.invoiceNumber}</td>
                        <td className="p-3">
                          <div className="font-medium text-foreground">{inv.encounter?.patient?.fullName || 'Walk-in'}</div>
                          <div className="text-[10px] text-muted-foreground">{inv.encounter?.patient?.mrn}</div>
                        </td>
                        <td className="p-3 text-muted-foreground font-mono">{inv.encounter?.encounterNumber}</td>
                        <td className="p-3">
                          <Badge variant="outline" className="text-[10px]">
                            {inv.encounter?.paymentScheme || 'CASH'}
                          </Badge>
                        </td>
                        <td className="p-3 font-medium text-foreground">KES {inv.netAmount?.toLocaleString()}</td>
                        <td className="p-3 text-emerald-600 font-medium">KES {inv.paidAmount?.toLocaleString()}</td>
                        <td className="p-3 font-medium text-rose-600">KES {balance.toLocaleString()}</td>
                        <td className="p-3">
                          <Badge
                            className={`text-[10px] ${
                              isPaid ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-amber-100 text-amber-700 border-amber-200'
                            }`}
                          >
                            {isPaid ? 'PAID' : 'PENDING'}
                          </Badge>
                        </td>
                        <td className="p-3 text-right">
                          <Button
                            size="sm"
                            variant={isPaid ? 'ghost' : 'default'}
                            className="h-7 text-xs gap-1"
                            onClick={() => handleOpenPayment(inv)}
                          >
                            {isPaid ? <Receipt className="w-3 h-3" /> : <CreditCard className="w-3 h-3" />}
                            {isPaid ? 'View Receipt' : 'Collect Payment'}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment / Receipt Modal */}
      <Dialog open={payModalOpen} onOpenChange={setPayModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-primary" />
              {receiptSuccess ? 'Official Cash Receipt' : 'Collect Patient Payment'}
            </DialogTitle>
          </DialogHeader>

          {receiptSuccess ? (
            <div className="space-y-4 py-2">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h3 className="font-bold text-emerald-900 text-sm">Payment Recorded Successfully</h3>
                <p className="text-xs text-emerald-700 font-mono">Receipt Number: {receiptSuccess.receiptNumber}</p>
              </div>

              <div className="border border-border/60 rounded-lg p-3 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount Paid:</span>
                  <span className="font-bold text-foreground">KES {receiptSuccess.amount?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Method:</span>
                  <span className="font-medium text-foreground">{receiptSuccess.method}</span>
                </div>
                {receiptSuccess.referenceNumber && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reference / Transaction Code:</span>
                    <span className="font-mono text-foreground">{receiptSuccess.referenceNumber}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cashier:</span>
                  <span className="text-foreground">{receiptSuccess.receivedByName || 'Cashier'}</span>
                </div>
              </div>

              <DialogFooter>
                <Button className="w-full gap-2" onClick={() => window.print()}>
                  <Printer className="w-4 h-4" />
                  Print Official Receipt
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <form onSubmit={handleProcessPayment} className="space-y-4 py-2">
              <div className="p-3 bg-muted/40 rounded-lg space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Patient:</span>
                  <span className="font-semibold text-foreground">{selectedInvoice?.encounter?.patient?.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">MRN:</span>
                  <span className="font-mono text-foreground">{selectedInvoice?.encounter?.patient?.mrn}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Invoiced:</span>
                  <span className="font-bold text-foreground">KES {selectedInvoice?.netAmount?.toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Payment Method</Label>
                <Select value={paymentMethod} onValueChange={(val: any) => setPaymentMethod(val)}>
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">Cash (Cash Desk)</SelectItem>
                    <SelectItem value="MPESA">M-Pesa (Till / Paybill)</SelectItem>
                    <SelectItem value="SHA_CLAIM">SHA Cover Claim</SelectItem>
                    <SelectItem value="BANK_TRANSFER">Bank Wire / Electronic Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Amount to Pay (KES)</Label>
                <Input
                  type="number"
                  step="any"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Reference Code (e.g. M-Pesa Code / Cheque #)</Label>
                <Input
                  value={refNumber}
                  onChange={(e) => setRefNumber(e.target.value)}
                  placeholder="e.g. QK8912KL90"
                  className="text-xs"
                />
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setPayModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={submitting}>
                  {submitting ? 'Processing Transaction...' : 'Confirm & Generate Receipt'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
