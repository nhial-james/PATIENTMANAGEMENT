import { useState, useEffect } from 'react';
import { inpatientApi } from '../lib/api';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  BedDouble, Users, CheckCircle, AlertTriangle, Clock,
  Activity, Pill, FileText, LogOut, Plus, RefreshCw, ChevronRight
} from 'lucide-react';

interface BedModel {
  id: string;
  bedNumber: string;
  status: string; // AVAILABLE, OCCUPIED, RESERVED, MAINTENANCE
  room?: { roomNumber: string; ward?: { name: string; dailyRate: number } };
  admissions?: any[];
}

const statusConfig: Record<string, { label: string; class: string; textClass: string; bgClass: string }> = {
  AVAILABLE: { label: 'Available', class: 'bg-emerald-500', textClass: 'text-emerald-700', bgClass: 'bg-emerald-50 border-emerald-200' },
  OCCUPIED: { label: 'Occupied', class: 'bg-red-500', textClass: 'text-red-700', bgClass: 'bg-red-50 border-red-200' },
  RESERVED: { label: 'Reserved', class: 'bg-amber-500', textClass: 'text-amber-700', bgClass: 'bg-amber-50 border-amber-200' },
  MAINTENANCE: { label: 'Maintenance', class: 'bg-gray-400', textClass: 'text-gray-600', bgClass: 'bg-gray-50 border-gray-200' },
};

