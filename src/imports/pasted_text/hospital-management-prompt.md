# MASTER DEVELOPMENT PROMPT

## Hospital Patient Management, Front Office & Back Office Management System

You are a senior healthcare software architect, full-stack engineer, database architect, UI/UX designer, security engineer, and QA engineer.

Your task is to DESIGN AND DEVELOP a production-ready Hospital Management Information System (HMIS) based on the requirements below.

Do not create a superficial demo or static UI.

Build a functional, modular, secure, scalable system with a real database, authentication, role-based access control, patient workflows, queue management, billing, pharmacy, laboratory, inpatient management, procurement, HR, administration, reporting, audit trails, and architecture prepared for SHA integration.

The system should be designed so that additional hospital modules can be added progressively without rewriting the existing architecture.

---

# 1. PRIMARY OBJECTIVE

Develop a Hospital Management System covering:

## FRONT OFFICE

1. Reception
2. Triage
3. Consultation
4. Laboratory
5. Pharmacy
6. Billing
7. Nursing / Inpatient Management

## BACK OFFICE

1. Procurement
2. Accounts
3. Human Resources
4. Administration

The system must support the complete patient journey:

Reception
→ Triage
→ Consultation
→ Laboratory / Pharmacy / Billing
→ Consultation / Reception / Discharge

For admitted patients:

Reception
→ Triage
→ Consultation
→ Admission
→ Nursing / Ward
→ Laboratory / Pharmacy / Other Services
→ Discharge

---

# 2. IMPORTANT DEVELOPMENT PRINCIPLES

Follow these principles throughout development:

### DO NOT:

* Build fake buttons.
* Build static dashboards with dummy functionality.
* Hard-code patient records.
* Hard-code financial calculations.
* Hard-code user permissions.
* Store sensitive information insecurely.
* Create one enormous component/file for an entire module.
* Skip database relationships.
* Skip validation.
* Skip audit logging.
* Assume SHA integration can simply be added later without architecture preparation.
* Build the system as a collection of disconnected pages.

### DO:

* Build real CRUD operations.
* Use a proper relational database.
* Create normalized database schemas.
* Implement server-side authorization.
* Implement role-based access control.
* Validate all inputs.
* Track workflow status.
* Track patient movement between departments.
* Track financial transactions.
* Track stock movements.
* Track changes to important medical records.
* Maintain an audit trail.
* Use transactions for critical operations.
* Make the application responsive.
* Make the interface appropriate for a hospital environment.
* Design for multiple hospital departments and users.
* Build reusable components.
* Build APIs/services that can later integrate with external systems.

---

# 3. RECOMMENDED TECHNOLOGY STACK

Unless there is a strong technical reason to change it, use:

Frontend:

* Next.js
* TypeScript
* React
* Tailwind CSS
* shadcn/ui or an equivalent professional component system
* Lucide icons

Backend:

* Next.js server-side APIs / route handlers
* TypeScript

Database:

* PostgreSQL

ORM:

* Prisma

Authentication:

* Secure credential authentication
* Session-based authentication
* Role-based access control

Infrastructure:

* Docker-ready
* Environment variables for secrets
* Production-ready database configuration

Charts:

* Recharts or equivalent

PDF:

* Server-side PDF generation for invoices, receipts, reports, prescriptions, admission summaries, discharge summaries, payslips, purchase orders, etc.

The architecture must allow external API integrations.

---

# 4. SYSTEM ARCHITECTURE

Use a modular architecture.

Suggested structure:

/app
/login
/dashboard

/reception
/triage
/consultation
/laboratory
/pharmacy
/billing
/nursing
/wards

/procurement
/accounts
/hr
/admin

/patients
/reports
/settings

/components
/lib
/services
/hooks
/types
/prisma
/public

Separate:

* UI
* business logic
* database access
* authentication
* authorization
* validation
* reporting
* financial logic
* inventory logic
* integrations

Do not place business logic directly inside UI components.

---

# 5. AUTHENTICATION

Every staff member must have their own account.

Login fields:

* Username/email
* Password

Implement:

* Secure password hashing
* Session management
* Logout
* Password change
* Password reset architecture
* Account activation/deactivation
* Failed login protection
* Role-based access control
* Audit logging

Users must NOT be able to access modules they are not authorized to access.

---

# 6. USER ROLES

Create a permission system rather than simply checking job titles.

Example roles:

## ADMINISTRATOR

Full access to the entire system.

## RECEPTIONIST

Access to:

* Patient registration
* Patient search
* Reception queue
* Patient schemes
* Reception reports

## TRIAGE NURSE

Access to:

* Triage queue
* Vital signs
* Patient history relevant to triage

