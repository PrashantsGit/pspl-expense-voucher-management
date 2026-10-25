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
- **Testing:** JUnit 5, Mockito, Spring Security Test (`spring-boot-starter-test`)
- **File Upload Security:** Multi-layer signature upload validation in `SignatureStorageService`:
  - **Content-Based Format Detection:** Magic-byte inspection for explicitly supported formats (`PNG`, `JPEG`, `WebP`), rejecting unsupported formats (`GIF`, `BMP`, `SVG`, `PDF`).
  - **MIME & Extension Alignment:** Validates client `Content-Type` and original filename extensions against the detected binary format; stores files under server-controlled UUIDs with canonical extensions.
  - **Limits & Constraints:** Enforces 5MB maximum file size, 24-byte minimum size, and canvas dimensions up to 5000 × 5000 pixels.
  - **Deep Image Verification:** Performs full raster decoding for PNG and JPEG using `ImageReader` to ensure data integrity; performs structural and header validation (RIFF container, chunk headers, and canvas dimensions) for WebP (note: complete bitstream raster decoding is not performed for WebP due to the lack of a native OpenJDK decoder).
  - **Safe Storage & Delivery:** In-memory validation prevents partial file residue on failure; private disk storage outside web root; served with deterministic `Content-Type`, `X-Content-Type-Options: nosniff`, and role-based token authentication.

### Frontend
- **Framework:** React 19 (`19.3.1`) with Vite 8 (`8.3.5`) (JavaScript ES6+)
- **Routing:** React Router v7 (`react-router-dom 7.18.4`) with role-based protected routes
- **UI & Styling:** Bootstrap 5.3 (`5.3.8`) & Bootstrap Icons (`1.13.2`) with custom Modern SaaS design system
- **HTTP Client:** Axios (`1.20.0`) with JWT bearer interceptors and automatic 401 redirect handling
- **Code Quality:** Oxlint (`1.89.0`) for static analysis and linting
- **Special Features:** Printable voucher formatting (`@media print`), search and multi-parameter filtering, interactive quick-login switcher, collapsible responsive sidebar

### Database
- **Engine:** MySQL Server 8.0+
- **Schema Management:** Automated JPA entity schema updates (`spring.jpa.hibernate.ddl-auto=update`) with accompanying explicit `schema.sql` migration script

---

## 2. Project Directory Structure

