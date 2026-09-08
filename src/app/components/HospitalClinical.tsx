import { useState, useEffect } from 'react';
import { queueApi, triageApi, clinicalApi, labApi, pharmacyApi } from '../lib/api';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Users, Activity, Stethoscope, TestTube, Pill, CreditCard,
  Clock, AlertCircle, CheckCircle, ArrowRight, User, Shield,
  RefreshCw, Plus, CheckCircle2
} from 'lucide-react';

interface QueueItem {
  id: string;
  queueNumber: number;
  priority: number;
  status: string; // WAITING, IN_PROGRESS, COMPLETED
  department: string;
  calledAt: string | null;
  startedAt: string | null;
  encounter: {
    id: string;
    encounterNumber: string;
    paymentScheme: string;
    schemeNumber: string | null;
    status: string;
    patient: {
      id: string;
      mrn: string;
      fullName: string;
      gender: string;
      dateOfBirth: string;
      phone: string;
    };
    triage?: {
      temperature: number;
      bloodPressureSys: number;
      bloodPressureDia: number;
      pulseRate: number;
      respiratoryRate: number;
      oxygenSat: number;
      bmi: number;
    } | null;
    consultation?: any;
  };
}

const DEPARTMENTS = [
  { id: 'TRIAGE', label: 'Triage', icon: Activity, color: 'text-amber-600', next: 'CONSULTATION' },
  { id: 'CONSULTATION', label: 'Consultation', icon: Stethoscope, color: 'text-primary', next: 'LABORATORY' },
  { id: 'LABORATORY', label: 'Laboratory', icon: TestTube, color: 'text-purple-600', next: 'CONSULTATION' },
  { id: 'PHARMACY', label: 'Pharmacy', icon: Pill, color: 'text-teal-600', next: 'BILLING' },
  { id: 'BILLING', label: 'Billing', icon: CreditCard, color: 'text-rose-600', next: 'COMPLETED' },
];