## DOCTOR / CLINICIAN

Access to:

* Consultation
* Patient medical records
* Diagnoses
* Complaints
* Laboratory requests
* Prescriptions
* Procedures
* Admission
* Clinical notes

## LABORATORY STAFF

Access to:

* Laboratory queue
* Laboratory requests
* Laboratory results
* Laboratory reports

## PHARMACIST

Access to:

* Pharmacy queue
* Prescriptions
* Drug dispensing
* Drug inventory requests
* Dispensing history

## CASHIER / BILLING STAFF

Access to:

* Invoices
* Payments
* Receipts
* Billing queue
* Financial reports relevant to billing

## NURSE / WARD STAFF

Access to:

* Inpatient patients
* Admission records
* Nursing records
* Drug charts
* Diagnoses
* Discharge preparation

## PROCUREMENT STAFF

Access to:

* Requisitions
* Purchase orders
* LPOs
* Stores
* Stock receiving
* Stock issuing
* Stock taking

## ACCOUNTS STAFF

Access to:

* Financial reports
* Revenue reports
* Cash books
* Trial balance
* Accounting functions

## HR STAFF

Access to:

* Staff
* Payroll
* Payslips
* Leave

Use granular permissions such as:

patients.view
patients.create
patients.edit

consultation.view
consultation.create
consultation.edit

laboratory.request
laboratory.results
laboratory.reports

pharmacy.dispense
pharmacy.inventory

billing.invoice
billing.payment
billing.reports

etc.

---

# 7. PATIENT MASTER RECORD

Create a unique patient record.

Each patient should have:

* Patient ID / MRN
* Full name
* National ID number
* Date of birth
* Gender
* Phone number
* Occupation
* Residence
* Next of kin name
* Next of kin relationship
* Next of kin phone
* Next of kin alternative contact
* Registration date
* Patient status
* Scheme/payment method

Support:

* SHA
* Cash
* Future insurance schemes

Do not design the system around only one payment scheme.

Create a configurable payer/scheme structure.

---

# 8. RECEPTION MODULE

Reception must allow staff to:

### Register Patient

Capture:

* Patient ID / automatically generated MRN
* Full name
* DOB
* Gender
* Phone
* National ID
* Occupation
* Residence
* Next of kin
* Next-of-kin relationship
* Next-of-kin contact

Assign:

* Payment scheme
* SHA / Cash / Insurance/etc.

After registration:

Create an encounter/visit.

Generate a queue number.

Queue patient to:

TRIAGE

Reception dashboard should show:

* Patients registered today
* Waiting patients
* Patients sent to triage
* Patients currently in consultation
* Completed visits
* Outstanding payments

Include patient search.

Search by:

* MRN
* Name
* ID number
* Phone number

---

# 9. RECEPTION REPORTS

Generate:

* Daily patient registration report
* Patient attendance report
* Patients by payment scheme
* Patients by gender
* Patients by age group
* Daily visit statistics

Allow:

* Date filtering
* Department filtering
* Scheme filtering
* Export to PDF
* Export to Excel/CSV where appropriate

---

# 10. TRIAGE MODULE

Triage receives patients from the reception queue.

Record:

* Temperature
* Weight
* Height
* Blood pressure
* Pulse rate if appropriate
* Respiratory rate if appropriate
* Oxygen saturation if appropriate
* BMI automatically calculated where applicable
* Triage notes

Record:

* Triage staff
* Date/time
* Encounter

After triage:

Queue patient to CONSULTATION.

Display:

* Waiting queue
* In-progress patients
* Completed triage

---

# 11. CONSULTATION MODULE

Consultation is the primary clinical workflow.

Doctor/clinician should see:

* Patient demographics
* Previous visits
* Previous diagnoses
* Previous laboratory results
* Previous prescriptions
* Current triage information
* Current encounter

Allow recording:

## Chief complaint

## History / clinical notes

## Diagnosis

Support multiple diagnoses.

Use diagnosis codes where practical.

## Laboratory requests

Doctor can order:

* Individual laboratory tests
* Test panels

Laboratory request must contain:

* Patient
* Encounter
* Ordering clinician
* Requested tests
* Priority
* Date/time
* Clinical notes

## Prescription

Doctor can prescribe:

* Drug
* Dosage
* Frequency
* Route
* Duration
* Quantity
* Instructions

## Procedures

Record:

* Procedure
* Quantity
* Notes
* Date/time
* Clinician

## Admission

Doctor can initiate admission.

Admission should include:

* Ward
* Bed
* Admission reason
* Admission diagnosis
* Admission date/time
* Attending clinician
* Admission notes