```
Prachay/
├── backend/
│   ├── .mvn/wrapper/                 # Bundled Maven Wrapper
│   ├── src/main/java/com/prachay/voucher/
│   │   ├── config/                  # Security, Web & Data Initialization (DataInitializer)
│   │   ├── controller/              # Auth, Employee, Director, Accounts, Common APIs
│   │   ├── dto/                     # Request/Response Data Transfer Objects
│   │   ├── entity/                  # JPA Entities (User, Voucher, Role, VoucherStatus)
│   │   ├── exception/               # GlobalExceptionHandler and Custom Exceptions
│   │   ├── repository/              # Spring Data JPA Repositories & Specifications
│   │   ├── security/                # JWT Token Provider, Filters, UserDetails
│   │   └── service/                 # Business Logic, Signatures, Dashboards
│   ├── src/main/resources/
│   │   └── application.properties   # Externalized configuration with environment variable support
│   ├── src/test/java/com/prachay/voucher/ # Unit & integration test suite
│   ├── mvnw & mvnw.cmd              # Maven execution scripts
│   └── pom.xml                      # Project dependencies & build lifecycle
├── frontend/
│   ├── src/
│   │   ├── components/              # Navbar, ProtectedRoute, StatusBadge, VoucherFilterBar, SignatureViewer
│   │   ├── context/                 # AuthContext (JWT session management)
│   │   ├── pages/
│   │   │   ├── employee/            # Employee Dashboard, My Vouchers, VoucherForm
│   │   │   ├── director/            # Director Dashboard, Pending Approvals, All Vouchers
│   │   │   ├── accounts/            # Accounts Dashboard, All Vouchers & Reimbursement
│   │   │   ├── common/              # Universal Voucher Detail View (Printable)
│   │   │   ├── Login.jsx            # Authentication page with demo quick-buttons
│   │   │   └── NotFound.jsx         # 404 handler
│   │   ├── services/api.js          # Axios API client functions
│   │   ├── App.jsx                  # Main application shell and router configuration
│   │   ├── index.css                # Modern SaaS design system and responsive styles
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
Confirm MySQL Server 8.0+ is running on port `3306`.

### Step 2: Create Application Database
Log in to MySQL (via CLI or MySQL Workbench) and create the database:
```sql
CREATE DATABASE IF NOT EXISTS prachay_db
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;
```

### Step 3: Schema Initialization
The application supports two initialization options:
1. **Automated JPA Initialization (Default):** On startup, Hibernate automatically creates or updates the required `users` and `vouchers` tables based on the JPA entity mappings (`spring.jpa.hibernate.ddl-auto=update`).
2. **Explicit DDL Script:** Alternatively, execute the provided `schema.sql` script directly into MySQL:
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
| `SPRING_DATASOURCE_PASSWORD` | MySQL Database Password | Empty string `""` by default; set if your MySQL user requires a password |
| `SERVER_PORT` | Spring Boot HTTP Port | `8080` (overrides `server.port`) |
| `APP_UPLOAD_DIR` | Local Directory for Signature Storage | `uploads/signatures` |
| `APP_SEED_DEMO_DATA` | Enable demo users and sample vouchers | `true` (set `false` in production) |
| `JWT_SECRET` | 256-bit or stronger signing key | **Required** (no fallback secret; application fails startup if omitted) |
| `JWT_EXPIRATION_MS` | JWT Validity in Milliseconds | `86400000` (24 Hours) |
| `VITE_API_BASE_URL` | Frontend API Base URL | `/api` |

> **Important on Secret Generation:** If `JWT_SECRET` is missing or fewer than 256 bits (32 bytes), the backend will fail startup with an `IllegalStateException`. Generate a cryptographically secure key before starting:
> ```bash
> # Linux / macOS / Git Bash:
> openssl rand -base64 32
> 
> # Windows PowerShell:
> [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
> ```

> **Configuration Loading Note:** Vite automatically reads `.env` variables prefixed with `VITE_` for the frontend. For the Spring Boot backend, variables should be set in the operating system environment, exported in your active terminal, or passed as Java system properties (`-Dspring.datasource.password=...`), as Spring Boot does not natively parse a root `.env` file without an external runner.

---

## 5. Running the Application

### Step 1: Start the Backend (Spring Boot 3)
Ensure Java 17 is installed and set on your PATH or `JAVA_HOME`. Export required environment variables and launch the Spring Boot application:

```bash
# On Windows (PowerShell):
$env:JAVA_HOME = "C:\Program Files\Java\jdk-17"  # adjust if needed
$env:SPRING_DATASOURCE_PASSWORD = "your_mysql_password"
$env:JWT_SECRET = "your_generated_256_bit_secret"
cd backend
.\mvnw.cmd spring-boot:run

# On Linux / macOS:
export SPRING_DATASOURCE_PASSWORD="your_mysql_password"
export JWT_SECRET="your_generated_256_bit_secret"
cd backend
./mvnw spring-boot:run
```

*The backend will initialize the database schema and (when demo data is enabled) seed sample accounts and initial vouchers for evaluation.*

#### Running Backend Tests:
To execute the unit test suite:
```bash
# Windows:
cd backend
.\mvnw.cmd test -Dspring.datasource.password=your_password -Dapp.jwt.secret="TestSecretKeyThatIsAtLeast256BitsLongForTestingPurposes123456"

# Linux / macOS:
cd backend
./mvnw test -Dspring.datasource.password=your_password -Dapp.jwt.secret="TestSecretKeyThatIsAtLeast256BitsLongForTestingPurposes123456"
```

### Step 2: Start the Frontend (React + Vite)
In a separate terminal window:
```bash
cd frontend
npm install
npm run dev
```
Open your browser at **`http://localhost:5173`**.

#### Frontend Quality & Build Commands:
- Run production build: `npm run build`
- Run static linter: `npm run lint`
- Preview production bundle: `npm run preview`

---

## 6. Evaluation Demo Accounts & Production Security

### Default Evaluation Credentials
For reviewer convenience during internship evaluation, the application seeds four sample accounts with BCrypt-hashed passwords (`password123`) when `APP_SEED_DEMO_DATA=true` (and not running under the `prod` profile):

| Role | Username | Password | Full Name | Department | Responsibilities |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Employee 1** (`ROLE_EMPLOYEE`) | `employee1` | `password123` | Rahul Sharma | Technology | Create, edit drafts, upload signature, submit claims |
| **Employee 2** (`ROLE_EMPLOYEE`) | `employee2` | `password123` | Priya Patel | Marketing | Create claims, review personal rejection reasons |
| **Director** (`ROLE_DIRECTOR`) | `director` | `password123` | Vikram Malhotra | Executive Management | Review pending approvals, upload director signature, reject with remarks |
| **Accounts Team** (`ROLE_ACCOUNTS`) | `accounts` | `password123` | Anjali Gupta | Finance & Accounts | Monitor all vouchers, audit signatures, print vouchers |

> *Tip: The login page includes quick-fill demo buttons to streamline evaluation across multiple roles without manual typing.*

### Production Deployment Security Checklist
Before deploying this application to a production environment:
1. **Disable Demo Seeding:** Set `APP_SEED_DEMO_DATA=false` and/or activate the production profile (`-Dspring.profiles.active=prod`). When the `prod` profile is active or seeding is disabled, `DataInitializer` skips execution.
2. **Remove Demo Accounts:** If the database was initialized during evaluation, remove the demo accounts from the `users` table and assign unique, strong passwords to all operational users.
3. **Dedicated Database User:** Do not use the MySQL `root` superuser in production. Create a dedicated database user with least-privilege grants on `prachay_db`.
4. **Strong JWT Key:** Ensure `JWT_SECRET` is securely managed via environment variables or a secret store (e.g., AWS Secrets Manager, HashiCorp Vault), never committed to source control.
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
1. **Unique Voucher Number:** Generated atomically using the voucher creation year and month combined with the database primary key ID (`VCH-YYYYMM-0001`), ensuring non-colliding, monotonic identifiers.
2. **Draft Immutability:** Once submitted, approved, or rejected, vouchers become completely read-only for employees.
3. **Mandatory Signatures:**
   - An Employee Signature is strictly required before submission.
   - A Director Signature is strictly required before approval.
4. **Mandatory Rejection Remarks:** A Director cannot reject a voucher without submitting a reason (`rejectionReason` between 3 and 1000 characters).
5. **Ownership Isolation:** Employees can only view, edit, delete, or submit vouchers created by themselves. The server derives employee identity from the authenticated JWT token, preventing client-side spoofing.
6. **No Tampering by Approvers:** Directors cannot edit employee-entered expense details or amounts; they may only approve with a signature or reject with remarks.

---

## 8. REST API Documentation

### Authentication (`/api/auth`)
- `POST /api/auth/login` — Authenticate user and obtain JWT token.
  - **Body (JSON):** `{ "username": "...", "password": "..." }`
  - **Response (200):** `AuthResponse` containing token, user ID, username, full name, employee ID, department, and role.
- `GET /api/auth/me` — Retrieve current authenticated profile.
  - **Headers:** `Authorization: Bearer <token>`
  - **Response (200):** `AuthResponse` for the authenticated session.

### Employee Endpoints (`/api/employee/vouchers`) [Role: `ROLE_EMPLOYEE`]
- `GET /api/employee/vouchers/dashboard` — Retrieve employee dashboard statistics (counts and total approved reimbursement amount).
- `GET /api/employee/vouchers` — Get list of own vouchers with optional search/filter query parameters (`voucherNumber`, `department`, `expenseCategory`, `status`, `startDate`, `endDate`, `minAmount`, `maxAmount`, `sortBy`, `sortDirection`).
- `POST /api/employee/vouchers` — Create a new voucher (initially saved as `DRAFT`).
  - Supports `application/json` (`VoucherCreateRequest`) or `multipart/form-data` with part `voucher` and optional part `signature`.
  - **Response (201):** Created `VoucherResponse`.
- `PUT /api/employee/vouchers/{id}` — Update an existing voucher (allowed only while in `DRAFT`).
  - **Body (JSON):** `VoucherUpdateRequest`
- `DELETE /api/employee/vouchers/{id}` — Delete a voucher (allowed only while in `DRAFT`).
  - **Response (204):** No Content.
- `POST /api/employee/vouchers/{id}/signature` — Upload or replace employee signature image (`multipart/form-data`, file part `signature`).
- `POST /api/employee/vouchers/{id}/submit` — Submit draft voucher for Director approval (requires attached employee signature).

### Director Endpoints (`/api/director/vouchers`) [Role: `ROLE_DIRECTOR`]
- `GET /api/director/vouchers/dashboard` — Retrieve Director executive metrics (pending counts, amounts, daily counts).
- `GET /api/director/vouchers/pending` — Get all vouchers awaiting approval (`status=PENDING_APPROVAL`).
- `GET /api/director/vouchers` — Search, filter, and sort all vouchers across the company (`VoucherFilterRequest`).
- `POST /api/director/vouchers/{id}/approve` — Approve voucher with Director signature (`multipart/form-data`, file part `signature`).
- `POST /api/director/vouchers/{id}/reject` — Reject voucher with mandatory rejection remarks.
  - **Body (JSON):** `{ "rejectionReason": "..." }`

### Accounts Endpoints (`/api/accounts/vouchers`) [Role: `ROLE_ACCOUNTS`]
- `GET /api/accounts/vouchers/dashboard` — Retrieve Accounts metrics (total approved reimbursement amounts, voucher counts).
- `GET /api/accounts/vouchers` — Search, filter, and monitor all organization vouchers (`VoucherFilterRequest`).

### Common Endpoints (`/api/vouchers`) [Authenticated]
- `GET /api/vouchers/{id}` — Fetch voucher details (enforces employee ownership or Director/Accounts access).
- `GET /api/vouchers/{id}/signatures/employee` — Securely stream authorized employee signature image.
- `GET /api/vouchers/{id}/signatures/director` — Securely stream authorized director signature image.

---

## 9. Implementation Notes and Assumptions

1. **Voucher Numbering Architecture:**
   Voucher numbers are generated using the pattern `VCH-YYYYMM-0001`. To guarantee absolute uniqueness without table-locking overhead, the backend first performs an insert to let MySQL allocate an atomic `AUTO_INCREMENT` primary key `id`, then formats the final voucher number with the creation year, month, and zero-padded ID before committing.

2. **Signature Storage & Isolation:**
   Signatures are stored on the host filesystem under a dedicated directory (`uploads/signatures`, configurable via `APP_UPLOAD_DIR`) outside the public web root. Filenames are server-controlled UUIDs with canonical extensions (`sig_...`), preventing filename collisions and directory traversal attacks. Images are delivered exclusively through authenticated, role-authorized streaming endpoints with `X-Content-Type-Options: nosniff`. Multi-layer format validation (magic bytes, raster verification for PNG/JPEG, and RIFF/chunk validation for WebP) is detailed in Section 1.

3. **Database Seeding & Self-Healing:**
   On application startup, if the `users` table is empty and `app.demo.seed-data=true` (under non-`prod` profiles), `DataInitializer` populates four demo accounts and four initial vouchers across all lifecycle states. Additionally, a self-healing routine verifies physical signature files on disk for existing vouchers, regenerating missing image assets so demo vouchers remain fully auditable.

4. **Vite Development Proxy & API Routing:**
   During local development, Vite's development server (`http://localhost:5173`) proxies `/api` requests to the Spring Boot backend (`http://localhost:8080`), eliminating cross-origin browser issues while developing. In addition, Spring Security maintains explicit CORS rules whitelisting `http://localhost:5173` and `http://127.0.0.1:5173`.
