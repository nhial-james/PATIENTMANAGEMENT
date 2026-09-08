# Metropolitan Referral Hospital – HMIS Enterprise Platform

**Facility Code:** `SHA-FAC-7890-KEN`  
**Architecture:** React 18, Vite, TypeScript, Tailwind CSS, Express, Prisma ORM, SQLite  
**Security:** Bcrypt Hashing, Role-Based Access Control (RBAC), Audit Trails, SHA-Ready  

---

## System Overview

Metropolitan Referral Hospital HMIS is a full-stack, modular Hospital Management Information System designed for healthcare facilities. The system supports full clinical, operational, financial, and administrative workflows across 11 integrated departments.

---

## Core Modules

### Front Office & Patients
- **Patient Registration:** Auto-generated MRN, demographic records, contact details, next-of-kin, and payment schemes (Cash, SHA/SHIF, Private Insurance, Corporate).
- **Patient Directory & Profiles:** Searchable by MRN, Name, National ID, and Phone Number.
- **Outpatient Encounter Routing:** Real-time queue management dispatching patients to Triage, Consultation, or Diagnostic stations.

### Clinical Workstations
- **Triage Station:** Vital signs capture (Blood Pressure, Heart Rate, Respiratory Rate, Temperature, SpO2), automatic BMI calculation with category indicators, and clinical priority routing.
- **Doctor Consultation:** Chief complaint, history of present illness, examination notes, ICD-10 diagnosis selector, laboratory order requisitions, and digital e-prescriptions.
- **Laboratory Station:** Test specimen accessioning, sample status tracking (Pending, Processing, Completed), quantitative/qualitative result entry, and technician validation.
- **Pharmacy & Dispensary:** Prescription verification, FIFO batch management, expiry date tracking, stock level deduction, and dispensing logs.

### Inpatient & Ward Care
- **Inpatient Bed Management:** Real-time ward occupancy map (General Medical, Surgical, Pediatric, Maternity, ICU), admission orders, and bed transfers.
- **Medication Administration Record (MAR):** Scheduled medication doses, nurse administration timestamps, and nursing progress notes.
- **Discharge Workflow:** Doctor discharge summary, billing reconciliation, and bed de-allocation.

### Billing & Revenue Cycle
- **Automated Charge Invoicing:** Real-time itemized billing aggregation from consultations, laboratory investigations, pharmacy dispensations, and bed nights.
- **Payment Collection:** M-Pesa STK push simulation, Cash office, SHA/SHIF electronic claims, and Private Insurance.
- **Receipting:** Real-time balance calculations, audit-stamped receipts, and payment logs.

### Universal Health Coverage (SHA Portal)
- **Facility Verification:** `SHA-FAC-7890-KEN` integrated electronic claim authorizer.
- **Member Verification & Benefit Package Mapping:** Verification of SHA member status and automated claim submission.

### Back Office & Enterprise Management
- **Procurement & Inventory:** Purchase requisitions, purchase orders, supplier management, and central medical store receiving.
- **Financial Accounts:** General ledger, chart of accounts, trial balance, and hospital revenue statements.
- **Human Resources (HR):** Staff directory, department assignments, leave approvals, and monthly payroll processing.
- **Administration & Audit:** User account provisioning, RBAC policy enforcement, and audit logs tracking user actions.

---

## Quick Start Guide

### Prerequisites
- Node.js (v18 or higher)
- npm or pnpm

### Installation

1. Clone repository:
   ```bash
   git clone https://github.com/nhial-james/PATIENTMANAGEMENT.git
   cd PATIENTMANAGEMENT
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Initialize database & seed:
   ```bash
   npm run prisma:generate
   npm run prisma:push
   npm run prisma:seed
   ```

4. Start development servers:
   ```bash
   npm run start
   ```
   - Web application: `http://localhost:5177`
   - Express API server: `http://localhost:5000`

---

## Workstation Demo Accounts

Universal Password for all demo accounts: **`Hospital2026!`**

| Role | Username | Staff Member | Station Scope |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin` | Dr. Arthur Pendelton | Full Hospital Administration & Audit Logs |
| **Doctor** | `doctor` | Dr. Jane Doe | Clinical Consultation, Diagnoses & Orders |
| **Triage Nurse** | `triage` | Sarah Cherono | Vital Signs, BMI Assessment & Clinical Triage |
| **Receptionist** | `reception` | Faith Wanjiku | Patient Registration, Queue & Schemes |
| **Lab Technician** | `laboratory` | Daniel Kiprotich | Diagnostic Tests, Specimen & Results |
| **Pharmacist** | `pharmacy` | Brian Otieno | Prescription Dispensing & Drug Inventory |
| **Billing Cashier** | `billing` | Kevin Mutua | Invoicing, Receipts & Payments |
| **Ward Nurse** | `nurse` | Grace Achieng | Inpatient Wards, Bed Maps & MAR Charting |
| **Procurement** | `procurement` | Patrick Mwangi | Purchase Orders, Suppliers & Stores |
| **Accounts** | `accounts` | David Kariuki | General Ledger, Trial Balance & Revenue |
| **HR Officer** | `hr` | Mercy Nyaboke | Staff Management, Leave & Payroll |

---

## License

Private Enterprise Application for Metropolitan Referral Hospital.