Once admitted, patient becomes an inpatient.

## Consultation routing

Doctor must be able to queue patient to:

* Laboratory
* Pharmacy
* Billing
* Reception
* Back to consultation
* Nursing / Ward if admitted

Do not allow invalid workflow transitions.

---

# 12. LABORATORY MODULE

Laboratory receives requests from consultation.

Laboratory dashboard:

* Waiting requests
* In-progress tests
* Completed tests
* Urgent requests

Allow staff to:

* Receive patient
* View requested tests
* Add tests
* Remove/cancel tests where authorized
* Enter results
* Add comments
* Mark test completed
* Validate results

Each result should record:

* Test
* Result
* Units
* Reference range where applicable
* Abnormal flag
* Technician
* Date/time
* Verification status

After completion:

Queue patient back to CONSULTATION.

For inpatients:

Laboratory must allow ward patients to be received directly for requested tests.

---

# 13. LABORATORY REPORTS

Generate:

* Daily laboratory report
* Monthly laboratory report
* Tests performed
* Tests pending
* Tests by category
* Abnormal results
* Revenue from laboratory services if applicable

Allow:

* Date range
* Test filtering
* PDF
* Excel/CSV export

---

# 14. PHARMACY MODULE

Pharmacy receives prescriptions from consultation.

Display:

* Patient
* MRN
* Prescription
* Drug
* Dose
* Frequency
* Duration
* Quantity
* Prescribing clinician

Pharmacist can:

* Dispense medication
* Adjust dispensed quantity where allowed
* Record batch number
* Record expiry date
* Record dispenser
* Add dispensing notes

Inventory must be checked before dispensing.

Do not allow dispensing stock that does not exist.

Do not allow stock to become negative.

After dispensing:

Finalize prescription.

Queue patient to:

* Consultation
  OR
* Billing

depending on workflow.

---

# 15. DRUG STORE / PHARMACY INVENTORY

Create drug inventory support.

Track:

* Drug name
* Generic name
* Category
* Unit
* Batch
* Expiry date
* Quantity
* Reorder level
* Supplier
* Purchase price
* Selling price where applicable

Track stock movements:

* Receiving
* Issuing
* Dispensing
* Adjustments
* Returns
* Transfers

Maintain an immutable stock movement history.

---

# 16. BILLING MODULE

Billing must support:

* Invoice generation
* Cash receipts
* Payments
* Outstanding balances
* Payment scheme
* Services
* Laboratory charges
* Procedures
* Consultation charges
* Drugs
* Other hospital services

Invoice fields:

* Invoice number
* Patient
* Encounter
* Date
* Items
* Quantity
* Unit price
* Total
* Discounts if authorized
* Amount paid
* Balance
* Payment method
* Scheme

Payment methods should be configurable.

Examples:

* Cash
* M-Pesa
* Bank
* Insurance/SHA
* Other

Generate printable:

* Invoice
* Receipt
* Payment statement

---

# 17. BILLING REPORTS

Generate:

* Daily revenue
* Monthly revenue
* Revenue by department
* Revenue by payment method
* Revenue by scheme
* Outstanding balances
* Daily cash collection
* Refunds
* Discounts

Reports must use real database data.

---

# 18. NURSING / INPATIENT MODULE

This module manages admitted patients.

Admission begins in CONSULTATION.

Once admitted, patient appears in the ward/nursing dashboard.

Display:

* Patient name
* MRN
* Ward
* Bed
* Admission date
* Diagnosis
* Attending clinician
* Length of stay

Create:

## Admission Summary

Include the fields provided in the nursing sample that will be supplied later.

## Drug Chart

Nurses should be able to record medication administration.

Track:

* Drug
* Dose
* Route
* Frequency
* Scheduled time
* Administered time
* Nurse
* Status
* Notes

Do not allow nurses to modify the original prescription without authorization.

## Nursing Notes

Allow timestamped nursing notes.

## Diagnosis

Authorized staff can add/update diagnoses according to permissions.

## Drugs

Allow authorized staff to request/add drugs for an inpatient.

## Laboratory

Inpatients should be able to receive laboratory requests.

## Discharge Summary

Include the fields from the supplied sample.

## Discharge

Discharge should record:

* Discharge date/time
* Discharge diagnosis
* Clinical summary
* Medications
* Follow-up instructions
* Attending clinician
* Discharge status

Once discharged:

* Close admission
* Update bed availability
* Generate discharge summary
* Update billing
* Preserve complete medical history

---

# 19. WARD AND BED MANAGEMENT

Create:

* Wards
* Rooms
* Beds

Bed statuses:

* Available
* Occupied
* Reserved
* Maintenance

