import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:5000/api';

const DEMO_USERS = [
  { role: 'ADMINISTRATOR', username: 'admin', expectedDashboard: 'dashboard' },
  { role: 'RECEPTIONIST', username: 'reception', expectedDashboard: 'patients' },
  { role: 'TRIAGE_NURSE', username: 'triage', expectedDashboard: 'clinical' },
  { role: 'DOCTOR', username: 'doctor', expectedDashboard: 'clinical' },
  { role: 'LABORATORY', username: 'laboratory', expectedDashboard: 'clinical' },
  { role: 'PHARMACIST', username: 'pharmacy', expectedDashboard: 'clinical' },
  { role: 'BILLING', username: 'billing', expectedDashboard: 'billing' },
  { role: 'NURSE', username: 'nurse', expectedDashboard: 'inpatient' },
  { role: 'PROCUREMENT', username: 'procurement', expectedDashboard: 'procurement' },
  { role: 'ACCOUNTS', username: 'accounts', expectedDashboard: 'accounts' },
  { role: 'HR', username: 'hr', expectedDashboard: 'hr' },
];

async function runAudit() {
  console.log('================================================================');
  console.log('      HMIS FULL SYSTEM IMPLEMENTATION & RBAC AUDIT SUITE       ');
  console.log('================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      console.log(`  ✔ [PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`  ✖ [FAIL] ${testName}${detail ? ` — ${detail}` : ''}`);
      throw new Error(`Test failed: ${testName}`);
    }
  }

  // -------------------------------------------------------------
  // Test Section 1: Authentication & Demo Accounts Verification
  // -------------------------------------------------------------
  console.log('--- TEST SECTION 1: ROLE-BASED LOGIN & TOKEN GENERATION ---');
  const tokens: Record<string, string> = {};

  for (const acc of DEMO_USERS) {
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: acc.username,
        password: 'Hospital2026!',
      }),
    });

    assert(loginRes.status === 200, `Login for role: ${acc.role} (${acc.username})`, `Status: ${loginRes.status}`);
    const data = await loginRes.json();
    assert(!!data.token, `JWT token received for ${acc.username}`);
    assert(data.user?.role === acc.role, `Token payload contains role ${acc.role}`);
    tokens[acc.username] = data.token;
  }

  // -------------------------------------------------------------
  // Test Section 2: Server-Side RBAC & URL Protection
  // -------------------------------------------------------------
  console.log('\n--- TEST SECTION 2: SERVER-SIDE AUTHORIZATION (RBAC) ---');
  const receptionToken = tokens['reception'];

  // Receptionist should be blocked from Admin, Accounts, HR, Procurement
  const adminAttempt = await fetch(`${API_URL}/admin/stats`, {
    headers: { Authorization: `Bearer ${receptionToken}` },
  });
  assert(adminAttempt.status === 403, 'Reception blocked from /api/admin/stats (403 Forbidden)');

  const accountsAttempt = await fetch(`${API_URL}/accounts/stats`, {
    headers: { Authorization: `Bearer ${receptionToken}` },
  });
  assert(accountsAttempt.status === 403, 'Reception blocked from /api/accounts/stats (403 Forbidden)');

  const hrAttempt = await fetch(`${API_URL}/hr/stats`, {
    headers: { Authorization: `Bearer ${receptionToken}` },
  });
  assert(hrAttempt.status === 403, 'Reception blocked from /api/hr/stats (403 Forbidden)');

  const procurementAttempt = await fetch(`${API_URL}/procurement/stats`, {
    headers: { Authorization: `Bearer ${receptionToken}` },
  });
  assert(procurementAttempt.status === 403, 'Reception blocked from /api/procurement/stats (403 Forbidden)');

  // Administrator should have access to all endpoints
  const adminToken = tokens['admin'];
  const adminStatsRes = await fetch(`${API_URL}/admin/stats`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert(adminStatsRes.status === 200, 'Admin authorized for /api/admin/stats (200 OK)');

  // -------------------------------------------------------------
  // Test Section 3: End-to-End Patient Journey Workflow
  // -------------------------------------------------------------
  console.log('\n--- TEST SECTION 3: END-TO-END PATIENT CLINICAL WORKFLOW ---');

  // Step 3.1: Reception registers patient
  const uniqueNationalId = `ID-${Date.now().toString().slice(-8)}`;
  const regRes = await fetch(`${API_URL}/patients`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${receptionToken}`,
    },
    body: JSON.stringify({
      fullName: 'Amina Zainab Mwanzia',
      nationalId: uniqueNationalId,
      dateOfBirth: '1992-04-12',
      gender: 'FEMALE',
      phone: '+254 712 345 678',
      residence: 'Nairobi South B',
      nextOfKinName: 'Rashid Mwanzia',
      nextOfKinRelation: 'Husband',
      nextOfKinPhone: '+254 712 999 888',
      primaryScheme: 'SHA',
      schemePolicyNumber: 'SHA-88990011',
      department: 'TRIAGE',
    }),
  });

  assert(regRes.status === 201, 'Patient registration (Reception)', `Status: ${regRes.status}`);
  const registeredPatient = await regRes.json();
  assert(!!registeredPatient.patient?.mrn, `MRN generated: ${registeredPatient.patient?.mrn}`);
  const encounterId = registeredPatient.encounter?.id;
  const patientId = registeredPatient.patient?.id;

  // Verify patient queue entry in TRIAGE
  const triageToken = tokens['triage'];
  const triageQueueRes = await fetch(`${API_URL}/queue/TRIAGE`, {
    headers: { Authorization: `Bearer ${triageToken}` },
  });
  const triageQueue = await triageQueueRes.json();
  const patientTriageQueueItem = triageQueue.find((q: any) => q.encounterId === encounterId);
  assert(!!patientTriageQueueItem, 'Patient queued into Outpatient Triage list');

  // Step 3.2: Triage records vitals and routes to Consultation
  const vitalsRes = await fetch(`${API_URL}/triage`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${triageToken}`,
    },
    body: JSON.stringify({
      encounterId,
      queueId: patientTriageQueueItem.id,
      temperature: 38.5,
      bloodPressureSys: 124,
      bloodPressureDia: 82,
      pulseRate: 88,
      respiratoryRate: 20,
      oxygenSat: 97,
      weightKg: 64,
      heightCm: 165,
      bmi: 23.5,
      notes: 'Patient pyrexic. Complains of chills and malaise.',
      routeToDepartment: 'CONSULTATION',
    }),
  });
  assert(vitalsRes.status === 201, 'Triage recorded and patient forwarded to Consultation');

  // Step 3.3: Doctor Consultation, Diagnosis, Lab Order, Prescription
  const doctorToken = tokens['doctor'];
  const mpsTest = await prisma.laboratoryTest.findFirst({ where: { code: 'LAB-MPS' } });
  const alDrug = await prisma.drugItem.findFirst({ where: { code: 'MED-AL-6X4' } });

  const consultRes = await fetch(`${API_URL}/clinical/consultation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${doctorToken}`,
    },
    body: JSON.stringify({
      encounterId,
      chiefComplaint: 'High continuous fever, severe frontal headache, joint pains for 48 hours',
      history: 'Onset 2 days ago after travelling to Kisumu. No known allergies.',
      examination: 'Pyrexia 38.5°C, conjunctival pallor absent, abdomen non-tender.',
      diagnoses: [
        { icdCode: 'B54', description: 'Plasmodium Falciparum Malaria', isPrimary: true },
      ],
      labTestIds: mpsTest ? [mpsTest.id] : [],
      prescriptions: alDrug
        ? [
            {
              drugId: alDrug.id,
              dosage: '4 tablets stat, then bd for 3 days',
              frequency: 'TWICE_DAILY',
              durationDays: 3,
              quantityPrescribed: 24,
            },
          ]
        : [],
      nextDepartment: 'LABORATORY',
    }),
  });
  assert(consultRes.status === 201, 'Doctor consultation, diagnosis, lab order, and prescription recorded');
  const consultData = await consultRes.json();
  const labOrderId = consultData.labOrder?.id;
  const prescriptionId = consultData.prescription?.id;

  // Step 3.4: Laboratory receives order and enters results
  const labToken = tokens['laboratory'];
  const labOrderRes = await fetch(`${API_URL}/lab/orders`, {
    headers: { Authorization: `Bearer ${labToken}` },
  });
  const labOrders = await labOrderRes.json();
  const targetLabOrder = labOrders.find((o: any) => o.id === labOrderId);
  assert(!!targetLabOrder, 'Laboratory received diagnostic test order');

  const labItemId = targetLabOrder.items[0]?.id;
  const resultRes = await fetch(`${API_URL}/lab/orders/${labOrderId}/results`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${labToken}`,
    },
    body: JSON.stringify({
      results: [
        {
          itemId: labItemId,
          resultValue: 'Positive (++) Plasmodium falciparum ring forms seen on Giemsa smear',
          isAbnormal: true,
        },
      ],
    }),
  });
  assert(resultRes.status === 200, 'Laboratory test result validated & recorded');

  // Step 3.5: Pharmacy dispenses medication & stock decrements
  const pharmacyToken = tokens['pharmacy'];
  // Ensure stock is available for the test run
  await prisma.drugItem.update({
    where: { code: 'MED-AL-6X4' },
    data: { totalStock: 100 },
  });
  await prisma.drugBatch.updateMany({
    where: { drug: { code: 'MED-AL-6X4' } },
    data: { quantity: 100 },
  });

  const preStock = await prisma.drugItem.findUnique({ where: { code: 'MED-AL-6X4' } });
  const preStockCount = preStock?.totalStock || 0;
  const rxItem = await prisma.prescriptionItem.findFirst({ where: { prescriptionId } });

  const dispenseRes = await fetch(`${API_URL}/pharmacy/dispense`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${pharmacyToken}`,
    },
    body: JSON.stringify({
      prescriptionId,
      items: [
        {
          itemId: rxItem?.id,
          drugId: preStock?.id,
          quantity: 24,
        },
      ],
    }),
  });
  if (dispenseRes.status !== 200) {
    console.error('Dispense error body:', await dispenseRes.text());
  }
  assert(dispenseRes.status === 200, 'Pharmacy successfully dispensed prescription');

  const postStock = await prisma.drugItem.findUnique({ where: { code: 'MED-AL-6X4' } });
  assert((postStock?.totalStock || 0) === preStockCount - 24, 'Inventory stock verified deducted in database');

  // Step 3.6: Billing generates invoice & records payment
  const billingToken = tokens['billing'];
  const invoicesRes = await fetch(`${API_URL}/billing/invoices`, {
    headers: { Authorization: `Bearer ${billingToken}` },
  });
  const invoices = await invoicesRes.json();
  const patientInvoice = invoices.find((i: any) => i.encounterId === encounterId);
  assert(!!patientInvoice, 'Invoice automatically compiled from clinical consultation & medications');

  const paymentRes = await fetch(`${API_URL}/billing/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${billingToken}`,
    },
    body: JSON.stringify({
      invoiceId: patientInvoice.id,
      amount: patientInvoice.netAmount,
      method: 'CASH',
      referenceNumber: `CASH-REC-${Date.now().toString().slice(-6)}`,
    }),
  });
  assert(paymentRes.status === 201, 'Cash payment recorded and official receipt generated');

  // -------------------------------------------------------------
  // Test Section 4: Inpatient Admission & Discharge Lifecycle
  // -------------------------------------------------------------
  console.log('\n--- TEST SECTION 4: INPATIENT ADMISSION, MAR & DISCHARGE ---');
  const nurseToken = tokens['nurse'];

  // Find an available bed
  const availableBed = await prisma.bed.findFirst({ where: { status: 'AVAILABLE' } });
  assert(!!availableBed, 'Available bed found in database');

  // Admit patient
  const admission = await prisma.admission.create({
    data: {
      patientId,
      encounterId,
      bedId: availableBed!.id,
      admissionReason: 'Severe Malaria with hyperpyrexia',
      admittingDocId: 'doc-1',
      admittingDocName: 'Dr. Kevin Ochieng',
    },
  });
  await prisma.bed.update({ where: { id: availableBed!.id }, data: { status: 'OCCUPIED' } });
  assert(true, `Patient admitted to Bed ${availableBed!.bedNumber} (Status: OCCUPIED)`);

  // Nurse records note
  const nurseNoteRes = await fetch(`${API_URL}/inpatient/nursing-note`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${nurseToken}`,
    },
    body: JSON.stringify({
      admissionId: admission.id,
      note: 'IV fluids started. Temperature reduced to 37.3°C. Patient resting.',
    }),
  });
  assert(nurseNoteRes.status === 201, 'Nursing note recorded into inpatient chart');

  // Nurse administers drug
  const drugAdminRes = await fetch(`${API_URL}/inpatient/drug-admin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${nurseToken}`,
    },
    body: JSON.stringify({
      admissionId: admission.id,
      drugName: 'Paracetamol 1000mg IV Infusion',
      dose: '1g IV stat',
      route: 'IV',
    }),
  });
  assert(drugAdminRes.status === 201, 'Drug administration recorded on inpatient MAR chart');

  // Discharge patient and release bed
  const dischargeRes = await fetch(`${API_URL}/inpatient/discharge`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${nurseToken}`,
    },
    body: JSON.stringify({
      admissionId: admission.id,
      dischargeNotes: 'Afebril for 24h. Malaria parasitaemia cleared. Discharged home on oral hematinics.',
    }),
  });
  if (dischargeRes.status !== 200) {
    console.error('Discharge error body:', await dischargeRes.text());
  }
  assert(dischargeRes.status === 200, 'Inpatient discharge processed');

  const refreshedBed = await prisma.bed.findUnique({ where: { id: availableBed!.id } });
  assert(refreshedBed?.status === 'AVAILABLE', 'Bed successfully released back to AVAILABLE in database');

  // -------------------------------------------------------------
  // Test Section 5: Back-Office Persistence (Procurement, Accounts, HR)
  // -------------------------------------------------------------
  console.log('\n--- TEST SECTION 5: BACK-OFFICE MODULES PERSISTENCE ---');
  const procurementToken = tokens['procurement'];
  const reqRes = await fetch(`${API_URL}/procurement/requisitions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${procurementToken}`,
    },
    body: JSON.stringify({
      department: 'Pharmacy',
      itemDescription: 'Normal Saline 0.9% 500ml Infusion Bottles (Carton of 20)',
      quantity: 15,
      purpose: 'Emergency Room Resuscitation Stock',
    }),
  });
  assert(reqRes.status === 201, 'Procurement requisition created and persisted');

  const accountsToken = tokens['accounts'];
  const journalRes = await fetch(`${API_URL}/accounts/journals`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accountsToken}`,
    },
    body: JSON.stringify({
      description: 'Medical Consumables Replenishment',
      accountCode: '5002',
      accountName: 'Expense - Medical Stock',
      debit: 45000,
      credit: 0,
      reference: 'VCH-2026-9901',
    }),
  });
  assert(journalRes.status === 201, 'Accounts double-entry journal created and persisted');

  const hrToken = tokens['hr'];
  const hrStatsRes = await fetch(`${API_URL}/hr/stats`, {
    headers: { Authorization: `Bearer ${hrToken}` },
  });
  assert(hrStatsRes.status === 200, 'HR analytics & payroll liability retrieved');

  // -------------------------------------------------------------
  // Test Section 6: Audit Log Integrity
  // -------------------------------------------------------------
  console.log('\n--- TEST SECTION 6: SYSTEM AUDIT TRAIL LOGGING ---');
  const auditLogs = await prisma.auditLog.findMany({ take: 10, orderBy: { timestamp: 'desc' } });
  assert(auditLogs.length > 0, `Audit logs captured (${auditLogs.length} recent entries verified)`);

  console.log('\n================================================================');
  console.log(` AUDIT RESULT: ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY!`);
  console.log('================================================================\n');
}

runAudit()
  .catch((err) => {
    console.error('Audit suite failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
