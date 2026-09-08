import { useState, useEffect } from "react";
import { patientApi } from "../lib/api";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Label } from "./ui/label";
import {
  Users, Search, Plus, UserCheck, Clock, CheckCircle,
  Phone, Calendar, Shield, Eye, ChevronLeft, ChevronRight,
  AlertCircle, Stethoscope, Pill, CreditCard, Activity, CheckCircle2
} from "lucide-react";

interface PatientRecord {
  id: string;
  mrn: string;
  fullName: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  nationalId?: string | null;
  primaryScheme: string;
  schemePolicyNumber?: string | null;
  residence: string;
  occupation?: string | null;
  nextOfKinName: string;
  nextOfKinRelation: string;
  nextOfKinPhone: string;
  createdAt: string;
  encounters?: any[];
}

export function HospitalPatients() {
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [schemeFilter, setSchemeFilter] = useState("all");
  const [registerOpen, setRegisterOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Registration Form State
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("1995-06-15");
  const [gender, setGender] = useState<"MALE" | "FEMALE" | "OTHER">("FEMALE");
  const [phone, setPhone] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [occupation, setOccupation] = useState("");
  const [residence, setResidence] = useState("");
  const [nextOfKinName, setNextOfKinName] = useState("");
  const [nextOfKinRelation, setNextOfKinRelation] = useState("Spouse");
  const [nextOfKinPhone, setNextOfKinPhone] = useState("");
  const [primaryScheme, setPrimaryScheme] = useState<"CASH" | "SHA" | "INSURANCE">("SHA");
  const [schemeNumber, setSchemeNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [registeredSuccess, setRegisteredSuccess] = useState<any | null>(null);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const res = await patientApi.search(search);
      setPatients(res.data || []);
    } catch (err) {
      console.error("Failed to fetch patients:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchPatients();
    }, 250);
    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError(null);
    setSubmitting(true);

    try {
      const res = await patientApi.register({
        fullName,
        dateOfBirth: new Date(dob).toISOString(),
        gender,
        phone,
        nationalId: nationalId || null,
        occupation: occupation || null,
        residence,
        nextOfKinName,
        nextOfKinRelation,
        nextOfKinPhone,
        primaryScheme,
        schemePolicyNumber: schemeNumber || null,
        initialDepartment: "TRIAGE",
      });

      setRegisteredSuccess(res);
      fetchPatients();
    } catch (err: any) {
      setRegisterError(err.message || "Failed to register patient");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenProfile = async (id: string) => {
    try {
      setProfileLoading(true);
      const fullRecord = await patientApi.getById(id);
      setSelectedPatient(fullRecord);
    } catch (err) {
      console.error("Failed to fetch patient profile:", err);
    } finally {
      setProfileLoading(false);
    }
  };

  const resetForm = () => {
    setFullName("");
    setPhone("");
    setNationalId("");
    setOccupation("");
    setResidence("");
    setNextOfKinName("");
    setNextOfKinPhone("");
    setSchemeNumber("");
    setRegisterError(null);
    setRegisteredSuccess(null);
  };

  const filteredPatients = patients.filter((p) => {
    if (schemeFilter === "all") return true;
    return p.primaryScheme === schemeFilter;
  });

  return (
    <div className="min-h-screen bg-muted/20 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Patient Master Registry</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Front office enrollment, national ID search, scheme eligibility, and clinical encounter dispatch
          </p>
        </div>
        <Button
          className="gap-2 shadow-xs"
          onClick={() => {
            resetForm();
            setRegisterOpen(true);
          }}
        >
          <Plus className="w-4 h-4" />
          Register New Patient
        </Button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Registered", value: patients.length, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "SHA Covered", value: patients.filter((p) => p.primaryScheme === "SHA").length, icon: Shield, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Cash Paying", value: patients.filter((p) => p.primaryScheme === "CASH").length, icon: CreditCard, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Encounters Today", value: patients.filter((p) => (p.encounters?.length || 0) > 0).length, icon: Activity, color: "text-primary", bg: "bg-primary/5" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="border border-border/50">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3 bg-card p-4 rounded-xl border border-border/50">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by MRN, Full Name, National ID, or Phone..."
            className="pl-9 text-xs"
          />
        </div>
        <Select value={schemeFilter} onValueChange={setSchemeFilter}>
          <SelectTrigger className="w-40 text-xs">
            <SelectValue placeholder="Scheme" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Payment Schemes</SelectItem>
            <SelectItem value="SHA">SHA Only</SelectItem>
            <SelectItem value="CASH">Cash Only</SelectItem>
            <SelectItem value="INSURANCE">Private Insurance</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Patients Table */}
      <Card className="border border-border/60">
        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 text-center text-sm text-muted-foreground">Searching patient database...</div>
          ) : filteredPatients.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              No registered patients match your search criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/50 text-muted-foreground border-b border-border/60">
                  <tr>
                    <th className="p-3">MRN</th>
                    <th className="p-3">Patient Name</th>
                    <th className="p-3">Gender / Age</th>
                    <th className="p-3">National ID</th>
                    <th className="p-3">Phone</th>
                    <th className="p-3">Scheme</th>
                    <th className="p-3">Current Encounter Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filteredPatients.map((patient) => {
                    const latestEnc = patient.encounters?.[0];
                    const encStatus = latestEnc?.status || "REGISTERED";
                    const age = Math.floor(
                      (new Date().getTime() - new Date(patient.dateOfBirth).getTime()) / (365.25 * 24 * 3600 * 1000)
                    );

                    return (
                      <tr key={patient.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3 font-mono font-bold text-foreground">{patient.mrn}</td>
                        <td className="p-3">
                          <div className="font-semibold text-foreground text-sm">{patient.fullName}</div>
                          <div className="text-[10px] text-muted-foreground">{patient.residence}</div>
                        </td>
                        <td className="p-3 text-foreground">
                          {patient.gender} • {age} yrs
                        </td>
                        <td className="p-3 font-mono text-muted-foreground">{patient.nationalId || "—"}</td>
                        <td className="p-3 text-foreground">{patient.phone}</td>
                        <td className="p-3">
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-semibold ${
                              patient.primaryScheme === "SHA"
                                ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30"
                                : "bg-muted text-foreground"
                            }`}
                          >
                            <Shield className="w-2.5 h-2.5 mr-1" />
                            {patient.primaryScheme}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20">
                            {encStatus.replace("_", " ")}
                          </Badge>
                        </td>
                        <td className="p-3 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs gap-1"
                            onClick={() => handleOpenProfile(patient.id)}
                          >
                            <Eye className="w-3 h-3" />
                            Clinical Chart
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

      {/* Register Patient Dialog */}
      <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              Patient Registration & Triage Intake
            </DialogTitle>
          </DialogHeader>

          {registeredSuccess ? (
            <div className="py-6 space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Patient Successfully Registered</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Encounter initiated and queued to Outpatient Triage.
                </p>
              </div>

              <div className="p-4 bg-muted/40 rounded-xl border border-border/60 max-w-md mx-auto text-left space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Generated MRN:</span>
                  <span className="font-mono font-bold text-foreground">{registeredSuccess.patient.mrn}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Encounter Number:</span>
                  <span className="font-mono font-medium text-foreground">{registeredSuccess.encounter.encounterNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Triage Queue Number:</span>
                  <span className="font-bold text-primary">#{registeredSuccess.queue.queueNumber}</span>
                </div>
              </div>

              <DialogFooter>
                <Button className="w-full" onClick={() => setRegisterOpen(false)}>
                  Done
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-4 py-2">
              {registerError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {registerError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Patient Full Name *</Label>
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Mary Wanjiku Kamau"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Date of Birth *</Label>
                  <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} required />
                </div>

                <div className="space-y-1.5">
                  <Label>Gender *</Label>
                  <Select value={gender} onValueChange={(val: any) => setGender(val)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FEMALE">Female</SelectItem>
                      <SelectItem value="MALE">Male</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>National ID Number</Label>
                  <Input
                    value={nationalId}
                    onChange={(e) => setNationalId(e.target.value)}
                    placeholder="e.g. 28934512"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Primary Phone Number *</Label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +254 722 000 111"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Residence / Address *</Label>
                  <Input
                    value={residence}
                    onChange={(e) => setResidence(e.target.value)}
                    placeholder="e.g. Westlands, Nairobi"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Occupation</Label>
                  <Input
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value)}
                    placeholder="e.g. Teacher, Civil Servant"
                  />
                </div>

                {/* Scheme */}
                <div className="space-y-1.5">
                  <Label>Primary Payer Scheme *</Label>
                  <Select value={primaryScheme} onValueChange={(val: any) => setPrimaryScheme(val)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SHA">SHA (Social Health Authority)</SelectItem>
                      <SelectItem value="CASH">Cash Paying</SelectItem>
                      <SelectItem value="INSURANCE">Private Health Insurance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Scheme Policy / Member #</Label>
                  <Input
                    value={schemeNumber}
                    onChange={(e) => setSchemeNumber(e.target.value)}
                    placeholder="e.g. SHA-88239011"
                  />
                </div>

                {/* Next of Kin */}
                <div className="sm:col-span-2 border-t border-border/50 pt-3 mt-1">
                  <p className="text-xs font-bold text-foreground mb-3 uppercase tracking-wider">Next of Kin Details</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label>Full Name *</Label>
                      <Input
                        value={nextOfKinName}
                        onChange={(e) => setNextOfKinName(e.target.value)}
                        placeholder="Next of kin name"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Relationship *</Label>
                      <Input
                        value={nextOfKinRelation}
                        onChange={(e) => setNextOfKinRelation(e.target.value)}
                        placeholder="e.g. Spouse / Brother"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Phone *</Label>
                      <Input
                        value={nextOfKinPhone}
                        onChange={(e) => setNextOfKinPhone(e.target.value)}
                        placeholder="e.g. +254 722 333 444"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="pt-3 border-t border-border/50">
                <Button type="button" variant="outline" size="sm" onClick={() => setRegisterOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={submitting}>
                  {submitting ? "Saving to Database..." : "Complete Registration & Queue to Triage"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Patient Master Clinical Profile Modal */}
      {selectedPatient && (
        <Dialog open={!!selectedPatient} onOpenChange={() => setSelectedPatient(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center justify-between">
                <span>Patient Master Clinical Record</span>
                <span className="font-mono text-xs bg-muted px-2.5 py-1 rounded-md text-foreground font-semibold">
                  {selectedPatient.mrn}
                </span>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              {/* Profile Card Header */}
              <div className="p-4 bg-muted/40 rounded-xl border border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-foreground">{selectedPatient.fullName}</h3>
                  <p className="text-muted-foreground mt-0.5">
                    {selectedPatient.gender} • DOB: {new Date(selectedPatient.dateOfBirth).toLocaleDateString()} • Phone: {selectedPatient.phone}
                  </p>
                  <p className="text-muted-foreground mt-0.5">Residence: {selectedPatient.residence}</p>
                </div>
                <div>
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20 text-xs px-2.5 py-1">
                    <Shield className="w-3 h-3 mr-1" />
                    Cover: {selectedPatient.primaryScheme}
                  </Badge>
                </div>
              </div>

              {/* Encounters History */}
              <div className="space-y-3">
                <h4 className="font-bold text-foreground text-sm flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  Clinical Encounters History ({selectedPatient.encounters?.length || 0})
                </h4>

                {(!selectedPatient.encounters || selectedPatient.encounters.length === 0) ? (
                  <div className="p-6 text-center text-muted-foreground border rounded-lg">No clinical visits recorded yet.</div>
                ) : (
                  selectedPatient.encounters.map((enc: any) => (
                    <div key={enc.id} className="border border-border/60 rounded-xl p-4 space-y-3 bg-card">
                      <div className="flex items-center justify-between border-b border-border/40 pb-2">
                        <div>
                          <span className="font-mono font-bold text-foreground">{enc.encounterNumber}</span>
                          <span className="text-muted-foreground ml-2">Started: {new Date(enc.startedAt).toLocaleString()}</span>
                        </div>
                        <Badge>{enc.status}</Badge>
                      </div>

                      {/* Vitals Summary */}
                      {enc.triage && (
                        <div className="p-2.5 bg-muted/30 rounded-lg text-xs grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <div><span className="text-muted-foreground">BP: </span><span className="font-bold text-foreground">{enc.triage.bloodPressureSys}/{enc.triage.bloodPressureDia} mmHg</span></div>
                          <div><span className="text-muted-foreground">Temp: </span><span className="font-bold text-foreground">{enc.triage.temperature} °C</span></div>
                          <div><span className="text-muted-foreground">Pulse: </span><span className="font-bold text-foreground">{enc.triage.pulseRate} bpm</span></div>
                          <div><span className="text-muted-foreground">BMI: </span><span className="font-bold text-foreground">{enc.triage.bmi}</span></div>
                        </div>
                      )}

                      {/* Consultations */}
                      {enc.consultations?.map((c: any) => (
                        <div key={c.id} className="space-y-1.5 text-xs bg-accent/20 p-3 rounded-lg">
                          <p className="font-semibold text-foreground">Clinician: {c.doctorName || 'Attending Doctor'}</p>
                          <p><span className="text-muted-foreground">Chief Complaint: </span>{c.chiefComplaint}</p>
                          <p><span className="text-muted-foreground">Clinical Notes: </span>{c.history}</p>
                          <div className="flex gap-2 items-center pt-1">
                            <span className="text-muted-foreground">Diagnoses:</span>
                            {c.diagnoses?.map((d: any) => (
                              <Badge key={d.id} variant="outline" className="text-[10px]">
                                {d.icdCode ? `${d.icdCode} - ` : ''}{d.description}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}

                      {/* Lab Orders */}
                      {enc.labOrders?.length > 0 && (
                        <div className="space-y-1 text-xs">
                          <p className="font-semibold text-foreground">Laboratory Tests:</p>
                          {enc.labOrders.map((lo: any) => (
                            <div key={lo.id} className="flex gap-2">
                              {lo.items?.map((item: any) => (
                                <Badge key={item.id} variant="secondary" className="text-[10px]">
                                  {item.test?.name}: {item.resultValue || 'Pending Result'}
                                </Badge>
                              ))}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Invoices */}
                      {enc.invoices?.length > 0 && (
                        <div className="pt-2 border-t border-border/40 flex justify-between items-center text-xs">
                          <span className="text-muted-foreground font-mono">Invoice #{enc.invoices[0].invoiceNumber}</span>
                          <div>
                            <span className="text-muted-foreground">Total: </span>
                            <span className="font-bold text-foreground">KES {enc.invoices[0].netAmount?.toLocaleString()}</span>
                            <span className="text-muted-foreground ml-3">Paid: </span>
                            <span className="font-bold text-emerald-600">KES {enc.invoices[0].paidAmount?.toLocaleString()}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setSelectedPatient(null)}>
                Close Chart
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