When admission occurs:

Bed becomes occupied.

When discharge occurs:

Bed becomes available.

Prevent two patients from occupying the same bed.

---

# 20. PROCUREMENT MODULE

Build progressively but establish the architecture now.

Procurement must support:

### Requisitions

* Requisition number
* Requesting department
* Requested items
* Quantity
* Reason
* Requesting user
* Date
* Approval status

### Purchase Orders

* PO number
* Supplier
* Items
* Quantity
* Unit price
* Total
* Delivery information
* Approval status

### LPO

Support Local Purchase Orders.

### Stores

Support:

* Main store
* Pharmacy store
* Other stores

Make storage locations configurable.

### Receiving

Record:

* Supplier
* Delivery
* Items
* Quantity
* Batch
* Expiry
* Date
* Receiving officer

### Issuing

Record:

* Store
* Requesting department
* Items
* Quantity
* Issuing officer
* Receiving officer

### Stock Taking

Create stock-taking sessions.

Compare:

System quantity
vs
Physical quantity

Record discrepancies.

---

# 21. ACCOUNTS MODULE

This module will be developed progressively.

However, design the database architecture to support:

* Chart of accounts
* Journal entries
* General ledger
* Trial balance
* Cash books
* Revenue
* Expenses
* Accounts payable
* Accounts receivable

Reports:

* Financial reports
* Revenue reports
* Trial balance
* Cash books

Every financial transaction should have traceability.

Do not fake accounting calculations.

Use proper double-entry accounting architecture when this module is implemented.

---

# 22. HUMAN RESOURCE MODULE

Create:

## Staff

Fields:

* Employee ID
* Full name
* Department
* Position
* Phone
* Email
* Employment date
* Employment status
* Salary structure
* User account relationship

## Payroll

Support:

* Basic salary
* Allowances
* Deductions
* Gross salary
* Net salary
* Payroll period

## Payslips

Generate printable/downloadable payslips.

## Leave

Employees should be able to submit leave applications.

HR can:

* Review
* Approve
* Reject
* Track leave balances

Create leave types.

---

# 23. ADMINISTRATION MODULE

Administrator must be able to access the entire system.

Admin dashboard should include:

* Users
* Roles
* Permissions
* Departments
* Services
* Schemes
* Payment methods
* Wards
* Beds
* Laboratory tests
* Drugs
* Suppliers
* Stores
* Hospital settings

Admin should be able to:

* Create users
* Disable users
* Reset passwords
* Assign roles
* Configure permissions
* Configure hospital information
* Configure pricing
* Configure services
* Configure departments

---

# 24. SHA INTEGRATION — HIGH PRIORITY

SHA readiness is a PRIMARY requirement.

Do not build SHA as a simple payment option.

Create an integration layer that separates external SHA communication from the core application.

Architecture should include:

/services/integrations/sha

Create interfaces/services such as:

* SHA eligibility verification
* Member/patient identification
* Claim preparation
* Claim submission
* Claim status
* Claim response
* Claim reconciliation

Do not invent undocumented SHA API endpoints.

Where official API credentials/specifications are unavailable:

* Build the integration interface
* Build configuration/environment variables
* Build mock/test adapters
* Build request/response models
* Build logging
* Build retry handling
* Build status tracking
* Clearly mark actual external API calls as pending official credentials/specification

The system must be ready for actual SHA integration without restructuring the database.

Store:

* SHA member/reference information
* Eligibility status
* Claim reference
* Claim status
* Submission date
* Response date
* Rejection reason
* Reconciliation status

Do not store unnecessary sensitive data.

Use environment variables for credentials.

---

# 25. PATIENT QUEUE SYSTEM

Create a central queue engine.

Every workflow transition should create a queue event.

Example:

Reception
→ TRIAGE

Triage
→ CONSULTATION

Consultation
→ LABORATORY

Laboratory
→ CONSULTATION

Consultation
→ PHARMACY

Pharmacy
→ BILLING

Billing
→ RECEPTION / EXIT

Consultation
→ NURSING / WARD

The queue should record:

* Patient
* Encounter
* Source department
* Destination department
* Queue number
* Priority
* Status
* Created time
* Called time
* Started time
* Completed time
* User

Statuses:

WAITING
CALLED
IN_PROGRESS
COMPLETED
CANCELLED

Implement queue dashboards for each department.

---

# 26. PATIENT ENCOUNTERS

Do NOT treat a patient and a visit as the same entity.

A patient can have many encounters.

Create:

Patient
↓
Encounter
↓
Clinical workflow

Example:

Patient:
P000123

Encounter:
ENC-2026-00045

Within that encounter:

