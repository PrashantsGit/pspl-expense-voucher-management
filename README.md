# Expense Voucher Management System (PSPL)

Full Stack Developer Internship Assignment Implementation for **Prachay Securities Private Limited (PSPL)**.

A modern, secure web application designed to digitize corporate expense voucher creation, digital signature verification, multi-tiered approvals, and accounts reimbursement tracking.

---

## 1. System Architecture & Tech Stack

### Backend
- **Framework:** Spring Boot 3.4.3 (Java 17 LTS)
- **Build Tool:** Maven with bundled Maven Wrapper (`mvnw.cmd` / `./mvnw`)
- **Security:** Spring Security 6, JWT Authentication (`io.jsonwebtoken:jjwt 0.12.6`), BCrypt password hashing
- **Data Persistence:** Spring Data JPA / Hibernate ORM with MySQL Dialect
- **Validation:** Jakarta Bean Validation (`spring-boot-starter-validation`)
- **File Upload:** Multipart image upload with strict MIME verification (`PNG`, `JPEG`, `WebP`), file size cap (5MB), UUID sanitized paths, and private token-authenticated file streaming

### Frontend
- **Framework:** React 19 with Vite 8 (JavaScript ES6+)
- **Routing:** React Router v7 (`react-router-dom`) with role-based protected routes
- **UI & Styling:** Bootstrap 5.3 & Bootstrap Icons
- **HTTP Client:** Axios with JWT bearer interceptors and automatic 401 redirect handling
- **Special Features:** Printable voucher formatting (`@media print`), search and multi-parameter filtering, interactive quick-login switcher

### Database
- **Engine:** MySQL Server 8.0+
- **Schema Management:** Automated JPA entity schema updates with accompanying explicit `schema.sql` migration script

---

## 2. Project Directory Structure

```
Prachay/
├── backend/
│   ├── .mvn/wrapper/                 # Bundled Maven Wrapper
│   ├── src/main/java/com/prachay/voucher/
│   │   ├── config/                  # Security, Web & Data Initialization
│   │   ├── controller/              # Auth, Employee, Director, Accounts, Common APIs
│   │   ├── dto/                     # Request/Response Data Transfer Objects
│   │   ├── entity/                  # JPA Entities (User, Voucher, Enums)
│   │   ├── exception/               # GlobalExceptionHandler and Custom Exceptions
│   │   ├── repository/              # Spring Data JPA Repositories & Specifications
│   │   ├── security/                # JWT Token Provider, Filters, UserDetails
│   │   └── service/                 # Business Logic, Signatures, Dashboards
│   ├── src/main/resources/
│   │   └── application.properties   # Externalized configuration with environment variable support
│   ├── mvnw & mvnw.cmd              # Maven execution scripts
│   └── pom.xml                      # Project dependencies & build lifecycle
├── frontend/
│   ├── src/
│   │   ├── components/              # Navbar, ProtectedRoute, StatusBadge, FilterBar, SignatureViewer
│   │   ├── context/                 # AuthContext (JWT session management)
│   │   ├── pages/
│   │   │   ├── employee/            # Employee Dashboard, My Vouchers, VoucherForm
│   │   │   ├── director/            # Director Dashboard, Pending Approvals, All Vouchers
│   │   │   ├── accounts/            # Accounts Dashboard, All Vouchers & Reimbursement
│   │   │   ├── common/              # Universal Voucher Detail View (Printable)
│   │   │   ├── Login.jsx            # Authentication page with demo quick-buttons
│   │   │   └── NotFound.jsx         # 404 handler
│   │   ├── services/api.js          # Axios API client functions
│   │   ├── App.jsx                  # Main router configuration
│   │   └── main.jsx                 # Entrypoint with Bootstrap imports
│   ├── package.json
│   └── vite.config.js               # Dev server with proxy to backend port 8080
├── schema.sql                       # Complete MySQL schema DDL
├── .env.example                     # Environment template
├── .gitignore
└── README.md                        # Documentation & setup guide
```

---

## 3. Database Setup

### Step 1: Ensure MySQL is Running
Confirm MySQL Server 8.0 is running on port `3306`.

### Step 2: Create Application Database
Log in to MySQL (via CLI or MySQL Workbench) and run:
```sql
CREATE DATABASE IF NOT EXISTS prachay_db
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;
```

Alternatively, execute the provided `schema.sql` script directly:
```bash
mysql -u root -p prachay_db < schema.sql
```

---

## 4. Environment Variables Configuration

