import { useState, useEffect } from 'react';
import { procurementApi } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import {
  Truck, ShoppingCart, Users, DollarSign, Plus, CheckCircle,
  Clock, AlertTriangle, FileText, RefreshCw, Search
} from 'lucide-react';

export function HospitalProcurement() {
  const [stats, setStats] = useState<any>({ totalSuppliers: 0, totalPurchaseOrders: 0, pendingRequisitions: 0, totalSpend: 0 });
  const [requisitions, setRequisitions] = useState<any[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // New Requisition Dialog
  const [isNewReqOpen, setIsNewReqOpen] = useState(false);
  const [reqForm, setReqForm] = useState({
    department: 'Pharmacy',
    itemDescription: '',
    quantity: 1,
    purpose: '',
  });

  // New Supplier Dialog
  const [isNewSupOpen, setIsNewSupOpen] = useState(false);
  const [supForm, setSupForm] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [sData, rData, poData, supData] = await Promise.all([
        procurementApi.getStats(),
        procurementApi.getRequisitions(),
        procurementApi.getPurchaseOrders(),
        procurementApi.getSuppliers(),
      ]);
      setStats(sData);
      setRequisitions(rData);
      setPurchaseOrders(poData);
      setSuppliers(supData);
    } catch (err) {
      console.error('Failed to load procurement data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateReq = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await procurementApi.createRequisition(reqForm);
      setIsNewReqOpen(false);
      setReqForm({ department: 'Pharmacy', itemDescription: '', quantity: 1, purpose: '' });
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create requisition');
    }
  };

  const handleUpdateReqStatus = async (id: string, status: string) => {
    try {
      await procurementApi.updateRequisitionStatus(id, status);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update requisition');
    }
  };

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await procurementApi.createSupplier(supForm);
      setIsNewSupOpen(false);
      setSupForm({ name: '', contactPerson: '', phone: '', email: '', address: '' });
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create supplier');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Procurement & Stores</h1>
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
              Supply Chain
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage hospital requisitions, purchase orders, certified medical vendors, and stock movements.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading} className="gap-1.5 text-xs">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setIsNewReqOpen(true)} className="gap-1.5 text-xs">
            <Plus className="w-3.5 h-3.5" />
            New Requisition
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Pending Requisitions</p>
              <h3 className="text-2xl font-bold text-foreground mt-1">{stats.pendingRequisitions}</h3>
              <p className="text-[11px] text-amber-600 mt-0.5">Awaiting procurement review</p>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600">
              <ShoppingCart className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Purchase Orders</p>
              <h3 className="text-2xl font-bold text-foreground mt-1">{stats.totalPurchaseOrders}</h3>
              <p className="text-[11px] text-blue-600 mt-0.5">Active contracts & orders</p>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600">
              <FileText className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Approved Suppliers</p>
              <h3 className="text-2xl font-bold text-foreground mt-1">{stats.totalSuppliers}</h3>
              <p className="text-[11px] text-emerald-600 mt-0.5">Active vendor accounts</p>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600">
              <Truck className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Committed Spend</p>
              <h3 className="text-2xl font-bold text-foreground mt-1">
                KES {(stats.totalSpend || 0).toLocaleString()}
              </h3>
              <p className="text-[11px] text-primary mt-0.5">Total PO commitments</p>
            </div>
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <DollarSign className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="requisitions" className="space-y-4">
        <TabsList className="bg-muted/60 p-1">
          <TabsTrigger value="requisitions" className="text-xs gap-1.5">
            <ShoppingCart className="w-3.5 h-3.5" />
            Internal Requisitions ({requisitions.length})
          </TabsTrigger>
          <TabsTrigger value="purchaseOrders" className="text-xs gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            Purchase Orders ({purchaseOrders.length})
          </TabsTrigger>
          <TabsTrigger value="suppliers" className="text-xs gap-1.5">
            <Truck className="w-3.5 h-3.5" />
            Suppliers & Vendors ({suppliers.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Requisitions */}
        <TabsContent value="requisitions">
          <Card className="border-border">
            <CardHeader className="p-4 border-b border-border flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold">Departmental Requisitions Ledger</CardTitle>
              <span className="text-xs text-muted-foreground">Real-time status updates</span>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/40 text-muted-foreground font-semibold border-b border-border">
                  <tr>
                    <th className="p-3">Req #</th>
                    <th className="p-3">Department</th>
                    <th className="p-3">Item Description</th>
                    <th className="p-3">Qty</th>
                    <th className="p-3">Requested By</th>
                    <th className="p-3">Purpose</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {requisitions.map((req) => (
                    <tr key={req.id} className="hover:bg-muted/20 transition-colors">
                      <td className="p-3 font-mono font-medium text-foreground">{req.reqNumber}</td>
                      <td className="p-3 font-medium">{req.department}</td>
                      <td className="p-3 text-foreground font-semibold">{req.itemDescription}</td>
                      <td className="p-3">{req.quantity}</td>
                      <td className="p-3 text-muted-foreground">{req.requestedBy}</td>
                      <td className="p-3 text-muted-foreground max-w-[200px] truncate">{req.purpose}</td>
                      <td className="p-3">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-semibold ${
                            req.status === 'APPROVED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : req.status === 'PENDING'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}
                        >
                          {req.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-right">
                        {req.status === 'PENDING' && (
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateReqStatus(req.id, 'APPROVED')}
                              className="h-7 px-2 text-[11px] text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateReqStatus(req.id, 'REJECTED')}
                              className="h-7 px-2 text-[11px] text-destructive border-destructive/20 hover:bg-destructive/10"
                            >
                              Reject
                            </Button>
                          </div>
                        )}
                        {req.status === 'APPROVED' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateReqStatus(req.id, 'ORDERED')}
                            className="h-7 px-2 text-[11px] text-blue-600 border-blue-200 hover:bg-blue-50"
                          >
                            Mark Ordered
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {requisitions.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-muted-foreground">
                        No requisitions recorded in database.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Purchase Orders */}
        <TabsContent value="purchaseOrders">
          <Card className="border-border">
            <CardHeader className="p-4 border-b border-border">
              <CardTitle className="text-sm font-semibold">Purchase Orders (LPOs)</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/40 text-muted-foreground font-semibold border-b border-border">
                  <tr>
                    <th className="p-3">PO Number</th>
                    <th className="p-3">Supplier Name</th>
                    <th className="p-3">Total Amount</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Date Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {purchaseOrders.map((po) => (
                    <tr key={po.id} className="hover:bg-muted/20">
                      <td className="p-3 font-mono font-medium">{po.poNumber}</td>
                      <td className="p-3 font-semibold text-foreground">{po.supplier?.name}</td>
                      <td className="p-3 font-mono font-bold text-foreground">
                        KES {po.totalAmount.toLocaleString()}
                      </td>
                      <td className="p-3">
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${
                            po.status === 'RECEIVED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}
                        >
                          {po.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {new Date(po.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Suppliers */}
        <TabsContent value="suppliers">
          <Card className="border-border">
            <CardHeader className="p-4 border-b border-border flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold">Registered Suppliers & Vendors</CardTitle>
              <Button size="sm" onClick={() => setIsNewSupOpen(true)} className="gap-1 text-xs h-8">
                <Plus className="w-3.5 h-3.5" /> Add Supplier
              </Button>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/40 text-muted-foreground font-semibold border-b border-border">
                  <tr>
                    <th className="p-3">Supplier Name</th>
                    <th className="p-3">Contact Person</th>
                    <th className="p-3">Phone</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {suppliers.map((sup) => (
                    <tr key={sup.id} className="hover:bg-muted/20">
                      <td className="p-3 font-bold text-foreground">{sup.name}</td>
                      <td className="p-3">{sup.contactPerson || '-'}</td>
                      <td className="p-3 font-mono">{sup.phone}</td>
                      <td className="p-3 text-muted-foreground">{sup.email || '-'}</td>
                      <td className="p-3 text-muted-foreground">{sup.address || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* New Requisition Dialog */}
      <Dialog open={isNewReqOpen} onOpenChange={setIsNewReqOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Submit Departmental Requisition</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateReq} className="space-y-3 text-xs">
            <div>
              <Label htmlFor="reqDept" className="text-xs">Department</Label>
              <Input
                id="reqDept"
                value={reqForm.department}
                onChange={(e) => setReqForm({ ...reqForm, department: e.target.value })}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="reqItem" className="text-xs">Item Description & Specification</Label>
              <Input
                id="reqItem"
                placeholder="e.g. Disposable Surgical Gloves (Box of 100)"
                value={reqForm.itemDescription}
                onChange={(e) => setReqForm({ ...reqForm, itemDescription: e.target.value })}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="reqQty" className="text-xs">Quantity</Label>
              <Input
                id="reqQty"
                type="number"
                min="1"
                value={reqForm.quantity}
                onChange={(e) => setReqForm({ ...reqForm, quantity: parseInt(e.target.value, 10) || 1 })}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="reqPurpose" className="text-xs">Clinical Justification / Purpose</Label>
              <Input
                id="reqPurpose"
                placeholder="e.g. Emergency ward resuscitation replenishment"
                value={reqForm.purpose}
                onChange={(e) => setReqForm({ ...reqForm, purpose: e.target.value })}
                className="mt-1"
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsNewReqOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm">
                Submit Requisition
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* New Supplier Dialog */}
      <Dialog open={isNewSupOpen} onOpenChange={setIsNewSupOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Register Vendor / Supplier</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateSupplier} className="space-y-3 text-xs">
            <div>
              <Label className="text-xs">Company / Vendor Name</Label>
              <Input
                value={supForm.name}
                onChange={(e) => setSupForm({ ...supForm, name: e.target.value })}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Contact Person</Label>
              <Input
                value={supForm.contactPerson}
                onChange={(e) => setSupForm({ ...supForm, contactPerson: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Telephone Number</Label>
              <Input
                value={supForm.phone}
                onChange={(e) => setSupForm({ ...supForm, phone: e.target.value })}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Email Address</Label>
              <Input
                type="email"
                value={supForm.email}
                onChange={(e) => setSupForm({ ...supForm, email: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Physical Address / City</Label>
              <Input
                value={supForm.address}
                onChange={(e) => setSupForm({ ...supForm, address: e.target.value })}
                className="mt-1"
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsNewSupOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm">
                Save Vendor
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