Reception
→ Triage
→ Consultation
→ Lab
→ Consultation
→ Pharmacy
→ Billing

Preserve historical encounters.

---

# 27. AUDIT LOGGING

Implement comprehensive audit logs.

Record:

* User
* Action
* Module
* Record/entity
* Record ID
* Timestamp
* IP/device metadata where appropriate
* Before value where appropriate
* After value where appropriate

Audit sensitive actions including:

* Patient record changes
* Diagnosis changes
* Prescription changes
* Laboratory result changes
* Billing changes
* Payment changes
* Stock adjustments
* User permission changes
* Admission/discharge
* SHA submissions
* Financial transactions

Audit logs must not be casually editable/deletable by ordinary users.

---

# 28. DATABASE DESIGN

Create a robust relational PostgreSQL schema.

At minimum, consider entities such as:

User
Role
Permission
RolePermission
UserRole

Patient
PatientContact
PatientScheme
Encounter

Queue
QueueEvent

Triage
VitalSigns

Consultation
ClinicalNote
Diagnosis
Procedure

LaboratoryTest
LaboratoryOrder
LaboratoryOrderItem
LaboratoryResult

Drug
DrugCategory
DrugBatch
Prescription
PrescriptionItem
Dispensing

Ward
Room
Bed
Admission
NursingNote
DrugAdministration
Discharge

Service
PriceList
Invoice
InvoiceItem
Payment
Receipt

Supplier
Store
StockItem
StockMovement
StockTake
StockTakeItem

Requisition
PurchaseOrder
PurchaseOrderItem
LPO

Employee
Payroll
Payslip
LeaveApplication
LeaveType

Account
Journal
JournalEntry
CashBook

PayerScheme
SHARecord
SHAClaim

AuditLog

HospitalSettings

Use appropriate foreign keys, indexes, unique constraints, timestamps, and transaction handling.

---

# 29. DASHBOARD

Create role-specific dashboards.

Administrator:

* Total patients
* Today's patients
* Current queues
* Admissions
* Discharges
* Revenue
* Outstanding payments
* Laboratory workload
* Pharmacy workload
* Inventory alerts
* Staff activity

Reception:

* Today's registrations
* Waiting triage
* Current queues

Doctor:

* Consultation queue
* Patients seen
* Pending laboratory results
* Admitted patients

Laboratory:

* Pending requests
* Completed tests
* Urgent tests

Pharmacy:

* Pending prescriptions
* Dispensed today
* Low stock
* Expiring drugs

Billing:

* Pending bills
* Today's collections
* Outstanding balances

Nursing:

* Current inpatients
* Available beds
* Medication schedules
* Pending tasks

---

# 30. UI/UX REQUIREMENTS

The interface should look like a modern professional hospital information system.

Do NOT make it look like an AI-generated template.

Design principles:

* Clean
* Professional
* Clinical
* Fast
* Accessible
* Information-dense without being cluttered
* Responsive
* Desktop-first but mobile/tablet compatible

Use:

* Sidebar navigation
* Top navigation
* Breadcrumbs
* Data tables
* Search
* Filters
* Tabs
* Status badges
* Modal/dialog forms
* Confirmation dialogs
* Toast notifications
* Empty states
* Loading states
* Skeleton states

Use consistent:

* Typography
* Spacing
* Form controls
* Buttons
* Tables
* Cards
* Alerts
* Status indicators

Prioritize speed of use because staff will use the system repeatedly throughout the day.

---

# 31. PATIENT PROFILE

Create a central patient profile.

Header:

Patient name
MRN
Age
Gender
Phone
Scheme
Current status

Tabs:

Overview
Visits
Clinical Notes
Diagnoses
Laboratory
Prescriptions
Medications
Billing
Admissions
Documents
Audit/History where authorized

Show relevant information based on staff permissions.

---

# 32. SEARCH

Global patient search should support:

* MRN
* Name
* National ID
* Phone

Results should show:

* Patient
* MRN
* DOB/Age
* Gender
* Phone
* Scheme
* Last visit
* Current status

Do not expose sensitive medical information to unauthorized users.

---

# 33. REPORTING ENGINE

Create reusable reporting infrastructure.

Every major module should support:

* Date range
* Department
* Status
* User
* Scheme
* Other relevant filters

Reports should support:

* On-screen preview
* PDF
* CSV/Excel where appropriate
* Printing

Reports should be generated from actual database queries.

---

# 34. VALIDATION

Use strong validation on both client and server.

Validate:

* Required fields
* Dates
* Phone numbers
* Numeric fields
* Quantities
* Prices
* Duplicate patients
* Invalid workflow transitions
* Duplicate payments
* Negative stock
* Invalid admission/discharge
* Invalid permissions

