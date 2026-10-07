# PUCHE MEDICAL CLINIC MANAGEMENT SYSTEM
## DEMO & DEVELOPMENT STAFF ACCOUNTS DIRECTORY

> [!WARNING]
> **DEVELOPMENT / TESTING ONLY**: These credentials are for development, QA auditing, and staging evaluation only. They MUST be changed or removed before any production deployment.

All demo accounts authenticate through the actual production authentication system using `bcrypt` password hashing against the SQLite database (`prisma/dev.db`).

---

### Standard Temporary Password for All Demo Accounts
```
Hospital2026!
```

---

## 1. Staff Credentials Matrix

| # | Hospital Role | Username | Role Key | Default Station / Dashboard | Primary Permissions & Scope |
|---|---------------|----------|----------|-----------------------------|------------------------------|
| 1 | **Administrator** | `admin` | `ADMINISTRATOR` | System Dashboard / Admin | Entire system, RBAC, user management, audit logs, system-wide overrides |
| 2 | **Receptionist** | `reception` | `RECEPTIONIST` | Front Office / Patient Registry | Patient registration, search, MRN issuance, scheme allocation, reception queue |
| 3 | **Triage Nurse** | `triage` | `TRIAGE_NURSE` | Clinical Station / Triage Queue | Vital signs recording (BP, Temp, SpO2, Pulse, Resp), BMI auto-calculation, patient routing |
| 4 | **Doctor / Clinician** | `doctor` | `DOCTOR` | Clinical Station / Consultation Queue | Clinical examination, ICD-10 diagnoses, laboratory orders, prescriptions, inpatient admission |
| 5 | **Laboratory Staff** | `laboratory` | `LABORATORY` | Clinical Station / Lab Orders | Specimen receiving, test processing, diagnostic result entry, result validation |
| 6 | **Pharmacist** | `pharmacy` | `PHARMACIST` | Clinical Station / Dispensary | Prescription queue, inventory batch management, drug dispensing, FIFO stock deductions |
| 7 | **Billing / Cashier** | `billing` | `BILLING` | Billing & Cash Office | Invoicing, payment collection (M-Pesa, Cash, SHA), receipt generation, financial ledger |
| 8 | **Nurse / Inpatient** | `nurse` | `NURSE` | Inpatient & Wards | Ward bed map, admission chart, nursing notes, Medication Administration Record (MAR), discharge |
| 9 | **Procurement Officer** | `procurement` | `PROCUREMENT` | Procurement & Stores | Departmental requisitions, purchase orders (LPOs), supplier management, stores receiving |
| 10 | **Accounts Officer** | `accounts` | `ACCOUNTS` | Accounts & Financial Ledger | Double-entry journal posting, trial balance statement, revenue accounts, cash books |
| 11 | **HR Officer** | `hr` | `HR` | Human Resources & Payroll | Medical staff directory, leave application approvals, monthly batch payroll processing |

---

## 2. How to Access and Test Roles

1. Open the application in your browser:
   ```
   http://localhost:5177/
   ```
2. If not already authenticated, the system presents the **Hospital Login Page**.
3. In the **Demo Accounts** panel on the right, click on any staff role card (e.g. *Doctor / Clinician*, *Receptionist*, or *Billing / Cashier*).
   - This automatically populates the username and default password (`Hospital2026!`).
4. Click **Authenticate & Access System**.
5. The system verifies the credentials via `POST /api/auth/login`, issues a cryptographically signed JWT with your role claim, and immediately routes you to your role's dedicated workstation:
   - Receptionist $\rightarrow$ **Front Office** (`/patients`)
   - Triage Nurse $\rightarrow$ **Clinical Station** (`/clinical`)
   - Doctor $\rightarrow$ **Clinical Station** (`/clinical`)
   - Laboratory $\rightarrow$ **Clinical Station** (`/clinical`)
   - Pharmacist $\rightarrow$ **Clinical Station** (`/clinical`)
   - Billing $\rightarrow$ **Billing & Cash** (`/billing`)
   - Nurse $\rightarrow$ **Inpatient & Wards** (`/inpatient`)
   - Procurement $\rightarrow$ **Procurement & Stores** (`/procurement`)
   - Accounts $\rightarrow$ **Accounts & Ledger** (`/accounts`)
   - HR $\rightarrow$ **Human Resources** (`/hr`)
   - Administrator $\rightarrow$ **System Dashboard** (`/dashboard`)
6. Notice the navigation sidebar dynamically filters to display **only the modules authorized for your role**.
7. Attempting to access restricted backend API routes (e.g. hitting `/api/admin` with a receptionist token) returns an HTTP `403 Forbidden` response.
8. To test a different role, click **Sign Out** in the top header or in the sidebar footer.

---

## 3. Production Hardening Checklist Before Going Live

- [ ] Change all default passwords using `PUT /api/auth/password` or an administrator reset.
- [ ] Set `NODE_ENV=production` in the environment configuration.
- [ ] Replace `JWT_SECRET` in `.env` with a 256-bit cryptographically random key.
- [ ] Migrate SQLite datasource (`prisma/dev.db`) to PostgreSQL or MySQL with connection pooling.
- [ ] Connect real Social Health Authority (SHA) credentials and API endpoints replacing the mock SHA adapter.
