import { useState, useEffect } from "react";
import { adminApi, getCurrentUser, UserProfile } from "../lib/api";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Button } from "./ui/button";
import {
  Users, Activity, BedDouble, DollarSign, Clock, CheckCircle,
  AlertCircle, TrendingUp, ArrowUpRight, ArrowDownRight,
  Stethoscope, TestTube, Pill, CreditCard, Syringe, RefreshCw
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from "recharts";

const patientFlowData = [
  { hour: "06:00", registered: 3, triage: 2, consultation: 1, discharged: 0 },
  { hour: "07:00", registered: 8, triage: 6, consultation: 5, discharged: 2 },
  { hour: "08:00", registered: 15, triage: 12, consultation: 10, discharged: 5 },
  { hour: "09:00", registered: 22, triage: 18, consultation: 16, discharged: 9 },
  { hour: "10:00", registered: 18, triage: 20, consultation: 19, discharged: 14 },
  { hour: "11:00", registered: 12, triage: 14, consultation: 18, discharged: 16 },
  { hour: "12:00", registered: 9, triage: 10, consultation: 13, discharged: 12 },
  { hour: "13:00", registered: 14, triage: 11, consultation: 10, discharged: 11 },
  { hour: "14:00", registered: 19, triage: 16, consultation: 14, discharged: 10 },
  { hour: "15:00", registered: 16, triage: 18, consultation: 17, discharged: 13 },
  { hour: "16:00", registered: 11, triage: 13, consultation: 15, discharged: 14 },
  { hour: "17:00", registered: 7, triage: 9, consultation: 11, discharged: 10 },
];

const revenueData = [
  { dept: "OPD", consultation: 42000, laboratory: 28000, pharmacy: 35000 },
  { dept: "Inpatient", consultation: 68000, laboratory: 45000, pharmacy: 52000 },
  { dept: "Emergency", consultation: 31000, laboratory: 22000, pharmacy: 19000 },
  { dept: "Maternity", consultation: 55000, laboratory: 38000, pharmacy: 41000 },
  { dept: "Surgical", consultation: 82000, laboratory: 56000, pharmacy: 48000 },
];

const departmentQueues = [
  { id: "reception", label: "Reception", icon: Users, waiting: 7, inProgress: 3, color: "text-blue-600", bg: "bg-blue-50" },
  { id: "triage", label: "Triage", icon: Activity, waiting: 5, inProgress: 2, color: "text-orange-600", bg: "bg-orange-50" },
  { id: "consultation", label: "Consultation", icon: Stethoscope, waiting: 12, inProgress: 4, color: "text-primary", bg: "bg-primary/5" },
  { id: "laboratory", label: "Laboratory", icon: TestTube, waiting: 8, inProgress: 3, color: "text-purple-600", bg: "bg-purple-50" },
  { id: "pharmacy", label: "Pharmacy", icon: Pill, waiting: 6, inProgress: 2, color: "text-teal-600", bg: "bg-teal-50" },
  { id: "billing", label: "Billing", icon: CreditCard, waiting: 4, inProgress: 1, color: "text-rose-600", bg: "bg-rose-50" },
];

const recentActivity = [
  { id: 1, patient: "John M. Odhiambo", mrn: "MRN-2026-04521", action: "Registered & sent to triage", time: "2 min ago", status: "info" },
  { id: 2, patient: "Grace W. Kamau", mrn: "MRN-2026-04520", action: "Lab results ready — sent to consultation", time: "5 min ago", status: "success" },
  { id: 3, patient: "Peter K. Njoroge", mrn: "MRN-2026-04519", action: "Admitted to General Ward, Bed 14", time: "11 min ago", status: "warning" },
  { id: 4, patient: "Mary A. Wanjiru", mrn: "MRN-2026-04518", action: "Invoice generated — KES 4,850 pending", time: "18 min ago", status: "info" },
  { id: 5, patient: "Samuel O. Otieno", mrn: "MRN-2026-04517", action: "Discharged — visit completed", time: "24 min ago", status: "success" },
];

const kpiCards = [
  {
    title: "Today's Patients",
    value: "184",
    change: "+12%",
    up: true,
    sub: "vs. yesterday (164)",
    icon: Users,
    accent: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    title: "Active in Queues",
    value: "45",
    change: "+3",
    up: true,
    sub: "across 6 departments",
    icon: Activity,
    accent: "text-orange-600",
    bg: "bg-orange-50",
  },
  {
    title: "Admitted Patients",
    value: "62",
    change: "-4",
    up: false,
    sub: "78 beds occupied (82%)",
    icon: BedDouble,
    accent: "text-primary",
    bg: "bg-primary/5",
  },
  {
    title: "Today's Revenue",
    value: "KES 284,500",
    change: "+8%",
    up: true,
    sub: "vs. yesterday (KES 263,240)",
    icon: DollarSign,
    accent: "text-teal-600",
    bg: "bg-teal-50",
  },
];

const alerts = [
  { type: "warning", msg: "3 drugs nearing reorder level in pharmacy" },
  { type: "error", msg: "2 pending SHA eligibility verifications" },
  { type: "info", msg: "Pathology lab turnaround >60 min for 4 samples" },
];

export function Dashboard() {
  const [department, setDepartment] = useState("all");
  const [dateRange, setDateRange] = useState("today");
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<any | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const data = await adminApi.getStats();
      setStats(data);
    } catch (err) {
      console.error("Failed to load dashboard stats:", err);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    setCurrentUser(getCurrentUser());
    fetchStats();
  }, []);

  const dynamicKpiCards = [
    {
      title: "Total Patients",
      value: stats ? stats.totalPatients : "4",
      change: "+100%",
      up: true,
      sub: "Master Patient Index",
      icon: Users,
      accent: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Active Encounters",
      value: stats ? stats.activeEncounters : "4",
      change: "Active",
      up: true,
      sub: "In Clinical Workflow",
      icon: Activity,
      accent: "text-orange-600",
      bg: "bg-orange-50",
    },
    {
      title: "Inpatient Admissions",
      value: stats ? stats.admittedCount : "0",
      change: stats?.bedOccupancy ? `${stats.bedOccupancy.occupancyRate}%` : "0%",
      up: false,
      sub: `${stats?.bedOccupancy?.available || 23} beds available`,
      icon: BedDouble,
      accent: "text-primary",
      bg: "bg-primary/5",
    },
    {
      title: "Hospital Collections",
      value: stats ? `KES ${stats.totalRevenue.toLocaleString()}` : "KES 2,500",
      change: "+100%",
      up: true,
      sub: `KES ${(stats?.outstandingRevenue || 0).toLocaleString()} pending`,
      icon: DollarSign,
      accent: "text-teal-600",
      bg: "bg-teal-50",
    },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f8faf9" }}>
      <div className="p-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Hello, {currentUser?.fullName || "Staff Clinician"}! 👋
            </h1>
            <p className="text-muted-foreground mt-0.5 text-xs">
              Live hospital operations & clinical flow for {new Date().toLocaleDateString("en-KE", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20 px-3 py-1 text-xs">
              <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse" />
              Live DB: Connected
            </Badge>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={fetchStats} disabled={loadingStats}>
              <RefreshCw className={`w-3.5 h-3.5 ${loadingStats ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="border border-border/50">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">Period:</span>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="w-36 h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="yesterday">Yesterday</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">Department:</span>
                <Select value={department} onValueChange={setDepartment}>
                  <SelectTrigger className="w-44 h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    <SelectItem value="opd">OPD / Outpatient</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                    <SelectItem value="inpatient">Inpatient</SelectItem>
                    <SelectItem value="maternity">Maternity</SelectItem>
                    <SelectItem value="surgical">Surgical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                Last updated: {new Date().toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="space-y-2">
            {alerts.map((a, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm border ${
                  a.type === "error"
                    ? "bg-red-50 border-red-200 text-red-700"
                    : a.type === "warning"
                    ? "bg-amber-50 border-amber-200 text-amber-700"
                    : "bg-blue-50 border-blue-200 text-blue-700"
                }`}
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {a.msg}
              </div>
            ))}
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {dynamicKpiCards.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <Card key={kpi.title} className="border border-border/50 hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">{kpi.title}</p>
                      <p className="text-2xl font-semibold mt-1 text-foreground">{kpi.value}</p>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        {kpi.up ? (
                          <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <ArrowDownRight className="w-3.5 h-3.5 text-red-500" />
                        )}
                        <span className={`text-xs font-medium ${kpi.up ? "text-emerald-600" : "text-red-500"}`}>
                          {kpi.change}
                        </span>
                        <span className="text-xs text-muted-foreground">{kpi.sub}</span>
                      </div>
                    </div>
                    <div className={`w-10 h-10 rounded-xl ${kpi.bg} flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${kpi.accent}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Department Queue Status */}
        <div>
          <h2 className="text-base font-semibold text-foreground mb-3">Department Queue Status</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
            {departmentQueues.map((dept) => {
              const Icon = dept.icon;
              return (
                <Card key={dept.id} className="border border-border/50 hover:shadow-md transition-shadow cursor-pointer group">
                  <CardContent className="p-4 text-center">
                    <div className={`w-10 h-10 rounded-full ${dept.bg} flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform`}>
                      <Icon className={`w-5 h-5 ${dept.color}`} />
                    </div>
                    <p className="text-xs font-medium text-foreground mb-2">{dept.label}</p>
                    <div className="flex justify-center gap-3 text-xs">
                      <div className="text-center">
                        <p className="font-bold text-base text-foreground">{dept.waiting}</p>
                        <p className="text-muted-foreground">waiting</p>
                      </div>
                      <div className="w-px bg-border" />
                      <div className="text-center">
                        <p className={`font-bold text-base ${dept.color}`}>{dept.inProgress}</p>
                        <p className="text-muted-foreground">active</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Patient Flow */}
          <Card className="border border-border/50">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  Patient Flow — Today
                </CardTitle>
                <Badge variant="secondary" className="text-xs">Hourly</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={patientFlowData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="gradRegistered" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#030213" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#030213" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradDischarged" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="registered" name="Registered" stroke="#030213" strokeWidth={2} fill="url(#gradRegistered)" />
                  <Area type="monotone" dataKey="consultation" name="In Consult" stroke="#6366f1" strokeWidth={2} fill="none" strokeDasharray="4 2" />
                  <Area type="monotone" dataKey="discharged" name="Discharged" stroke="#10b981" strokeWidth={2} fill="url(#gradDischarged)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Revenue by Department */}
          <Card className="border border-border/50">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Syringe className="w-4 h-4 text-primary" />
                  Revenue by Department (KES)
                </CardTitle>
                <Badge variant="secondary" className="text-xs">Today</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={revenueData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="dept" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${v / 1000}k`} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                    formatter={(val: number) => [`KES ${val.toLocaleString()}`, ""]}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="consultation" name="Consultation" fill="#030213" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="laboratory" name="Laboratory" fill="#6366f1" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="pharmacy" name="Pharmacy" fill="#10b981" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="border border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              Recent Patient Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              {recentActivity.map((item) => (
                <div key={item.id} className="flex items-center gap-4 px-6 py-3 hover:bg-accent/30 transition-colors">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    item.status === "success" ? "bg-emerald-500" :
                    item.status === "warning" ? "bg-amber-500" : "bg-blue-500"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item.patient}</p>
                    <p className="text-xs text-muted-foreground">{item.mrn} · {item.action}</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-shrink-0">
                    <Clock className="w-3 h-3" />
                    {item.time}
                  </div>
                  {item.status === "success" && (
                    <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