Use a schema validation library such as Zod.

Never trust client-side validation alone.

---

# 35. SECURITY

Treat this as a healthcare application.

Implement:

* Password hashing
* RBAC
* Server-side authorization
* Input validation
* SQL injection protection through ORM
* XSS protection
* CSRF protection where applicable
* Secure cookies
* Rate limiting for authentication and sensitive endpoints
* Secure headers
* Environment variables for secrets
* No API keys in frontend code
* Audit logging
* Database backups architecture
* Error handling without leaking sensitive information

Do not expose patient medical data through public APIs.

---

# 36. DATA PRIVACY

Patient information is sensitive.

Apply:

* Least privilege
* Minimum necessary access
* Role-based visibility
* Audit trails
* Secure sessions
* Secure API design

Do not expose patient data in logs unnecessarily.

Do not use real patient data during development.

Create seed/demo data that is clearly fictional.

---

# 37. NOTIFICATIONS

Create notification infrastructure.

Examples:

* New patient in queue
* Laboratory result ready
* Prescription ready
* Payment required
* Low drug stock
* Expiring drug
* New admission
* Discharge pending
* Leave application pending
* Procurement approval pending

Support in-app notifications first.

Design the architecture so SMS/email/WhatsApp notifications can be added later.

---

# 38. API DESIGN

Create clean APIs/services for:

* Authentication
* Patients
* Encounters
* Queue
* Triage
* Consultation
* Laboratory
* Pharmacy
* Billing
* Inpatient
* Procurement
* HR
* Accounts
* SHA
* Reports
* Administration

Use consistent response structures.

Handle:

* Authentication
* Authorization
* Validation errors
* Not found
* Conflict
* Server errors

---

# 39. TRANSACTIONAL INTEGRITY

Critical operations must use database transactions.

Examples:

### Payment

Payment
+
Invoice update
+
Receipt generation/status

must remain consistent.

### Dispensing

Prescription
+
Stock deduction
+
Dispensing record

must remain consistent.

### Admission

Admission
+
Bed assignment
+
Bed status

must remain consistent.

### Discharge

Discharge
+
Admission closure
+
Bed release
+
Billing status

must remain consistent.

### Stock receiving

Purchase/delivery
+
Stock increase
+
Stock movement

must remain consistent.

---

# 40. SEED DATA

Create development seed data.

Include:

* Admin account
* Reception account
* Nurse account
* Doctor account
* Laboratory account
* Pharmacy account
* Billing account
* Procurement account
* HR account
* Accounts account

Create fictional:

* Patients
* Doctors
* Nurses
* Drugs
* Laboratory tests
* Services
* Wards
* Beds
* Suppliers
* Payment schemes

Clearly label all seed data as DEMO/TEST data.

---

# 41. ERROR HANDLING

Create professional error states.

Examples:

"No patients found."

"No patients are currently waiting for triage."

"Laboratory results are not yet available."

"Insufficient stock."

"You do not have permission to perform this action."

"Payment could not be completed."

"Patient is already admitted."

"Bed is currently occupied."

Never display raw database errors to users.

---

# 42. LOADING STATES

Every asynchronous page/action should have:

* Loading indicators
* Skeletons where appropriate
* Disabled submit buttons during processing
* Success notifications
* Error notifications

Prevent duplicate submissions.

---

# 43. DOCUMENT GENERATION

Implement printable/downloadable documents for:

* Patient registration summary
* Laboratory report
* Prescription
* Invoice
* Cash receipt
* Payment statement
* Admission summary
* Drug chart where appropriate
* Discharge summary
* Purchase order
* LPO
* Payslip
* Financial reports

Use hospital branding/configuration.

---

# 44. CONFIGURATION

Hospital settings should be configurable.

Examples:

* Hospital name
* Logo
* Address
* Phone
* Email
* Registration details
* Invoice prefix
* Receipt prefix
* Patient ID/MRN format
* Currency
* Departments
* Services
* Pricing
* Payment methods

Do not hard-code hospital-specific information.

---

# 45. WORKFLOW RULES

Implement workflow state machines rather than arbitrary page navigation.

Example:

Reception:

REGISTERED
→ WAITING_TRIAGE

Triage:

WAITING_TRIAGE
→ TRIAGE_IN_PROGRESS
→ WAITING_CONSULTATION

Consultation:

WAITING_CONSULTATION
→ CONSULTATION_IN_PROGRESS

Then:

→ WAITING_LAB
→ WAITING_PHARMACY
→ WAITING_BILLING
→ ADMITTED
→ COMPLETED

Laboratory:

