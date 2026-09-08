import { useState, useEffect } from 'react';
import { accountsApi } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import {
  Calculator, DollarSign, BookOpen, Scale, Plus, RefreshCw,
  CheckCircle2, ArrowUpRight, ArrowDownRight, TrendingUp
} from 'lucide-react';

export function HospitalAccounts() {
  const [stats, setStats] = useState<any>({
    totalRevenue: 0,
    totalCollected: 0,
    outstandingReceivables: 0,
    totalJournalDebits: 0,
    totalJournalCredits: 0,
  });
  const [journals, setJournals] = useState<any[]>([]);
  const [trialBalance, setTrialBalance] = useState<any>({ rows: [], totalDebit: 0, totalCredit: 0, isBalanced: true });
  const [loading, setLoading] = useState(false);

  // New Journal Entry Modal
  const [isNewJournalOpen, setIsNewJournalOpen] = useState(false);
  const [journalForm, setJournalForm] = useState({
    description: '',
    accountCode: '1001',
    accountName: 'Cash at Bank - KCB Operating',
    debit: 0,
    credit: 0,
    reference: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [sData, jData, tbData] = await Promise.all([
        accountsApi.getStats(),
        accountsApi.getJournals(),
        accountsApi.getTrialBalance(),
      ]);
      setStats(sData);
      setJournals(jData);
      setTrialBalance(tbData);
    } catch (err) {
      console.error('Failed to load accounts data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await accountsApi.createJournal(journalForm);
      setIsNewJournalOpen(false);
      setJournalForm({
        description: '',
        accountCode: '1001',
        accountName: 'Cash at Bank - KCB Operating',
        debit: 0,
        credit: 0,
        reference: '',
      });
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to post journal entry');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Accounts & Financial Ledger</h1>
            <Badge variant="outline" className="bg-cyan-50 text-cyan-800 border-cyan-300">
              General Ledger
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Double-entry general ledger, trial balance, and hospital revenue accounting.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading} className="gap-1.5 text-xs">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setIsNewJournalOpen(true)} className="gap-1.5 text-xs">
            <Plus className="w-3.5 h-3.5" />
            Post Journal Entry
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Total Invoiced Revenue</p>
              <h3 className="text-2xl font-bold text-foreground mt-1">
                KES {(stats.totalRevenue || 0).toLocaleString()}
              </h3>
              <p className="text-[11px] text-primary mt-0.5">Cumulative clinical billing</p>
            </div>
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <TrendingUp className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Cash Collections Realized</p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-1">
                KES {(stats.totalCollected || 0).toLocaleString()}
              </h3>
              <p className="text-[11px] text-emerald-600 mt-0.5">Cash / M-Pesa settlements</p>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600">
              <ArrowDownRight className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Outstanding Receivables</p>
              <h3 className="text-2xl font-bold text-amber-600 mt-1">
                KES {(stats.outstandingReceivables || 0).toLocaleString()}
              </h3>
              <p className="text-[11px] text-amber-600 mt-0.5">SHA & uncollected invoices</p>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Ledger Balance Status</p>
              <div className="flex items-center gap-1.5 mt-1">
                <h3 className="text-lg font-bold text-foreground">
                  {trialBalance.isBalanced ? 'Balanced' : 'Discrepancy'}
                </h3>
                {trialBalance.isBalanced && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">Debits equal Credits</p>
            </div>
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-700">
              <Scale className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="journals" className="space-y-4">
        <TabsList className="bg-muted/60 p-1">
          <TabsTrigger value="journals" className="text-xs gap-1.5">
            <BookOpen className="w-3.5 h-3.5" />
            General Journal ({journals.length})
          </TabsTrigger>
          <TabsTrigger value="trialBalance" className="text-xs gap-1.5">
            <Scale className="w-3.5 h-3.5" />
            Trial Balance Statement
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: General Journal */}
        <TabsContent value="journals">
          <Card className="border-border">
            <CardHeader className="p-4 border-b border-border flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold">General Journal Entries</CardTitle>
              <span className="text-xs text-muted-foreground">Sequential Audit Log</span>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/40 text-muted-foreground font-semibold border-b border-border">
                  <tr>
                    <th className="p-3">Entry #</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Account Code</th>
                    <th className="p-3">Account Name</th>
                    <th className="p-3">Description</th>
                    <th className="p-3">Ref</th>
                    <th className="p-3 text-right">Debit (KES)</th>
                    <th className="p-3 text-right">Credit (KES)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {journals.map((jrn) => (
                    <tr key={jrn.id} className="hover:bg-muted/20 transition-colors">
                      <td className="p-3 font-mono font-medium text-foreground">{jrn.entryNumber}</td>
                      <td className="p-3 text-muted-foreground">{new Date(jrn.date).toLocaleDateString()}</td>
                      <td className="p-3 font-mono font-bold text-primary">{jrn.accountCode}</td>
                      <td className="p-3 font-medium text-foreground">{jrn.accountName}</td>
                      <td className="p-3 text-muted-foreground max-w-[260px] truncate">{jrn.description}</td>
                      <td className="p-3 font-mono text-muted-foreground">{jrn.reference || '-'}</td>
                      <td className="p-3 font-mono text-right text-foreground">
                        {jrn.debit > 0 ? jrn.debit.toLocaleString() : '-'}
                      </td>
                      <td className="p-3 font-mono text-right text-foreground">
                        {jrn.credit > 0 ? jrn.credit.toLocaleString() : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Trial Balance */}
        <TabsContent value="trialBalance">
          <Card className="border-border">
            <CardHeader className="p-4 border-b border-border flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold">Standard Trial Balance Statement</CardTitle>
                <p className="text-xs text-muted-foreground">Verification of debits and credits ledger equity</p>
              </div>
              <Badge
                variant="outline"
                className={trialBalance.isBalanced ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-destructive/10 text-destructive'}
              >
                {trialBalance.isBalanced ? 'BALANCED & AUDITED' : 'OUT OF BALANCE'}
              </Badge>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/40 text-muted-foreground font-semibold border-b border-border">
                  <tr>
                    <th className="p-3">Account Code</th>
                    <th className="p-3">Account Title</th>
                    <th className="p-3 text-right">Debit Total (KES)</th>
                    <th className="p-3 text-right">Credit Total (KES)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {trialBalance.rows?.map((r: any) => (
                    <tr key={r.code} className="hover:bg-muted/20">
                      <td className="p-3 font-mono font-bold text-primary">{r.code}</td>
                      <td className="p-3 font-medium text-foreground">{r.name}</td>
                      <td className="p-3 font-mono text-right text-foreground">
                        {r.debit > 0 ? r.debit.toLocaleString() : '-'}
                      </td>
                      <td className="p-3 font-mono text-right text-foreground">
                        {r.credit > 0 ? r.credit.toLocaleString() : '-'}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-muted/50 font-bold border-t-2 border-border text-foreground">
                    <td colSpan={2} className="p-3 text-right uppercase tracking-wider">
                      Totals:
                    </td>
                    <td className="p-3 font-mono text-right">
                      KES {(trialBalance.totalDebit || 0).toLocaleString()}
                    </td>
                    <td className="p-3 font-mono text-right">
                      KES {(trialBalance.totalCredit || 0).toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Post Journal Modal */}
      <Dialog open={isNewJournalOpen} onOpenChange={setIsNewJournalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Post Double-Entry Journal</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateJournal} className="space-y-3 text-xs">
            <div>
              <Label className="text-xs">Transaction Description</Label>
              <Input
                placeholder="e.g. Purchase of Clinical Disposables"
                value={journalForm.description}
                onChange={(e) => setJournalForm({ ...journalForm, description: e.target.value })}
                required
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Account Code</Label>
                <Input
                  value={journalForm.accountCode}
                  onChange={(e) => setJournalForm({ ...journalForm, accountCode: e.target.value })}
                  required
                  className="mt-1 font-mono"
                />
              </div>
              <div>
                <Label className="text-xs">Account Name</Label>
                <Input
                  value={journalForm.accountName}
                  onChange={(e) => setJournalForm({ ...journalForm, accountName: e.target.value })}
                  required
                  className="mt-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Debit Amount (KES)</Label>
                <Input
                  type="number"
                  min="0"
                  value={journalForm.debit}
                  onChange={(e) => setJournalForm({ ...journalForm, debit: parseFloat(e.target.value) || 0 })}
                  className="mt-1 font-mono"
                />
              </div>
              <div>
                <Label className="text-xs">Credit Amount (KES)</Label>
                <Input
                  type="number"
                  min="0"
                  value={journalForm.credit}
                  onChange={(e) => setJournalForm({ ...journalForm, credit: parseFloat(e.target.value) || 0 })}
                  className="mt-1 font-mono"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">Voucher / Invoice Reference #</Label>
              <Input
                placeholder="e.g. VCH-0091"
                value={journalForm.reference}
                onChange={(e) => setJournalForm({ ...journalForm, reference: e.target.value })}
                className="mt-1 font-mono"
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsNewJournalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm">
                Commit to Ledger
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