export function HospitalClinical() {
  const [activeDept, setActiveDept] = useState<string>('TRIAGE');
  const [queues, setQueues] = useState<Record<string, QueueItem[]>>({
    TRIAGE: [],
    CONSULTATION: [],
    LABORATORY: [],
    PHARMACY: [],
    BILLING: [],
  });
  const [loading, setLoading] = useState(false);

  // Modals
  const [selectedQueueItem, setSelectedQueueItem] = useState<QueueItem | null>(null);

  // Triage Form
  const [triageOpen, setTriageOpen] = useState(false);
  const [vitalsForm, setVitalsForm] = useState({
    temperature: 36.8,
    bloodPressureSys: 120,
    bloodPressureDia: 80,
    pulseRate: 75,
    respiratoryRate: 18,
    oxygenSat: 98,
    weightKg: 70,
    heightCm: 172,
    notes: 'Oriented, alert, no acute distress.',
  });

  // Consultation Form
  const [consultOpen, setConsultOpen] = useState(false);
  const [consultForm, setConsultForm] = useState({
    chiefComplaint: '',
    history: '',
    examination: '',
    icdCode: 'B54',
    diagnosisDescription: 'Unspecified Malaria',
    labTestCode: 'LAB-MPS',
    prescribeDrug: 'MED-AL-6X4',
  });

  // Lab Result Modal
  const [labOpen, setLabOpen] = useState(false);
  const [labOrders, setLabOrders] = useState<any[]>([]);
  const [labResultText, setLabResultText] = useState('Positive (++) Plasmodium falciparum ring forms identified');

  // Pharmacy Dispense Modal
  const [rxOpen, setRxOpen] = useState(false);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);

  const loadAllQueues = async () => {
    setLoading(true);
    try {
      const results = await Promise.all(
        DEPARTMENTS.map(async (d) => {
          const q = await queueApi.getDepartmentQueue(d.id);
          return { dept: d.id, items: q };
        })
      );
      const newMap: Record<string, QueueItem[]> = { ...queues };
      for (const r of results) {
        newMap[r.dept] = r.items;
      }
      setQueues(newMap);
    } catch (err) {
      console.error('Failed to load queues:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllQueues();
  }, []);

  const handleCallPatient = async (item: QueueItem) => {
    try {
      await queueApi.call(item.id);
      await loadAllQueues();
    } catch (err: any) {
      alert(err.message || 'Failed to call patient');
    }
  };

  const handleStartPatient = async (item: QueueItem) => {
    try {
      await queueApi.start(item.id);
      await loadAllQueues();
    } catch (err: any) {
      alert(err.message || 'Failed to start consultation');
    }
  };

  const handleRoutePatient = async (item: QueueItem, nextDept: string) => {
    try {
      await queueApi.route(item.id, nextDept, 1, `${nextDept}_WAITING`);
      await loadAllQueues();
    } catch (err: any) {
      alert(err.message || 'Failed to route patient');
    }
  };

  // Triage Submit
  const handleSaveVitals = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQueueItem) return;

    const heightM = vitalsForm.heightCm / 100;
    const bmi = parseFloat((vitalsForm.weightKg / (heightM * heightM)).toFixed(1));

    try {
      await triageApi.recordVitals({
        encounterId: selectedQueueItem.encounter.id,
        queueId: selectedQueueItem.id,
        temperature: vitalsForm.temperature,
        bloodPressureSys: vitalsForm.bloodPressureSys,
        bloodPressureDia: vitalsForm.bloodPressureDia,
        pulseRate: vitalsForm.pulseRate,
        respiratoryRate: vitalsForm.respiratoryRate,
        oxygenSat: vitalsForm.oxygenSat,
        weightKg: vitalsForm.weightKg,
        heightCm: vitalsForm.heightCm,
        bmi,
        notes: vitalsForm.notes,
        routeToDepartment: 'CONSULTATION',
      });

      setTriageOpen(false);
      setSelectedQueueItem(null);
      await loadAllQueues();
      alert('Vitals saved! Patient routed to Doctor Consultation.');
    } catch (err: any) {
      alert(err.message || 'Failed to record vitals');
    }
  };

  // Consultation Submit
  const handleSaveConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQueueItem) return;

    try {
      await clinicalApi.recordConsultation({
        encounterId: selectedQueueItem.encounter.id,
        queueId: selectedQueueItem.id,
        chiefComplaint: consultForm.chiefComplaint || 'Acute febrile illness, joint pains',
        history: consultForm.history || 'Symptoms progressive over 3 days.',
        examination: consultForm.examination || 'Mild pallor, vital signs recorded, chest clear.',
        diagnoses: [
          {
            icdCode: consultForm.icdCode,
            description: consultForm.diagnosisDescription,
            isPrimary: true,
          },
        ],
        labTests: consultForm.labTestCode ? [{ testCode: consultForm.labTestCode }] : [],
        prescriptions: consultForm.prescribeDrug ? [{ drugCode: consultForm.prescribeDrug, quantity: 24 }] : [],
        routeTo: consultForm.labTestCode ? 'LABORATORY' : 'PHARMACY',
      });

      setConsultOpen(false);
      setSelectedQueueItem(null);
      await loadAllQueues();
      alert(`Consultation recorded! Patient routed to ${consultForm.labTestCode ? 'Laboratory' : 'Pharmacy'}.`);
    } catch (err: any) {
      alert(err.message || 'Failed to record consultation');
    }
  };

  // Open Lab Orders for validation
  const handleOpenLab = async () => {
    try {
      const orders = await labApi.getOrders();
      setLabOrders(orders);
      setLabOpen(true);
    } catch (err: any) {
      alert('Failed to load lab orders');
    }
  };

  const handleValidateLab = async (orderId: string, itemId: string) => {
    try {
      await labApi.recordResults(orderId, [
        {
          itemId,
          resultValue: labResultText,
          isAbnormal: true,
        },
      ]);
      const updated = await labApi.getOrders();
      setLabOrders(updated);
      await loadAllQueues();
      alert('Lab result validated and recorded in patient chart.');
    } catch (err: any) {
      alert(err.message || 'Failed to validate lab results');
    }
  };

  // Open Pharmacy Prescriptions
  const handleOpenRx = async () => {
    try {
      const rxs = await pharmacyApi.getPrescriptions();
      setPrescriptions(rxs);
      setRxOpen(true);
    } catch (err: any) {
      alert('Failed to load prescriptions');
    }
  };

  const handleDispenseRx = async (rx: any) => {
    try {
      const itemsToDispense = rx.items.map((i: any) => ({
        itemId: i.id,
        drugId: i.drugId,
        quantity: i.quantity,
      }));
      await pharmacyApi.dispense(rx.id, itemsToDispense);
      const updated = await pharmacyApi.getPrescriptions();
      setPrescriptions(updated);
      await loadAllQueues();
      alert('Medication dispensed! Stock levels deducted in database.');
    } catch (err: any) {
      alert(err.message || 'Failed to dispense medication');
    }
  };

  const activeQueue = queues[activeDept] || [];
  const waitingCount = activeQueue.filter((q) => q.status === 'WAITING').length;
  const inProgressCount = activeQueue.filter((q) => q.status === 'IN_PROGRESS').length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Clinical Workstation</h1>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              Live Encounters
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Real-time patient queue routing across Triage, Doctor Consultations, Diagnostic Laboratory, and Pharmacy.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadAllQueues} disabled={loading} className="gap-1.5 text-xs">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Sync Queues
          </Button>
          <Button variant="outline" size="sm" onClick={handleOpenLab} className="gap-1 text-xs">
            <TestTube className="w-3.5 h-3.5 text-purple-600" /> Lab Results
          </Button>
          <Button variant="outline" size="sm" onClick={handleOpenRx} className="gap-1 text-xs">
            <Pill className="w-3.5 h-3.5 text-teal-600" /> Dispensary Rx
          </Button>
        </div>
      </div>

      {/* Department Tabs */}
      <div className="flex flex-wrap gap-2">
        {DEPARTMENTS.map((dept) => {
          const Icon = dept.icon;
          const isSelected = activeDept === dept.id;
          const qItems = queues[dept.id] || [];
          return (
            <button
              key={dept.id}
              onClick={() => setActiveDept(dept.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                isSelected
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : 'bg-card border-border hover:border-primary/40'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{dept.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                isSelected ? 'bg-white/20' : 'bg-muted text-muted-foreground'
              }`}>
                {qItems.length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Queue Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-border">
            <CardHeader className="p-4 border-b border-border flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold">{activeDept} Waiting List</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {waitingCount} waiting • {inProgressCount} currently in station
                </p>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {activeQueue.map((item) => {
                const patient = item.encounter?.patient;
                const isCurrent = item.status === 'IN_PROGRESS';
                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                      isCurrent
                        ? 'border-primary bg-primary/5 shadow-xs'
                        : 'border-border bg-card hover:border-border/80'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary font-bold text-sm flex items-center justify-center flex-shrink-0">
                        #{item.queueNumber}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-sm text-foreground">{patient?.fullName}</h4>
                          <Badge variant="outline" className="text-[10px] font-mono">
                            {patient?.mrn}
                          </Badge>
                          <Badge
                            variant="secondary"
                            className={`text-[10px] ${
                              item.encounter?.paymentScheme === 'SHA'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {item.encounter?.paymentScheme}
                          </Badge>
                          {isCurrent && (
                            <Badge className="bg-primary text-primary-foreground text-[10px]">
                              Active Now
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Gender: {patient?.gender} • Phone: {patient?.phone}
                        </p>
                        {item.encounter?.triage && (
                          <p className="text-[11px] text-emerald-700 font-medium mt-1">
                            Vitals: Temp {item.encounter.triage.temperature}°C • BP {item.encounter.triage.bloodPressureSys}/{item.encounter.triage.bloodPressureDia} • SpO2 {item.encounter.triage.oxygenSat}%
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      {item.status === 'WAITING' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCallPatient(item)}
                          className="h-8 text-xs gap-1"
                        >
                          Call
                        </Button>
                      )}

                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedQueueItem(item);
                          if (activeDept === 'TRIAGE') setTriageOpen(true);
                          else if (activeDept === 'CONSULTATION') setConsultOpen(true);
                          else handleStartPatient(item);
                        }}
                        className="h-8 text-xs gap-1.5"
                      >
                        {activeDept === 'TRIAGE' ? 'Record Vitals' :
                         activeDept === 'CONSULTATION' ? 'Consult Patient' : 'Attend'}
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const next = DEPARTMENTS.find((d) => d.id === activeDept)?.next || 'BILLING';
                          handleRoutePatient(item, next);
                        }}
                        className="h-8 text-xs text-muted-foreground"
                      >
                        Forward
                      </Button>
                    </div>
                  </div>
                );
              })}

              {activeQueue.length === 0 && (
                <div className="py-12 text-center text-muted-foreground space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-muted mx-auto" />
                  <p className="text-sm font-semibold">No Patients in {activeDept} Queue</p>
                  <p className="text-xs">All registered patients have been cleared or routed forward.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Workflow Routing Map Card */}
        <div className="space-y-4">
          <Card className="border-border">
            <CardHeader className="p-4 border-b border-border">
              <CardTitle className="text-sm font-semibold">Standard Patient Journey</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-blue-50/50 border border-blue-100 flex items-center justify-between">
                <div>
                  <p className="font-bold text-blue-900">1. Reception Registration</p>
                  <p className="text-blue-700">Patient enrollment & MRN generation</p>
                </div>
                <ArrowRight className="w-4 h-4 text-blue-500" />
              </div>

              <div className="p-3 rounded-lg bg-amber-50/50 border border-amber-100 flex items-center justify-between">
                <div>
                  <p className="font-bold text-amber-900">2. Nursing Triage</p>
                  <p className="text-amber-700">Vitals, BMI & priority assessment</p>
                </div>
                <ArrowRight className="w-4 h-4 text-amber-500" />
              </div>

              <div className="p-3 rounded-lg bg-emerald-50/50 border border-emerald-100 flex items-center justify-between">
                <div>
                  <p className="font-bold text-emerald-900">3. Clinician Consultation</p>
                  <p className="text-emerald-700">Diagnosis, Lab & Pharmacy orders</p>
                </div>
                <ArrowRight className="w-4 h-4 text-emerald-500" />
              </div>

              <div className="p-3 rounded-lg bg-purple-50/50 border border-purple-100 flex items-center justify-between">
                <div>
                  <p className="font-bold text-purple-900">4. Diagnostic Laboratory</p>
                  <p className="text-purple-700">Specimen testing & result validation</p>
                </div>
                <ArrowRight className="w-4 h-4 text-purple-500" />
              </div>

              <div className="p-3 rounded-lg bg-teal-50/50 border border-teal-100 flex items-center justify-between">
                <div>
                  <p className="font-bold text-teal-900">5. Pharmacy Dispensary</p>
                  <p className="text-teal-700">Prescription review & dispensing</p>
                </div>
                <ArrowRight className="w-4 h-4 text-teal-500" />
              </div>

              <div className="p-3 rounded-lg bg-rose-50/50 border border-rose-100 flex items-center justify-between">
                <div>
                  <p className="font-bold text-rose-900">6. Cashier & Billing</p>
                  <p className="text-rose-700">M-Pesa, Cash, or SHA clearance</p>
                </div>
                <CheckCircle className="w-4 h-4 text-rose-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Triage Vitals Modal */}
      <Dialog open={triageOpen} onOpenChange={setTriageOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-600" /> Record Patient Vitals — Outpatient Triage
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveVitals} className="space-y-3 text-xs">
            <div className="p-2.5 rounded-lg bg-muted/40 border border-border">
              <p className="font-bold text-foreground">{selectedQueueItem?.encounter?.patient?.fullName}</p>
              <p className="text-muted-foreground font-mono">MRN: {selectedQueueItem?.encounter?.patient?.mrn}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Temperature (°C)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={vitalsForm.temperature}
                  onChange={(e) => setVitalsForm({ ...vitalsForm, temperature: parseFloat(e.target.value) || 37 })}
                  required
                  className="mt-1 font-mono"
                />
              </div>
              <div>
                <Label className="text-xs">Oxygen Saturation (%)</Label>
                <Input
                  type="number"
                  value={vitalsForm.oxygenSat}
                  onChange={(e) => setVitalsForm({ ...vitalsForm, oxygenSat: parseInt(e.target.value, 10) || 98 })}
                  required
                  className="mt-1 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Systolic BP (mmHg)</Label>
                <Input
                  type="number"
                  value={vitalsForm.bloodPressureSys}
                  onChange={(e) => setVitalsForm({ ...vitalsForm, bloodPressureSys: parseInt(e.target.value, 10) || 120 })}
                  required
                  className="mt-1 font-mono"
                />
              </div>
              <div>
                <Label className="text-xs">Diastolic BP (mmHg)</Label>
                <Input
                  type="number"
                  value={vitalsForm.bloodPressureDia}
                  onChange={(e) => setVitalsForm({ ...vitalsForm, bloodPressureDia: parseInt(e.target.value, 10) || 80 })}
                  required
                  className="mt-1 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Pulse Rate (bpm)</Label>
                <Input
                  type="number"
                  value={vitalsForm.pulseRate}
                  onChange={(e) => setVitalsForm({ ...vitalsForm, pulseRate: parseInt(e.target.value, 10) || 75 })}
                  required
                  className="mt-1 font-mono"
                />
              </div>
              <div>
                <Label className="text-xs">Respiratory Rate (/min)</Label>
                <Input
                  type="number"
                  value={vitalsForm.respiratoryRate}
                  onChange={(e) => setVitalsForm({ ...vitalsForm, respiratoryRate: parseInt(e.target.value, 10) || 18 })}
                  required
                  className="mt-1 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Weight (kg)</Label>
                <Input
                  type="number"
                  value={vitalsForm.weightKg}
                  onChange={(e) => setVitalsForm({ ...vitalsForm, weightKg: parseFloat(e.target.value) || 70 })}
                  required
                  className="mt-1 font-mono"
                />
              </div>
              <div>
                <Label className="text-xs">Height (cm)</Label>
                <Input
                  type="number"
                  value={vitalsForm.heightCm}
                  onChange={(e) => setVitalsForm({ ...vitalsForm, heightCm: parseFloat(e.target.value) || 170 })}
                  required
                  className="mt-1 font-mono"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">Nursing Assessment / Triage Notes</Label>
              <Input
                value={vitalsForm.notes}
                onChange={(e) => setVitalsForm({ ...vitalsForm, notes: e.target.value })}
                className="mt-1"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setTriageOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm">
                Commit Vitals & Route to Doctor
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Doctor Consultation Modal */}
      <Dialog open={consultOpen} onOpenChange={setConsultOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-primary" /> Doctor Consultation & Clinical Orders
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveConsultation} className="space-y-3 text-xs">
            <div className="p-2.5 rounded-lg bg-muted/40 border border-border">
              <p className="font-bold text-foreground">{selectedQueueItem?.encounter?.patient?.fullName}</p>
              <p className="text-muted-foreground font-mono">
                MRN: {selectedQueueItem?.encounter?.patient?.mrn} • Scheme: {selectedQueueItem?.encounter?.paymentScheme}
              </p>
            </div>

            <div>
              <Label className="text-xs">Chief Complaint</Label>
              <Input
                placeholder="e.g. High intermittent fever, chills, and headache for 4 days"
                value={consultForm.chiefComplaint}
                onChange={(e) => setConsultForm({ ...consultForm, chiefComplaint: e.target.value })}
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-xs">History of Presenting Illness & Exam Findings</Label>
              <Input
                placeholder="e.g. Tenderness in epigastrium, chest clear, no dehydration..."
                value={consultForm.history}
                onChange={(e) => setConsultForm({ ...consultForm, history: e.target.value })}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">ICD-10 Code</Label>
                <Input
                  value={consultForm.icdCode}
                  onChange={(e) => setConsultForm({ ...consultForm, icdCode: e.target.value })}
                  required
                  className="mt-1 font-mono"
                />
              </div>
              <div>
                <Label className="text-xs">Primary Diagnosis</Label>
                <Input
                  value={consultForm.diagnosisDescription}
                  onChange={(e) => setConsultForm({ ...consultForm, diagnosisDescription: e.target.value })}
                  required
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Diagnostic Lab Order</Label>
                <select
                  value={consultForm.labTestCode}
                  onChange={(e) => setConsultForm({ ...consultForm, labTestCode: e.target.value })}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm mt-1"
                >
                  <option value="">No Lab Order</option>
                  <option value="LAB-MPS">Malaria Blood Slide (BS for MPS)</option>
                  <option value="LAB-CBC">Complete Blood Count (CBC)</option>
                  <option value="LAB-UA">Urinalysis Dipstick</option>
                  <option value="LAB-FBS">Fasting Blood Sugar</option>
                  <option value="LAB-LFT">Liver Function Panel</option>
                </select>
              </div>
              <div>
                <Label className="text-xs">Prescription Medication</Label>
                <select
                  value={consultForm.prescribeDrug}
                  onChange={(e) => setConsultForm({ ...consultForm, prescribeDrug: e.target.value })}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm mt-1"
                >
                  <option value="">No Medication</option>
                  <option value="MED-AL-6X4">Artemether-Lumefantrine 20/120mg (AL)</option>
                  <option value="MED-PARA-500">Paracetamol 500mg Tablets</option>
                  <option value="MED-AMOX-500">Amoxicillin 500mg Capsules</option>
                  <option value="MED-OMEP-20">Omeprazole 20mg Capsules</option>
                </select>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setConsultOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm">
                Commit Clinical Orders & Route
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Lab Orders Management Modal */}
      <Dialog open={labOpen} onOpenChange={setLabOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <TestTube className="w-4 h-4 text-purple-600" /> Laboratory Orders & Validation
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1 text-xs">
            <div>
              <Label className="text-xs font-semibold">Test Result Observation</Label>
              <Input
                value={labResultText}
                onChange={(e) => setLabResultText(e.target.value)}
                className="mt-1 text-xs"
              />
            </div>

            <div className="divide-y divide-border border border-border rounded-xl">
              {labOrders.map((order) => (
                <div key={order.id} className="p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-foreground">{order.orderNumber}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {order.status}
                    </Badge>
                  </div>
                  {order.items?.map((item: any) => (
                    <div key={item.id} className="p-2 rounded bg-muted/40 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">{item.testName}</p>
                        {item.resultValue ? (
                          <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                            Result: {item.resultValue}
                          </p>
                        ) : (
                          <p className="text-[11px] text-amber-600 italic mt-0.5">Pending validation</p>
                        )}
                      </div>
                      {item.status !== 'COMPLETED' && (
                        <Button
                          size="sm"
                          onClick={() => handleValidateLab(order.id, item.id)}
                          className="h-7 px-2 text-[11px]"
                        >
                          Verify & Validate
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ))}
              {labOrders.length === 0 && (
                <div className="p-6 text-center text-muted-foreground">
                  No laboratory orders found.
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setLabOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pharmacy Dispensary Modal */}
      <Dialog open={rxOpen} onOpenChange={setRxOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Pill className="w-4 h-4 text-teal-600" /> Pharmacy Dispensary & Prescriptions
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1 text-xs">
            <div className="divide-y divide-border border border-border rounded-xl">
              {prescriptions.map((rx) => (
                <div key={rx.id} className="p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-foreground">{rx.prescriptionNumber}</span>
                    <Badge variant="outline" className={`text-[10px] ${
                      rx.status === 'DISPENSED' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {rx.status}
                    </Badge>
                  </div>
                  {rx.items?.map((item: any) => (
                    <div key={item.id} className="p-2 rounded bg-muted/40 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">{item.drugName}</p>
                        <p className="text-[10px] text-muted-foreground">
                          Qty: {item.quantity} • {item.dosage || 'Standard clinical dose'}
                        </p>
                      </div>
                      <span className="font-mono font-semibold text-foreground">
                        KES {item.totalPrice?.toLocaleString()}
                      </span>
                    </div>
                  ))}
                  {rx.status !== 'DISPENSED' && (
                    <div className="pt-2 flex justify-end">
                      <Button
                        size="sm"
                        onClick={() => handleDispenseRx(rx)}
                        className="h-7 px-3 text-[11px]"
                      >
                        Dispense & Deduct Stock
                      </Button>
                    </div>
                  )}
                </div>
              ))}
              {prescriptions.length === 0 && (
                <div className="p-6 text-center text-muted-foreground">
                  No active prescriptions in queue.
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setRxOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