WAITING_LAB
→ LAB_IN_PROGRESS
→ LAB_COMPLETED
→ WAITING_CONSULTATION

Pharmacy:

WAITING_PHARMACY
→ DISPENSING
→ DISPENSED

Billing:

WAITING_BILLING
→ BILL_CREATED
→ PAYMENT_PENDING
→ PAID
→ COMPLETED

Prevent invalid transitions.

---

# 46. DEVELOPMENT PHASES

Do NOT attempt to build everything as one giant task.

Develop in phases.

## PHASE 1 — FOUNDATION

Build:

* Project architecture
* PostgreSQL
* Prisma
* Authentication
* Users
* Roles
* Permissions
* Hospital settings
* Audit logging
* Base UI system

Make sure the application runs correctly.

---

## PHASE 2 — PATIENT & RECEPTION

Build:

* Patient registration
* Patient search
* Patient profile
* Encounters
* Reception
* Patient schemes
* Queue system
* Reception reports

Test completely before moving forward.

---

## PHASE 3 — TRIAGE

Build:

* Triage queue
* Vital signs
* Triage records
* Consultation queue

Test complete:

Reception → Triage → Consultation

workflow.

---

## PHASE 4 — CONSULTATION

Build:

* Clinical notes
* Complaints
* Diagnosis
* Procedures
* Laboratory requests
* Prescriptions
* Admission
* Workflow routing

Test all routing options.

---

## PHASE 5 — LABORATORY

Build:

* Test catalog
* Lab orders
* Results
* Validation
* Reports
* Inpatient laboratory requests

Test:

Consultation → Laboratory → Consultation

---

## PHASE 6 — PHARMACY

Build:

* Drug catalog
* Inventory
* Batches
* Expiry
* Prescriptions
* Dispensing
* Stock movements
* Reports

Test:

Consultation → Pharmacy → Billing/Consultation

---

## PHASE 7 — BILLING

Build:

* Services
* Pricing
* Invoices
* Payments
* Receipts
* Financial reports

Test complete outpatient billing workflow.

---

## PHASE 8 — INPATIENT

Build:

* Wards
* Rooms
* Beds
* Admission
* Nursing
* Drug chart
* Nursing notes
* Laboratory
* Pharmacy
* Discharge

Use the nursing sample that will be supplied as the reference for required fields.

---

## PHASE 9 — SHA

Implement:

* SHA data model
* Eligibility interface
* Claims
* Claim status
* Claim tracking
* Reconciliation
* Integration adapter

Actual API implementation must use official SHA documentation/credentials when available.

---

## PHASE 10 — PROCUREMENT

Build:

* Requisitions
* Suppliers
* Purchase orders
* LPOs
* Stores
* Receiving
* Issuing
* Stock taking

---

## PHASE 11 — HR

Build:

* Employees
* Payroll
* Payslips
* Leave

---

## PHASE 12 — ACCOUNTS

Build progressively:

* Chart of accounts
* Journals
* General ledger
* Cash books
* Trial balance
* Revenue
* Financial reports

Use proper accounting principles.

---

## PHASE 13 — ADMINISTRATION

Build complete:

* User management
* Permissions
* Configuration
* System settings
* Audit logs
* Master data management

---

# 47. TESTING

Create automated tests for important business logic.

Test:

Authentication
RBAC
Patient registration
Duplicate patient detection
Queue transitions
Triage
Consultation
Lab orders
Lab results
Prescription
Dispensing
Stock deductions
Billing
Payments
Admission
Bed allocation
Discharge
Procurement
Payroll
Leave
SHA workflow

Also create integration tests for critical workflows.

---

# 48. END-TO-END TEST SCENARIO

Create an automated test for this scenario:

1. Reception registers patient.
2. Patient is assigned SHA/Cash scheme.
3. Patient enters triage queue.
4. Nurse records vital signs.
5. Patient enters consultation.
6. Doctor records complaint.
7. Doctor records diagnosis.
8. Doctor orders laboratory test.
9. Patient enters laboratory.
10. Lab technician records result.
11. Patient returns to consultation.
12. Doctor reviews result.
13. Doctor creates prescription.
14. Patient enters pharmacy.
15. Pharmacist dispenses drug.
16. Inventory decreases.
17. Patient enters billing.
18. Invoice is generated.
19. Payment is recorded.
20. Receipt is generated.
21. Visit is completed.

Create another scenario:

1. Patient registers.
2. Triage.
3. Consultation.
4. Doctor admits patient.
5. Ward/bed assigned.
6. Nurse sees patient.
7. Drug chart created.
8. Medication administered.
9. Lab test requested.
10. Lab processes test.
11. Result returns.
12. Doctor reviews result.
13. Patient discharged.
14. Bed becomes available.
15. Discharge summary generated.
16. Billing finalized.