Configure the application by creating a `.env` file in the project root or exporting the following environment variables in your terminal/deployment container (a sanitized template is provided in `.env.example`):

| Variable | Description | Default / Required |
| :--- | :--- | :--- |
| `SPRING_DATASOURCE_URL` | JDBC Connection String | `jdbc:mysql://localhost:3306/prachay_db?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC` |
| `SPRING_DATASOURCE_USERNAME` | MySQL Database Username | `root` |
| `SPRING_DATASOURCE_PASSWORD` | MySQL Database Password | **Required** (no fallback password) |
| `SERVER_PORT` | Spring Boot HTTP Port | `8080` |
| `APP_UPLOAD_DIR` | Local Directory for Signature Storage | `uploads/signatures` |
| `APP_SEED_DEMO_DATA` | Enable demo users and sample vouchers | `true` (set `false` in production) |
| `JWT_SECRET` | 256-bit or stronger signing key | **Required** (no fallback secret) |
| `JWT_EXPIRATION_MS` | JWT Validity in Milliseconds | `86400000` (24 Hours) |
| `VITE_API_BASE_URL` | Frontend API Proxy Target | `/api` |

> **Important:** If `JWT_SECRET` is missing or fewer than 256 bits (32 bytes), the application will fail startup with a configuration error. Generate a cryptographically secure secret before starting:
> ```bash
> # Linux / macOS / Git Bash:
> openssl rand -base64 32
> 
> # Windows PowerShell:
> [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
> ```

---

## 5. Running the Application

### Step 1: Start the Backend (Spring Boot 3)
Export your local environment variables or pass them to Maven:

```bash
# On Windows (PowerShell):
$env:SPRING_DATASOURCE_PASSWORD="your_mysql_password"
$env:JWT_SECRET="your_generated_256_bit_secret"
cd backend
.\mvnw.cmd spring-boot:run

# On Linux / macOS:
export SPRING_DATASOURCE_PASSWORD="your_mysql_password"
export JWT_SECRET="your_generated_256_bit_secret"
cd backend
./mvnw spring-boot:run
```

*The backend will initialize the database schema, and (when demo data is enabled) seed sample accounts and initial vouchers for evaluation.*

### Step 2: Start the Frontend (React + Vite)
In a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
Open your browser at **`http://localhost:5173`**.

---

## 6. Evaluation Demo Accounts & Production Security

### Default Evaluation Credentials
For reviewer convenience during internship evaluation, the application seeds four sample accounts with BCrypt-hashed passwords when `APP_SEED_DEMO_DATA=true` (and not running under `prod` profile):

| Role | Username | Password | Full Name | Department | Responsibilities |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Employee 1** | `employee1` | `password123` | Rahul Sharma | Technology | Create, edit drafts, upload signature, submit claims |
| **Employee 2** | `employee2` | `password123` | Priya Patel | Marketing | Create claims, review personal rejection reasons |
| **Director (Admin)** | `director` | `password123` | Vikram Malhotra | Executive Management | Review pending approvals, upload director signature, reject with remarks |
| **Accounts Team** | `accounts` | `password123` | Anjali Gupta | Finance & Accounts | Monitor all vouchers, audit signatures, print vouchers |

> *Tip: The login page includes quick-fill demo buttons to streamline evaluation across multiple roles without manual typing.*

### Production Deployment Security Checklist
Before deploying this application to a production environment:
1. **Disable Demo Seeding:** Set `APP_SEED_DEMO_DATA=false` and/or activate the production profile (`-Dspring.profiles.active=prod`). This completely prevents the `DataInitializer` from running.
2. **Remove Demo Accounts:** If the database was initialized during evaluation, truncate or remove the demo accounts from the `users` table and assign unique, strong passwords to all administrative users.
3. **Dedicated Database User:** Do not use the MySQL `root` superuser in production. Create a dedicated database user with least-privilege grants on `prachay_db`.
4. **Strong JWT Key:** Ensure `JWT_SECRET` is securely managed via environment variables or a secret store (e.g. AWS Secrets Manager, HashiCorp Vault), never committed to source control.
5. **Private Uploads:** Keep `uploads/signatures` outside the public web root. The application streams signature images exclusively through authenticated and role-authorized API endpoints (`/api/vouchers/{id}/signatures/*`).

---

## 7. Business Workflow & State Transitions

