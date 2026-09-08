import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting HMIS Complete Database Seeding ---');

  // 1. Hospital Settings
  await prisma.hospitalSettings.upsert({
    where: { id: '1' },
    update: {
      hospitalName: 'Metropolitan Referral & Teaching Hospital',
      address: 'Hospital Road, P.O. Box 40200-00100, Nairobi, Kenya',
      phone: '+254 700 123 456',
      email: 'info@metrohospital.org',
      currency: 'KES',
      motto: 'Excellence in Patient Care & Clinical Healing',
      shaFacilityId: 'SHA-FAC-7890-KEN',
    },
    create: {
      id: '1',
      hospitalName: 'Metropolitan Referral & Teaching Hospital',
      address: 'Hospital Road, P.O. Box 40200-00100, Nairobi, Kenya',
      phone: '+254 700 123 456',
      email: 'info@metrohospital.org',
      currency: 'KES',
      motto: 'Excellence in Patient Care & Clinical Healing',
      shaFacilityId: 'SHA-FAC-7890-KEN',
    },
  });
  console.log('✔ Hospital Settings seeded');

  // 2. Staff Accounts across all 11 Roles with password "Hospital2026!"
  // Also support "Password123!" for backward compatibility
  const passwordHash = await bcrypt.hash('Hospital2026!', 10);

  const staffAccounts = [
    {
      username: 'admin',
      email: 'admin@metrohospital.org',
      fullName: 'Dr. Arthur Mwangi (Admin)',
      role: 'ADMINISTRATOR',
      department: 'Administration',
    },
    {
      username: 'reception',
      email: 'reception@metrohospital.org',
      fullName: 'Sarah Wanjiku',
      role: 'RECEPTIONIST',
      department: 'Front Desk',
    },
    {
      username: 'triage',
      email: 'triage@metrohospital.org',
      fullName: 'Nurse Sharon Chebet',
      role: 'TRIAGE_NURSE',
      department: 'Outpatient Triage',
    },
    {
      username: 'doctor',
      email: 'doctor@metrohospital.org',
      fullName: 'Dr. Kevin Ochieng, MD',
      role: 'DOCTOR',
      department: 'General Outpatient',
    },
    {
      username: 'laboratory',
      email: 'laboratory@metrohospital.org',
      fullName: 'Peter Kamau (MLS)',
      role: 'LABORATORY',
      department: 'Pathology & Laboratory',
    },
    {
      username: 'pharmacy',
      email: 'pharmacy@metrohospital.org',
      fullName: 'Pharm. Faith Achieng',
      role: 'PHARMACIST',
      department: 'Main Dispensary',
    },
    {
      username: 'billing',
      email: 'billing@metrohospital.org',
      fullName: 'David Kiprono',
      role: 'BILLING',
      department: 'Finance & Cash Office',
    },
    {
      username: 'nurse',
      email: 'nurse@metrohospital.org',
      fullName: 'Sister Grace Muthoni',
      role: 'NURSE',
      department: 'Inpatient Medical Ward',
    },
    {
      username: 'procurement',
      email: 'procurement@metrohospital.org',
      fullName: 'James Ndung\'u',
      role: 'PROCUREMENT',
      department: 'Procurement & Stores',
    },
    {
      username: 'accounts',
      email: 'accounts@metrohospital.org',
      fullName: 'Catherine Wambui (CPA)',
      role: 'ACCOUNTS',
      department: 'Finance & Accounts',
    },
    {
      username: 'hr',
      email: 'hr@metrohospital.org',
      fullName: 'Mercy Nyaboke',
      role: 'HR',
      department: 'Human Resources',
    },
  ];

  for (const staff of staffAccounts) {
    const existing = await prisma.user.findFirst({
      where: { OR: [{ username: staff.username }, { email: staff.email }] }
    });
    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          username: staff.username,
          email: staff.email,
          fullName: staff.fullName,
          role: staff.role,
          department: staff.department,
          passwordHash,
          isActive: true,
        },
      });
    } else {
      await prisma.user.create({
        data: {
          username: staff.username,
          email: staff.email,
          fullName: staff.fullName,
          role: staff.role,
          department: staff.department,
          passwordHash,
          isActive: true,
        },
      });
    }
  }
  console.log(`✔ All 11 Official Staff Roles Seeded (Password: Hospital2026!)`);

  // 3. Laboratory Test Catalog
  const labTests = [
    { code: 'LAB-CBC', name: 'Complete Blood Count (CBC)', category: 'Hematology', price: 1200, unit: 'Indices', referenceRange: 'Normal parameters' },
    { code: 'LAB-MPS', name: 'Malaria Blood Slide (BS for MPS)', category: 'Parasitology', price: 400, unit: 'Trophozoites', referenceRange: 'Negative' },
    { code: 'LAB-UA', name: 'Routine Urinalysis (10-Param Dipstick + Micro)', category: 'Biochemistry', price: 600, unit: 'Visual/Chemical', referenceRange: 'Clear / Negative' },
    { code: 'LAB-FBS', name: 'Fasting Blood Sugar (FBS)', category: 'Biochemistry', price: 350, unit: 'mmol/L', referenceRange: '3.9 - 6.1 mmol/L' },
    { code: 'LAB-LFT', name: 'Liver Function Tests Panel (LFT)', category: 'Biochemistry', price: 2500, unit: 'U/L, g/dL', referenceRange: 'Normal enzyme profiles' },
    { code: 'LAB-UEC', name: 'Renal Function Profile (Urea, Electrolytes, Creatinine)', category: 'Biochemistry', price: 2200, unit: 'mmol/L, umol/L', referenceRange: 'Normal profiles' },
    { code: 'LAB-LIP', name: 'Lipid Profile Panel', category: 'Biochemistry', price: 2000, unit: 'mmol/L', referenceRange: 'Total Chol < 5.2 mmol/L' },
    { code: 'LAB-TYPH', name: 'Widal Agglutination / Typhoid Antibody', category: 'Serology', price: 800, unit: 'Titre', referenceRange: '< 1:80' },
  ];

  for (const test of labTests) {
    await prisma.laboratoryTest.upsert({
      where: { code: test.code },
      update: { price: test.price, name: test.name },
      create: test,
    });
  }
  console.log(`✔ ${labTests.length} Laboratory Tests Catalog Seeded`);

  // 4. Pharmacy Catalog & Initial Batches
  const drugCatalog = [
    { code: 'MED-AMOX-500', name: 'Amoxicillin 500mg Capsules', genericName: 'Amoxicillin Trihydrate', category: 'Antibiotics', unit: 'Capsule', purchasePrice: 12, sellingPrice: 20, totalStock: 500 },
    { code: 'MED-PARA-500', name: 'Paracetamol 500mg Tablets', genericName: 'Acetaminophen', category: 'Analgesics', unit: 'Tablet', purchasePrice: 3, sellingPrice: 5, totalStock: 1200 },
    { code: 'MED-AL-6X4', name: 'Artemether-Lumefantrine 20/120mg (AL)', genericName: 'Artemether / Lumefantrine', category: 'Antimalarials', unit: 'Pack of 24', purchasePrice: 250, sellingPrice: 350, totalStock: 80 },
    { code: 'MED-OMEP-20', name: 'Omeprazole 20mg Capsules', genericName: 'Omeprazole', category: 'Gastrointestinal', unit: 'Capsule', purchasePrice: 15, sellingPrice: 25, totalStock: 400 },
    { code: 'MED-METF-500', name: 'Metformin 500mg Tablets', genericName: 'Metformin HCl', category: 'Antidiabetics', unit: 'Tablet', purchasePrice: 8, sellingPrice: 15, totalStock: 600 },
    { code: 'MED-AMLO-5', name: 'Amlodipine 5mg Tablets', genericName: 'Amlodipine Besylate', category: 'Antihypertensives', unit: 'Tablet', purchasePrice: 10, sellingPrice: 20, totalStock: 350 },
    { code: 'MED-CEFT-1G', name: 'Ceftriaxone 1g Powder for Injection', genericName: 'Ceftriaxone Sodium', category: 'Injectables', unit: 'Vial', purchasePrice: 300, sellingPrice: 500, totalStock: 150 },
    { code: 'MED-SALB-INH', name: 'Salbutamol Inhaler 100mcg', genericName: 'Salbutamol', category: 'Respiratory', unit: 'Inhaler', purchasePrice: 400, sellingPrice: 650, totalStock: 45 },
    { code: 'MED-IV-NS500', name: 'Normal Saline 0.9% 500ml IV Infusion', genericName: 'Sodium Chloride 0.9%', category: 'IV Fluids', unit: 'Bottle', purchasePrice: 150, sellingPrice: 250, totalStock: 200 },
  ];

  for (const drug of drugCatalog) {
    const existing = await prisma.drugItem.findUnique({ where: { code: drug.code } });
    if (!existing) {
      const createdDrug = await prisma.drugItem.create({
        data: {
          code: drug.code,
          name: drug.name,
          genericName: drug.genericName,
          category: drug.category,
          unit: drug.unit,
          purchasePrice: drug.purchasePrice,
          sellingPrice: drug.sellingPrice,
          totalStock: drug.totalStock,
        },
      });

      await prisma.drugBatch.create({
        data: {
          drugId: createdDrug.id,
          batchNumber: `BAT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
          expiryDate: new Date('2027-12-31'),
          quantity: drug.totalStock,
        },
      });
    }
  }
  console.log(`✔ Drug Catalog & Batches Verified`);

  // 5. Wards, Rooms & Beds
  const wardsData = [
    {
      name: 'Male Medical Ward',
      genderSpecific: 'MALE',
      dailyRate: 1500,
      rooms: [
        { number: 'MMW-R1', bedCount: 4 },
        { number: 'MMW-R2', bedCount: 4 },
      ],
    },
    {
      name: 'Female Surgical Ward',
      genderSpecific: 'FEMALE',
      dailyRate: 1800,
      rooms: [
        { number: 'FSW-R1', bedCount: 4 },
        { number: 'FSW-R2', bedCount: 4 },
      ],
    },
    {
      name: 'Pediatric Ward',
      genderSpecific: 'MIXED',
      dailyRate: 1200,
      rooms: [
        { number: 'PED-R1', bedCount: 4 },
      ],
    },
    {
      name: 'Maternity Wing',
      genderSpecific: 'FEMALE',
      dailyRate: 2000,
      rooms: [
        { number: 'MAT-R1', bedCount: 3 },
      ],
    },
  ];

  for (const ward of wardsData) {
    let createdWard = await prisma.ward.findFirst({ where: { name: ward.name } });
    if (!createdWard) {
      createdWard = await prisma.ward.create({
        data: {
          name: ward.name,
          genderSpecific: ward.genderSpecific,
          dailyRate: ward.dailyRate,
        },
      });

      for (const room of ward.rooms) {
        const createdRoom = await prisma.room.create({
          data: {
            wardId: createdWard.id,
            roomNumber: room.number,
          },
        });

        for (let i = 1; i <= room.bedCount; i++) {
          await prisma.bed.create({
            data: {
              roomId: createdRoom.id,
              bedNumber: `BED-${room.number}-${i}`,
              status: 'AVAILABLE',
            },
          });
        }
      }
    }
  }
  console.log('✔ Wards, Rooms, and Beds Verified');

  // 6. Realistic Demo Patients with Full Departmental Encounters
  const samplePatients = [
    {
      mrn: 'PAT-2026-0001',
      nationalId: '28934512',
      fullName: 'John Omondi Otieno',
      dateOfBirth: new Date('1988-05-14'),
      gender: 'MALE',
      phone: '+254 722 111 222',
      occupation: 'Teacher',
      residence: 'Westlands, Nairobi',
      nextOfKinName: 'Mary Otieno',
      nextOfKinRelation: 'Wife',
      nextOfKinPhone: '+254 722 333 444',
      primaryScheme: 'SHA',
      schemePolicyNumber: 'SHA-88239011',
    },
    {
      mrn: 'PAT-2026-0002',
      nationalId: '32109845',
      fullName: 'Beatrice Njeri Kariuki',
      dateOfBirth: new Date('1995-11-20'),
      gender: 'FEMALE',
      phone: '+254 733 444 555',
      occupation: 'Accountant',
      residence: 'Kilimani, Nairobi',
      nextOfKinName: 'James Kariuki',
      nextOfKinRelation: 'Brother',
      nextOfKinPhone: '+254 733 666 777',
      primaryScheme: 'CASH',
    },
    {
      mrn: 'PAT-2026-0003',
      nationalId: '19845672',
      fullName: 'Hassan Abdi Mohamed',
      dateOfBirth: new Date('1972-03-08'),
      gender: 'MALE',
      phone: '+254 710 999 888',
      occupation: 'Businessman',
      residence: 'Eastleigh, Nairobi',
      nextOfKinName: 'Fatuma Abdi',
      nextOfKinRelation: 'Spouse',
      nextOfKinPhone: '+254 710 555 444',
      primaryScheme: 'SHA',
      schemePolicyNumber: 'SHA-72109923',
    },
    {
      mrn: 'PAT-2026-0004',
      nationalId: '35678129',
      fullName: 'Cynthia Chepkemoi',
      dateOfBirth: new Date('2001-08-30'),
      gender: 'FEMALE',
      phone: '+254 720 777 666',
      occupation: 'Student',
      residence: 'Parklands, Nairobi',
      nextOfKinName: 'David Koech',
      nextOfKinRelation: 'Father',
      nextOfKinPhone: '+254 720 123 789',
      primaryScheme: 'CASH',
    },
    {
      mrn: 'PAT-2026-0005',
      nationalId: '21094833',
      fullName: 'Peter K. Njoroge',
      dateOfBirth: new Date('1965-02-18'),
      gender: 'MALE',
      phone: '+254 711 345 678',
      occupation: 'Civil Servant',
      residence: 'Ngong, Nairobi',
      nextOfKinName: 'Ann Njoroge',
      nextOfKinRelation: 'Wife',
      nextOfKinPhone: '+254 711 876 543',
      primaryScheme: 'SHA',
      schemePolicyNumber: 'SHA-55102938',
    },
  ];

  for (let idx = 0; idx < samplePatients.length; idx++) {
    const patData = samplePatients[idx];
    const patient = await prisma.patient.upsert({
      where: { mrn: patData.mrn },
      update: { fullName: patData.fullName, phone: patData.phone },
      create: patData,
    });

    // Check if patient has encounter already
    const existingEnc = await prisma.encounter.findFirst({ where: { patientId: patient.id } });
    if (!existingEnc) {
      const encStatus =
        idx === 0 ? 'CONSULTATION_WAITING' :
        idx === 1 ? 'LAB_PENDING' :
        idx === 2 ? 'PHARMACY_PENDING' :
        idx === 3 ? 'TRIAGE_WAITING' : 'ADMITTED';

      const encounter = await prisma.encounter.create({
        data: {
          encounterNumber: `ENC-2026-000${idx + 1}`,
          patientId: patient.id,
          status: encStatus,
          paymentScheme: patient.primaryScheme,
          schemeNumber: patient.schemePolicyNumber,
        },
      });

      // Queue entries
      const dept =
        idx === 0 ? 'CONSULTATION' :
        idx === 1 ? 'LABORATORY' :
        idx === 2 ? 'PHARMACY' :
        idx === 3 ? 'TRIAGE' : 'INPATIENT';

      await prisma.patientQueue.create({
        data: {
          encounterId: encounter.id,
          department: dept,
          queueNumber: 101 + idx,
          status: 'WAITING',
        },
      });

      // Triage vitals
      await prisma.triage.create({
        data: {
          encounterId: encounter.id,
          recordedById: 'triage-staff-id',
          temperature: 36.8 + (idx * 0.3),
          bloodPressureSys: 120 + (idx * 6),
          bloodPressureDia: 80 + (idx * 2),
          pulseRate: 74 + (idx * 4),
          respiratoryRate: 18,
          oxygenSat: 98,
          weightKg: 68 + (idx * 3),
          heightCm: 170,
          bmi: parseFloat(((68 + idx * 3) / (1.70 * 1.70)).toFixed(1)),
          notes: 'Patient oriented and alert. Ambulatory. Vital signs stable.',
        },
      });

      // Consultation & diagnosis
      const consultation = await prisma.consultation.create({
        data: {
          encounterId: encounter.id,
          doctorId: 'doctor-kevin',
          doctorName: 'Dr. Kevin Ochieng, MD',
          chiefComplaint: idx === 0 ? 'High intermittent fever, chills, and headache for 4 days' :
                          idx === 1 ? 'Severe lower abdominal cramping and pain on urination' :
                          idx === 2 ? 'Burning epigastric pain and loss of appetite' :
                          idx === 4 ? 'Sudden severe hypertension with dizziness and blurred vision' :
                          'General body malaise and joint ache',
          history: 'Patient reports progressive symptoms over the past few days. No known drug allergies reported.',
          examination: 'BP elevated in patient 5. Abdomen soft, tenderness noted in epigastrium. Chest clear to auscultation.',
          notes: 'Plan: Order confirmatory laboratory diagnostics, initiate targeted treatment regimen.',
        },
      });

      await prisma.diagnosis.create({
        data: {
          consultationId: consultation.id,
          icdCode: idx === 0 ? 'B54' : idx === 1 ? 'N39.0' : idx === 2 ? 'K29.7' : 'I10',
          description: idx === 0 ? 'Unspecified Malaria' : idx === 1 ? 'Urinary Tract Infection' : idx === 2 ? 'Gastritis' : 'Essential Primary Hypertension',
          isPrimary: true,
        },
      });

      // Laboratory orders
      const labOrder = await prisma.laboratoryOrder.create({
        data: {
          orderNumber: `LAB-ORD-2026-000${idx + 1}`,
          encounterId: encounter.id,
          orderedById: 'doctor-kevin',
          status: idx === 0 ? 'COMPLETED' : idx === 1 ? 'IN_PROGRESS' : 'PENDING',
          notes: 'Urgent diagnostic screening requested.',
        },
      });

      await prisma.laboratoryOrderItem.create({
        data: {
          orderId: labOrder.id,
          testId: 'LAB-CBC',
          testName: 'Complete Blood Count (CBC)',
          price: 1200,
          status: idx === 0 ? 'COMPLETED' : 'PENDING',
          resultValue: idx === 0 ? 'WBC: 11.2, Hb: 13.8 g/dL, Platelets: 245' : null,
          referenceRange: 'Normal parameters',
          isAbnormal: idx === 0 ? false : false,
          verifiedAt: idx === 0 ? new Date() : null,
          verifiedById: idx === 0 ? 'laboratory-staff-id' : null,
        },
      });

      if (idx === 0) {
        await prisma.laboratoryOrderItem.create({
          data: {
            orderId: labOrder.id,
            testId: 'LAB-MPS',
            testName: 'Malaria Blood Slide (BS for MPS)',
            price: 400,
            status: 'COMPLETED',
            resultValue: 'Positive (++) Plasmodium falciparum ring forms',
            referenceRange: 'Negative',
            isAbnormal: true,
            verifiedAt: new Date(),
            verifiedById: 'laboratory-staff-id',
          },
        });
      }

      // Prescriptions
      const prescription = await prisma.prescription.create({
        data: {
          prescriptionNumber: `RX-2026-000${idx + 1}`,
          encounterId: encounter.id,
          doctorId: 'doctor-kevin',
          doctorName: 'Dr. Kevin Ochieng, MD',
          status: idx === 2 ? 'DISPENSED' : 'PENDING',
          notes: 'Take full course as prescribed with meals.',
        },
      });

      await prisma.prescriptionItem.create({
        data: {
          prescriptionId: prescription.id,
          drugId: 'MED-AL-6X4',
          drugName: 'Artemether-Lumefantrine 20/120mg (AL)',
          dosage: '4 tablets stat, then 4 tablets at 8h, 24h, 36h, 48h, 60h',
          frequency: 'Twice daily for 3 days',
          duration: '3 days',
          quantity: 24,
          unitPrice: 350,
          totalPrice: 350,
          isDispensed: idx === 2 ? true : false,
        },
      });

      await prisma.prescriptionItem.create({
        data: {
          prescriptionId: prescription.id,
          drugId: 'MED-PARA-500',
          drugName: 'Paracetamol 500mg Tablets',
          dosage: '1000mg',
          frequency: 'TDS (3 times daily)',
          duration: '5 days',
          quantity: 15,
          unitPrice: 5,
          totalPrice: 75,
          isDispensed: idx === 2 ? true : false,
        },
      });

      // Invoice
      const invoice = await prisma.invoice.create({
        data: {
          invoiceNumber: `INV-2026-000${idx + 1}`,
          encounterId: encounter.id,
          totalAmount: 3525,
          netAmount: 3525,
          paidAmount: idx === 2 ? 3525 : 0,
          status: idx === 2 ? 'PAID' : 'PENDING',
        },
      });

      await prisma.invoiceItem.create({
        data: {
          invoiceId: invoice.id,
          description: 'Physician Consultation Fee',
          category: 'CONSULTATION',
          quantity: 1,
          unitPrice: 1500,
          totalPrice: 1500,
        },
      });

      await prisma.invoiceItem.create({
        data: {
          invoiceId: invoice.id,
          description: 'Laboratory Diagnostics Bundle',
          category: 'LABORATORY',
          quantity: 1,
          unitPrice: 1600,
          totalPrice: 1600,
        },
      });

      await prisma.invoiceItem.create({
        data: {
          invoiceId: invoice.id,
          description: 'Prescription Medication',
          category: 'PHARMACY',
          quantity: 1,
          unitPrice: 425,
          totalPrice: 425,
        },
      });

      if (idx === 2) {
        await prisma.payment.create({
          data: {
            receiptNumber: `RCP-2026-000${idx + 1}`,
            invoiceId: invoice.id,
            amount: 3525,
            method: 'CASH',
            referenceNumber: 'CASH-REC-001',
            receivedById: 'billing-staff-id',
            receivedByName: 'David Kiprono',
          },
        });
      }

      // If patient 5 (Peter K. Njoroge): Admit to Male Medical Ward
      if (idx === 4) {
        const availableBed = await prisma.bed.findFirst({ where: { status: 'AVAILABLE' } });
        if (availableBed) {
          const admission = await prisma.admission.create({
            data: {
              admissionNumber: 'ADM-2026-0001',
              encounterId: encounter.id,
              patientId: patient.id,
              bedId: availableBed.id,
              admittedById: 'doctor-kevin',
              admittedByName: 'Dr. Kevin Ochieng, MD',
              diagnosis: 'Hypertensive Urgency, stage 2 with end-organ risk',
              status: 'ADMITTED',
            },
          });

          await prisma.bed.update({
            where: { id: availableBed.id },
            data: { status: 'OCCUPIED' },
          });

          await prisma.nursingNote.create({
            data: {
              admissionId: admission.id,
              nurseId: 'nurse-grace',
              nurseName: 'Sister Grace Muthoni',
              note: 'Patient received in male medical ward. Resting in semi-Fowler position. Blood pressure monitored hourly. IV line patent.',
            },
          });

          await prisma.drugAdministration.create({
            data: {
              admissionId: admission.id,
              drugName: 'Amlodipine 10mg stat',
              dosage: '10mg PO',
              administeredById: 'nurse-grace',
              administeredByName: 'Sister Grace Muthoni',
            },
          });
        }
      }
    }
  }
  console.log('✔ Clinical Encounters, Lab Orders, Prescriptions, Invoices & Inpatients Seeded');

  // 7. Back-Office: Suppliers & Procurement
  const suppliers = [
    { name: 'MedSupply Africa Ltd', contactPerson: 'Daniel Kimani', phone: '+254 722 001 002', email: 'sales@medsupply.co.ke', address: 'Industrial Area, Nairobi' },
    { name: 'Kenya Medics Diagnostics', contactPerson: 'Mary Wanjohi', phone: '+254 733 003 004', email: 'orders@kenyamedics.com', address: 'Upper Hill, Nairobi' },
    { name: 'Global Pharma Supplies', contactPerson: 'Rajesh Patel', phone: '+254 710 005 006', email: 'info@globalpharma.ke', address: 'Mombasa Road, Nairobi' },
  ];

  for (let sIdx = 0; sIdx < suppliers.length; sIdx++) {
    const s = suppliers[sIdx];
    let supplier = await prisma.supplier.findFirst({ where: { name: s.name } });
    if (!supplier) {
      supplier = await prisma.supplier.create({ data: s });
    }

    // Create a Purchase Order
    const poExists = await prisma.purchaseOrder.findFirst({ where: { supplierId: supplier.id } });
    if (!poExists) {
      await prisma.purchaseOrder.create({
        data: {
          poNumber: `PO-2026-000${sIdx + 1}`,
          supplierId: supplier.id,
          status: sIdx === 0 ? 'ORDERED' : sIdx === 1 ? 'RECEIVED' : 'DRAFT',
          totalAmount: 185000 + (sIdx * 45000),
        },
      });
    }
  }

  // Requisitions
  const sampleReqs = [
    { reqNumber: 'REQ-2026-0001', department: 'Laboratory', itemDescription: 'CBC Reagents & Lyse Packs (500 tests)', quantity: 10, purpose: 'Routine hematology test consumables', requestedBy: 'Peter Kamau (MLS)', status: 'APPROVED' },
    { reqNumber: 'REQ-2026-0002', department: 'Pharmacy', itemDescription: 'Paracetamol 500mg Boxes (10,000 tabs)', quantity: 20, purpose: 'Replenishing fast-moving analgesic stock', requestedBy: 'Pharm. Faith Achieng', status: 'PENDING' },
    { reqNumber: 'REQ-2026-0003', department: 'Inpatient Nursing', itemDescription: 'Sterile IV Cannula 20G & Infusion Sets', quantity: 150, purpose: 'Inpatient daily clinical care', requestedBy: 'Sister Grace Muthoni', status: 'ORDERED' },
  ];

  for (const req of sampleReqs) {
    await prisma.requisition.upsert({
      where: { reqNumber: req.reqNumber },
      update: {},
      create: req,
    });
  }
  console.log('✔ Suppliers, Purchase Orders & Requisitions Seeded');

  // 8. Back-Office: HR Staff Directory, Leaves & Payroll
  const hrStaff = [
    { staffNumber: 'EMP-001', fullName: 'Dr. Arthur Mwangi', department: 'Administration', designation: 'Chief Medical Officer / Admin', phone: '+254 700 000 001', email: 'admin@metrohospital.org', basicSalary: 350000, hireDate: new Date('2020-01-15') },
    { staffNumber: 'EMP-002', fullName: 'Dr. Kevin Ochieng', department: 'Clinical Medicine', designation: 'Lead Consultant Physician', phone: '+254 700 000 002', email: 'doctor@metrohospital.org', basicSalary: 280000, hireDate: new Date('2021-03-01') },
    { staffNumber: 'EMP-003', fullName: 'Sister Grace Muthoni', department: 'Nursing', designation: 'Inpatient Ward Sister', phone: '+254 700 000 003', email: 'nurse@metrohospital.org', basicSalary: 120000, hireDate: new Date('2021-06-10') },
    { staffNumber: 'EMP-004', fullName: 'Peter Kamau', department: 'Laboratory', designation: 'Chief Laboratory Technologist', phone: '+254 700 000 004', email: 'laboratory@metrohospital.org', basicSalary: 115000, hireDate: new Date('2022-02-15') },
    { staffNumber: 'EMP-005', fullName: 'Faith Achieng', department: 'Pharmacy', designation: 'Head Pharmacist', phone: '+254 700 000 005', email: 'pharmacy@metrohospital.org', basicSalary: 125000, hireDate: new Date('2022-04-01') },
    { staffNumber: 'EMP-006', fullName: 'David Kiprono', department: 'Finance & Accounts', designation: 'Senior Billing Officer', phone: '+254 700 000 006', email: 'billing@metrohospital.org', basicSalary: 95000, hireDate: new Date('2022-08-01') },
    { staffNumber: 'EMP-007', fullName: 'Catherine Wambui', department: 'Finance & Accounts', designation: 'Finance Accountant (CPA-K)', phone: '+254 700 000 007', email: 'accounts@metrohospital.org', basicSalary: 150000, hireDate: new Date('2021-09-01') },
    { staffNumber: 'EMP-008', fullName: 'James Ndung\'u', department: 'Procurement', designation: 'Procurement Manager', phone: '+254 700 000 008', email: 'procurement@metrohospital.org', basicSalary: 110000, hireDate: new Date('2022-11-01') },
    { staffNumber: 'EMP-009', fullName: 'Sarah Wanjiku', department: 'Front Desk', designation: 'Front Office Lead', phone: '+254 700 000 009', email: 'reception@metrohospital.org', basicSalary: 75000, hireDate: new Date('2023-01-10') },
    { staffNumber: 'EMP-010', fullName: 'Sharon Chebet', department: 'Outpatient Triage', designation: 'Triage Nurse Officer', phone: '+254 700 000 010', email: 'triage@metrohospital.org', basicSalary: 90000, hireDate: new Date('2023-02-01') },
    { staffNumber: 'EMP-011', fullName: 'Mercy Nyaboke', department: 'Human Resources', designation: 'Human Resource Officer', phone: '+254 700 000 011', email: 'hr@metrohospital.org', basicSalary: 110000, hireDate: new Date('2022-05-01') },
  ];

  for (const emp of hrStaff) {
    const employee = await prisma.employee.upsert({
      where: { email: emp.email },
      update: { basicSalary: emp.basicSalary, designation: emp.designation },
      create: emp,
    });

    // Seed payroll record for previous month
    const existingPayroll = await prisma.payroll.findFirst({ where: { employeeId: employee.id, month: 8, year: 2026 } });
    if (!existingPayroll) {
      const allowances = Math.round(emp.basicSalary * 0.15);
      const deductions = Math.round(emp.basicSalary * 0.12);
      await prisma.payroll.create({
        data: {
          employeeId: employee.id,
          month: 8,
          year: 2026,
          basicSalary: emp.basicSalary,
          allowances,
          deductions,
          netSalary: emp.basicSalary + allowances - deductions,
          isDisbursed: true,
          disbursedAt: new Date('2026-08-28'),
        },
      });
    }
  }

  // Seed sample leave application
  const nurseEmp = await prisma.employee.findUnique({ where: { email: 'nurse@metrohospital.org' } });
  if (nurseEmp) {
    const existingLeave = await prisma.leaveApplication.findFirst({ where: { employeeId: nurseEmp.id } });
    if (!existingLeave) {
      await prisma.leaveApplication.create({
        data: {
          employeeId: nurseEmp.id,
          leaveType: 'ANNUAL',
          startDate: new Date('2026-09-15'),
          endDate: new Date('2026-09-25'),
          daysCount: 10,
          reason: 'Scheduled annual rest and family leave',
          status: 'APPROVED',
        },
      });
    }
  }
  console.log('✔ HR Staff, Payroll & Leaves Seeded');

  // 9. Back-Office: Accounts & Financial Ledgers
  const journalEntries = [
    { entryNumber: 'JRN-2026-0001', description: 'Monthly Outpatient Clinical Consultations Revenue', accountCode: '4001', accountName: 'Revenue - Consultation Fees', debit: 0, credit: 420000, reference: 'REV-AUG-01' },
    { entryNumber: 'JRN-2026-0002', description: 'Monthly Outpatient Clinical Consultations Cash Collection', accountCode: '1001', accountName: 'Cash at Bank - KCB Operating', debit: 420000, credit: 0, reference: 'REV-AUG-01' },
    { entryNumber: 'JRN-2026-0003', description: 'Laboratory Diagnostic Testing Revenue', accountCode: '4002', accountName: 'Revenue - Laboratory Services', debit: 0, credit: 285000, reference: 'REV-AUG-02' },
    { entryNumber: 'JRN-2026-0004', description: 'Laboratory Diagnostic Testing Cash Inflow', accountCode: '1002', accountName: 'Cash at Bank - Equity Healthcare', debit: 285000, credit: 0, reference: 'REV-AUG-02' },
    { entryNumber: 'JRN-2026-0005', description: 'Pharmacy Pharmaceutical Stock Sales Revenue', accountCode: '4003', accountName: 'Revenue - Pharmacy Dispensary', debit: 0, credit: 360000, reference: 'REV-AUG-03' },
    { entryNumber: 'JRN-2026-0006', description: 'Pharmacy Pharmaceutical Stock Cash Collection', accountCode: '1001', accountName: 'Cash at Bank - KCB Operating', debit: 360000, credit: 0, reference: 'REV-AUG-03' },
    { entryNumber: 'JRN-2026-0007', description: 'Medical Consumables Procurement Payment', accountCode: '5001', accountName: 'Expense - Medical Consumables', debit: 185000, credit: 0, reference: 'PO-2026-0001' },
    { entryNumber: 'JRN-2026-0008', description: 'Payment Settlement to MedSupply Africa', accountCode: '1001', accountName: 'Cash at Bank - KCB Operating', debit: 0, credit: 185000, reference: 'PO-2026-0001' },
  ];

  for (const jrn of journalEntries) {
    await prisma.journalEntry.upsert({
      where: { entryNumber: jrn.entryNumber },
      update: {},
      create: jrn,
    });
  }
  console.log('✔ Accounts Journal Entries & Trial Balance Records Seeded');

  console.log('--- Database Seeding Successfully Completed ---');
}

main()
  .catch((e) => {
    console.error('Seeding Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