Both workflows must work end-to-end.

---

# 49. PERFORMANCE

Optimize for hospital environments.

Use:

* Database indexes
* Pagination
* Server-side filtering
* Efficient queries
* Lazy loading where appropriate
* Caching where appropriate
* Debounced search
* Avoid unnecessary API requests

Large patient lists must not load thousands of records at once.

---

# 50. DEPLOYMENT READINESS

Prepare for production deployment.

Include:

* .env.example
* Database migration scripts
* Seed scripts
* Docker support
* Production build
* Error logging architecture
* Database backup strategy
* Environment configuration
* Secure secret management

Never commit:

* API keys
* passwords
* database credentials
* SHA credentials
* production secrets

---

# 51. DOCUMENTATION

Create:

README.md

ARCHITECTURE.md

DATABASE.md

API.md

AUTHORIZATION.md

DEPLOYMENT.md

SHA-INTEGRATION.md

TESTING.md

USER-GUIDE.md

Document:

* Installation
* Environment variables
* Database setup
* Migrations
* Seeding
* User roles
* Permissions
* API structure
* Deployment
* SHA integration
* Backup strategy
* Testing

---

# 52. DEFINITION OF DONE

A module is NOT considered complete merely because its page exists.

A module is complete only when:

* UI exists
* Database exists
* API/service exists
* Validation exists
* Authorization exists
* Business logic exists
* Error handling exists
* Loading states exist
* Audit logging exists where applicable
* Reports exist where required
* Data persists correctly
* Related workflows work
* Tests pass

---

# 53. FINAL QUALITY REQUIREMENT

Before declaring the project complete, perform a full system audit.

Check:

### FUNCTIONALITY

Every button works.

### DATABASE

All relationships are correct.

### SECURITY

Unauthorized users cannot access restricted modules.

### WORKFLOW

Patients can move correctly through departments.

### FINANCE

No duplicate payments or inconsistent invoices.

### INVENTORY

No negative stock or inconsistent stock movements.

### MEDICAL DATA

Clinical information is protected and auditable.

### SHA

Integration architecture is ready and clearly documented.

### UI

No broken layouts, placeholder content, fake statistics, or unfinished screens.

### PERFORMANCE

Large data sets remain usable.

### TESTING

Critical workflows pass end-to-end.

---

# 54. HOW YOU SHOULD WORK

Work like a senior engineering team rather than generating the entire application blindly in one response.

First:

1. Analyze the requirements.
2. Identify ambiguities and risks.
3. Propose the architecture.
4. Define the database schema.
5. Define roles and permissions.
6. Define workflow states.
7. Define API/service boundaries.
8. Create the project foundation.

Then implement one phase at a time.

After each phase:

1. Run the application.
2. Run TypeScript checks.
3. Run linting.
4. Run database migrations.
5. Run tests.
6. Fix errors.
7. Verify the workflow manually.
8. Only then proceed to the next phase.

Do not move forward while critical errors remain.

---

# 55. IMPORTANT: DO NOT FAKE SHA

SHA integration is a priority.

However, do NOT invent API endpoints, credentials, request formats, claim formats, or eligibility APIs.

If official SHA integration documentation is not available in the development environment:

Build the complete integration architecture and mock adapter, clearly separating it from the production adapter.

The final implementation must allow official SHA API details to be plugged in without redesigning the system.

---

# 56. IMPORTANT: NURSING SAMPLE

A sample for the Nursing/Inpatient module will be provided separately.

When the sample is provided:

* Inspect it carefully.
* Identify every required field.
* Identify the intended workflow.
* Reproduce the required information architecture.
* Add missing database fields where necessary.
* Do not arbitrarily remove fields.
* Do not change clinical terminology without justification.
* Preserve the sample's required admission summary, drug chart, and discharge summary structure.

Use the sample as the source of truth for those specific screens while maintaining the overall system architecture described above.

---

# 57. START NOW

Start by producing:

1. System architecture
2. Module architecture
3. Database ERD/schema proposal
4. Roles and permission matrix
5. Patient workflow state machine
6. API architecture
7. Folder structure
8. Development roadmap
9. Security architecture
10. SHA integration architecture

Then begin PHASE 1 implementation.

Do not merely explain what you would build.

Create the actual project and code.

Every subsequent phase must integrate with the existing implementation rather than creating disconnected prototypes.

The final product should be a professional, scalable Hospital Management Information System suitable for real-world deployment after appropriate clinical, regulatory, security, infrastructure, and SHA integration validation.