export function HospitalInpatient() {
  const [wards, setWards] = useState<any[]>([]);
  const [selectedWardId, setSelectedWardId] = useState<string>('');
  const [selectedBed, setSelectedBed] = useState<BedModel | null>(null);
  const [loading, setLoading] = useState(false);

  // Modals
  const [dischargeOpen, setDischargeOpen] = useState(false);
  const [dischargeNotes, setDischargeNotes] = useState('');
  const [noteOpen, setNoteOpen] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [drugOpen, setDrugOpen] = useState(false);
  const [drugForm, setDrugForm] = useState({ drugName: '', dose: '', route: 'ORAL' });

  const loadWards = async () => {
    setLoading(true);
    try {
      const data = await inpatientApi.getWards();
      setWards(data);
      if (data.length > 0 && !selectedWardId) {
        setSelectedWardId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load wards:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWards();
  }, []);

  const currentWard = wards.find((w) => w.id === selectedWardId) || wards[0];
  const allBedsInCurrentWard: BedModel[] = currentWard?.rooms?.flatMap((r: any) =>
    r.beds.map((b: any) => ({ ...b, room: { roomNumber: r.roomNumber, ward: currentWard } }))
  ) || [];

  const totalBeds = wards.reduce((sum, w) => sum + (w.rooms?.reduce((rSum: number, r: any) => rSum + (r.beds?.length || 0), 0) || 0), 0);
  const allBedsFlat: BedModel[] = wards.flatMap((w) =>
    w.rooms?.flatMap((r: any) => r.beds.map((b: any) => ({ ...b, room: { roomNumber: r.roomNumber, ward: w } }))) || []
  );
  const occupiedBeds = allBedsFlat.filter((b) => b.status === 'OCCUPIED');
  const availableBeds = allBedsFlat.filter((b) => b.status === 'AVAILABLE');
  const reservedBeds = allBedsFlat.filter((b) => b.status === 'RESERVED');

  const activeAdmission = selectedBed?.admissions?.[0];

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAdmission || !newNote) return;
    try {
      await inpatientApi.recordNursingNote(activeAdmission.id, newNote);
      setNewNote('');
      setNoteOpen(false);
      await loadWards();
      setSelectedBed(null);
    } catch (err: any) {
      alert(err.message || 'Failed to record nursing note');
    }
  };

  const handleRecordDrug = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAdmission || !drugForm.drugName) return;
    try {
      await inpatientApi.recordDrugAdmin({
        admissionId: activeAdmission.id,
        drugName: drugForm.drugName,
        dose: drugForm.dose,
        route: drugForm.route,
      });
      setDrugForm({ drugName: '', dose: '', route: 'ORAL' });
      setDrugOpen(false);
      await loadWards();
      setSelectedBed(null);
    } catch (err: any) {
      alert(err.message || 'Failed to record medication administration');
    }
  };

  const handleDischarge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAdmission) return;
    try {
      await inpatientApi.discharge(activeAdmission.id, dischargeNotes || 'Discharged clinically stable with discharge medications prescribed.');
      setDischargeNotes('');
      setDischargeOpen(false);
      setSelectedBed(null);
      await loadWards();
      alert('Patient discharged successfully. Bed released to AVAILABLE.');
    } catch (err: any) {
      alert(err.message || 'Failed to discharge patient');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Inpatient & Ward Management</h1>
            <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
              Bed Occupancy
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Real-time ward capacity, admission records, nursing notes, and medication administration charts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadWards} disabled={loading} className="gap-1.5 text-xs">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Global Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Total Hospital Beds</p>
              <h3 className="text-2xl font-bold text-foreground mt-1">{totalBeds}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">{wards.length} Active wards</p>
            </div>
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <BedDouble className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Occupied Beds</p>
              <h3 className="text-2xl font-bold text-red-600 mt-1">{occupiedBeds.length}</h3>
              <p className="text-[11px] text-red-600 mt-0.5">Admitted inpatients</p>
            </div>
            <div className="p-2.5 rounded-xl bg-red-500/10 text-red-600">
              <Users className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Available Beds</p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-1">{availableBeds.length}</h3>
              <p className="text-[11px] text-emerald-600 mt-0.5">Ready for admission</p>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600">
              <CheckCircle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Reserved Beds</p>
              <h3 className="text-2xl font-bold text-amber-600 mt-1">{reservedBeds.length}</h3>
              <p className="text-[11px] text-amber-600 mt-0.5">Incoming clinical transfers</p>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ward Selection & Bed Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {/* Ward Tabs */}
          <div className="flex gap-2 flex-wrap">
            {wards.map((w) => {
              const beds = w.rooms?.flatMap((r: any) => r.beds) || [];
              const occ = beds.filter((b: any) => b.status === 'OCCUPIED').length;
              const isSelected = selectedWardId === w.id;
              return (
                <button
                  key={w.id}
                  onClick={() => setSelectedWardId(w.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    isSelected
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                      : 'bg-card border-border hover:border-primary/40'
                  }`}
                >
                  {w.name}
                  <span className={`ml-2 px-1.5 py-0.2 rounded-full text-[10px] ${
                    isSelected ? 'bg-white/20' : 'bg-muted text-muted-foreground'
                  }`}>
                    {occ}/{beds.length}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Current Ward Bed Map */}
          <Card className="border-border">
            <CardHeader className="p-4 border-b border-border flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold">{currentWard?.name || 'Ward'} — Bed Map</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Daily rate: KES {currentWard?.dailyRate?.toLocaleString()} / day
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Occupied</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Available</span>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {allBedsInCurrentWard.map((bed) => {
                  const cfg = statusConfig[bed.status] || statusConfig.AVAILABLE;
                  const patientName = bed.admissions?.[0]?.patient?.fullName;
                  return (
                    <button
                      key={bed.id}
                      onClick={() => setSelectedBed(bed)}
                      className={`p-3 rounded-xl border text-left transition-all hover:scale-105 hover:shadow-sm ${cfg.bgClass}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-foreground">{bed.bedNumber}</span>
                        <div className={`w-2 h-2 rounded-full ${cfg.class}`} />
                      </div>
                      {patientName ? (
                        <div>
                          <p className="text-[11px] font-semibold text-foreground truncate">{patientName}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{bed.admissions?.[0]?.diagnosis || 'Inpatient'}</p>
                        </div>
                      ) : (
                        <p className={`text-[11px] font-medium ${cfg.textClass}`}>{cfg.label}</p>
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Inpatients List Panel */}
        <div className="space-y-4">
          <Card className="border-border">
            <CardHeader className="p-4 border-b border-border">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                Active Inpatients ({occupiedBeds.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 max-h-[480px] overflow-y-auto divide-y divide-border">
              {occupiedBeds.map((bed) => {
                const adm = bed.admissions?.[0];
                return (
                  <div
                    key={bed.id}
                    onClick={() => setSelectedBed(bed)}
                    className="p-3.5 hover:bg-muted/30 transition-colors cursor-pointer flex items-start justify-between gap-3"
                  >
                    <div>
                      <p className="text-xs font-bold text-foreground">{adm?.patient?.fullName}</p>
                      <p className="text-[11px] text-muted-foreground font-mono">{adm?.patient?.mrn} • {bed.bedNumber}</p>
                      <p className="text-[11px] text-primary font-medium mt-1 line-clamp-1">{adm?.diagnosis}</p>
                    </div>
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-[10px]">
                      Admitted
                    </Badge>
                  </div>
                );
              })}
              {occupiedBeds.length === 0 && (
                <div className="p-8 text-center text-muted-foreground text-xs">
                  No inpatients currently admitted.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bed Detail / Patient Clinical Chart Modal */}
      {selectedBed && (
        <Dialog open={!!selectedBed} onOpenChange={() => setSelectedBed(null)}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <BedDouble className="w-5 h-5 text-primary" />
                Bed {selectedBed.bedNumber} Details ({selectedBed.room?.ward?.name})
              </DialogTitle>
            </DialogHeader>

            {activeAdmission ? (
              <div className="space-y-4 text-xs">
                {/* Patient Summary Card */}
                <div className="p-3.5 bg-primary/5 rounded-xl border border-primary/20 flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-foreground">{activeAdmission.patient?.fullName}</h3>
                    <p className="text-muted-foreground font-mono mt-0.5">
                      MRN: {activeAdmission.patient?.mrn} • Scheme: {activeAdmission.patient?.primaryScheme}
                    </p>
                    <p className="text-foreground font-medium mt-1">
                      Diagnosis: {activeAdmission.diagnosis}
                    </p>
                  </div>
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-[10px]">
                    Occupied
                  </Badge>
                </div>

                {/* Nursing Care & MAR Tabs */}
                <Tabs defaultValue="notes" className="w-full">
                  <TabsList className="bg-muted/50 p-1">
                    <TabsTrigger value="notes" className="text-xs">Nursing Notes</TabsTrigger>
                    <TabsTrigger value="drugs" className="text-xs">Medication Chart (MAR)</TabsTrigger>
                  </TabsList>

                  <TabsContent value="notes" className="space-y-3 pt-2">
                    <div className="max-h-40 overflow-y-auto space-y-2">
                      {activeAdmission.nursingNotes?.map((n: any) => (
                        <div key={n.id} className="p-2.5 rounded-lg bg-muted/40 border border-border">
                          <p className="text-foreground font-medium">{n.note}</p>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            Recorded by {n.nurseName} • {new Date(n.recordedAt).toLocaleString()}
                          </p>
                        </div>
                      ))}
                      {(!activeAdmission.nursingNotes || activeAdmission.nursingNotes.length === 0) && (
                        <p className="text-muted-foreground italic py-2">No nursing notes entered yet.</p>
                      )}
                    </div>
                    <Button size="sm" variant="outline" onClick={() => setNoteOpen(true)} className="gap-1 text-xs">
                      <Plus className="w-3.5 h-3.5" /> Add Nursing Observation
                    </Button>
                  </TabsContent>

                  <TabsContent value="drugs" className="space-y-3 pt-2">
                    <div className="max-h-40 overflow-y-auto space-y-2">
                      {activeAdmission.drugCharts?.map((d: any) => (
                        <div key={d.id} className="p-2.5 rounded-lg bg-muted/40 border border-border flex items-center justify-between">
                          <div>
                            <p className="font-bold text-foreground">{d.drugName} ({d.dose})</p>
                            <p className="text-[10px] text-muted-foreground">Route: {d.route} • Nurse: {d.nurseName}</p>
                          </div>
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                            {d.status}
                          </Badge>
                        </div>
                      ))}
                      {(!activeAdmission.drugCharts || activeAdmission.drugCharts.length === 0) && (
                        <p className="text-muted-foreground italic py-2">No medications logged in chart.</p>
                      )}
                    </div>
                    <Button size="sm" variant="outline" onClick={() => setDrugOpen(true)} className="gap-1 text-xs">
                      <Plus className="w-3.5 h-3.5" /> Administer Medication
                    </Button>
                  </TabsContent>
                </Tabs>

                <div className="pt-2 border-t border-border flex items-center justify-between">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setDischargeOpen(true)}
                    className="gap-1.5 text-xs"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Discharge Inpatient
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setSelectedBed(null)}>
                    Close
                  </Button>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center space-y-2">
                <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto" />
                <h4 className="font-bold text-sm text-foreground">Bed is Available</h4>
                <p className="text-xs text-muted-foreground">
                  Ready for new admission from Outpatient Consultation or Emergency.
                </p>
                <div className="pt-4">
                  <Button variant="outline" size="sm" onClick={() => setSelectedBed(null)}>
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* Add Nursing Note Modal */}
      <Dialog open={noteOpen} onOpenChange={setNoteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Record Nursing Note</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddNote} className="space-y-3 text-xs">
            <div>
              <Label className="text-xs">Clinical Observations & Vitals</Label>
              <textarea
                rows={3}
                placeholder="Patient vitals, pain score, responsiveness, fluids running..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                required
                className="w-full rounded-md border border-input bg-background p-2 text-xs shadow-sm mt-1"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setNoteOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm">
                Save Note
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Administer Medication Modal */}
      <Dialog open={drugOpen} onOpenChange={setDrugOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Medication Administration (MAR)</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRecordDrug} className="space-y-3 text-xs">
            <div>
              <Label className="text-xs">Medication Name</Label>
              <Input
                placeholder="e.g. Ceftriaxone 1g IV"
                value={drugForm.drugName}
                onChange={(e) => setDrugForm({ ...drugForm, drugName: e.target.value })}
                required
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Dose</Label>
                <Input
                  placeholder="e.g. 1g stat"
                  value={drugForm.dose}
                  onChange={(e) => setDrugForm({ ...drugForm, dose: e.target.value })}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Route</Label>
                <select
                  value={drugForm.route}
                  onChange={(e) => setDrugForm({ ...drugForm, route: e.target.value })}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm mt-1"
                >
                  <option value="ORAL">Oral</option>
                  <option value="IV">Intravenous (IV)</option>
                  <option value="IM">Intramuscular (IM)</option>
                  <option value="SC">Subcutaneous (SC)</option>
                  <option value="INHALATION">Inhalation</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setDrugOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm">
                Log Administration
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Discharge Dialog */}
      <Dialog open={dischargeOpen} onOpenChange={setDischargeOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-destructive flex items-center gap-2">
              <LogOut className="w-4 h-4" /> Finalize Inpatient Discharge
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleDischarge} className="space-y-3 text-xs">
            <p className="text-muted-foreground">
              Discharging this patient will calculate bed occupancy days, post ward charges to the invoice, and free this bed to AVAILABLE status.
            </p>
            <div>
              <Label className="text-xs">Discharge Summary & Medical Advice</Label>
              <textarea
                rows={3}
                placeholder="Patient clinically recovered. Discharge prescriptions issued. Review in 14 days..."
                value={dischargeNotes}
                onChange={(e) => setDischargeNotes(e.target.value)}
                required
                className="w-full rounded-md border border-input bg-background p-2 text-xs shadow-sm mt-1"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setDischargeOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="destructive" size="sm">
                Release Bed & Discharge
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