```
   [ Create Voucher ]
          │
          ▼
      ┌───────┐
      │ DRAFT │ <─── Editable and deletable ONLY by creating Employee
      └───┬───┘
          │ (Employee Signature is MANDATORY before submit)
          ▼
 ┌──────────────────┐
 │ PENDING_APPROVAL │ <─── Read-only for Employee; visible in Director Queue
 └────────┬─────────┘
          │
          ├─────────────────────────┐
          │ (Director Rejection)    │ (Director Approval with Director Signature)
          ▼                         ▼
   ┌──────────────┐          ┌──────────────┐
   │   REJECTED   │          │   APPROVED   │
   └──────────────┘          └──────┬───────┘
  (Mandatory Reason)                ▼
                       ┌─────────────────────────┐
                       │ Ready for Accounts Team │
                       │ Reimbursement Payout    │
                       └─────────────────────────┘
```

### Key Business Rules Enforced:
1. **Unique Voucher Number:** Generated sequentially per month (`VCH-YYYYMM-XXXX`).
2. **Draft Immutability:** Once submitted, approved, or rejected, vouchers become completely read-only for employees.
3. **Mandatory Signatures:** 
   - An Employee Signature is strictly required before submission.
   - A Director Signature is strictly required before approval.
4. **Mandatory Rejection Remarks:** A Director cannot reject a voucher without submitting a reason.
5. **Ownership Isolation:** Employees can only view vouchers created by themselves. The server derives employee identity from the authenticated JWT token, preventing client-side spoofing.
6. **No Tampering by Approvers:** Directors cannot edit employee-entered expense details or amounts.

---

## 8. REST API Documentation

### Authentication (`/api/auth`)
- `POST /api/auth/login` — Authenticate user and obtain JWT token.
- `GET /api/auth/me` — Retrieve current authenticated profile.

### Employee Endpoints (`/api/employee/vouchers`) [Role: `ROLE_EMPLOYEE`]
- `GET /api/employee/vouchers/dashboard` — Retrieve employee dashboard statistics.
- `GET /api/employee/vouchers` — Get list of own vouchers with search/filter query parameters.
- `POST /api/employee/vouchers` — Create a new voucher (initially saved as `DRAFT`). Supports JSON or Multipart with signature.
- `PUT /api/employee/vouchers/{id}` — Update an existing voucher (allowed only while in `DRAFT`).
- `DELETE /api/employee/vouchers/{id}` — Delete a voucher (allowed only while in `DRAFT`).
- `POST /api/employee/vouchers/{id}/signature` — Upload or replace employee signature image (`multipart/form-data`).
- `POST /api/employee/vouchers/{id}/submit` — Submit draft voucher for Director approval.

### Director Endpoints (`/api/director/vouchers`) [Role: `ROLE_DIRECTOR`]
- `GET /api/director/vouchers/dashboard` — Retrieve Director executive metrics (pending counts, amounts, daily counts).
- `GET /api/director/vouchers/pending` — Get all vouchers awaiting approval.
- `GET /api/director/vouchers` — Search, filter, and sort all vouchers across the company.
- `POST /api/director/vouchers/{id}/approve` — Approve voucher with Director signature (`multipart/form-data`).
- `POST /api/director/vouchers/{id}/reject` — Reject voucher with mandatory `rejectionReason` JSON payload.

### Accounts Endpoints (`/api/accounts/vouchers`) [Role: `ROLE_ACCOUNTS`]
- `GET /api/accounts/vouchers/dashboard` — Retrieve Accounts metrics (total approved reimbursement amounts, counts).
- `GET /api/accounts/vouchers` — Search, filter, and monitor all organization vouchers.

### Common Endpoints (`/api/vouchers`) [Authenticated]
- `GET /api/vouchers/{id}` — Fetch voucher details (enforces employee ownership or Director/Accounts access).
- `GET /api/vouchers/{id}/signatures/employee` — Securely stream authorized employee signature image.
- `GET /api/vouchers/{id}/signatures/director` — Securely stream authorized director signature image.

---

## 9. Assumptions Made During Development

1. **Voucher Numbering Format:** Generated in the format `VCH-YYYYMM-0001` based on the current year, month, and database record identifier.
2. **Signature Storage:** Signatures are stored securely on local disk outside of the web root (`uploads/signatures`) using randomized UUID filenames. They are only streamable via authenticated API calls verifying user permissions.
3. **Database Seeding:** On fresh system startup, if no users exist, the system creates four default accounts and four initial vouchers across all lifecycle states to facilitate immediate review.
4. **Vite Development Proxy:** Vite's development server is pre-configured to forward `/api` requests to `http://localhost:8080`, allowing seamless local execution without CORS friction while maintaining CORS filters for security.
