# Apex National Bank - Enterprise Banking Management System (BMS)

An enterprise-grade Banking Management System representing the internal core operations platform used by a bank's Head Office and its branch network.

---

## 1. Technology Stack

### Backend
- **Java 17 / 21**
- **Spring Boot 3.3.5**
- **Spring Security 6** with JWT Access & Refresh Token Rotation
- **Spring Data JPA & Hibernate 6**
- **MySQL 8.0** with UTF8MB4 & InnoDB transactions
- **Lombok**
- **Bean Validation (Hibernate Validator)**
- **OpenAPI 3 / Swagger UI**
- **BCrypt Password Encryption** (Strength 10)
- **HikariCP Connection Pool**

### Frontend
- **React 18** with **TypeScript**
- **Vite 5**
- **Tailwind CSS 3.4** (Custom Enterprise Banking Design System)
- **React Router 6**
- **Axios** (with automatic JWT header injection and 401 refresh token interceptor)
- **Recharts** (Financial trends & transaction analytics)
- **Lucide React** (Institutional iconography)
- **JetBrains Mono** font for financial tabular digits

---

## 2. Institutional Role-Based Access Control (RBAC) & Demo Credentials

> [!IMPORTANT]
> The following credentials are provided strictly for development, demonstration, and evaluation purposes. All sample users share the common password: `Password@123`.

| # | Institutional Role | Username | Email | Assigned Domicile | Primary Responsibilities |
|---|---|---|---|---|---|
| 1 | **SUPER_ADMIN** | `superadmin` | `superadmin@apexbank.com` | Central Head Office (HO-001) | Full system-level governance, core parameter configuration, administrative access across all branches |
| 2 | **HEAD_OFFICE_ADMIN** | `ho_admin` | `ho_admin@apexbank.com` | Central Head Office (HO-001) | Bank-wide liquidity monitoring, branch supervision, high-value approvals, policy enforcement |
| 3 | **REGIONAL_MANAGER** | `rm_south` | `rm_south@apexbank.com` | Southern Region (BR-BLR-01) | Regional branch oversight (Bangalore, Chennai, Hyderabad), regional financial performance |
| 4 | **BRANCH_MANAGER** | `bm_bangalore` | `bm_bangalore@apexbank.com` | MG Road Bangalore (BR-BLR-01) | Branch-level administration, cash vault supervision, employee roster, local approvals |
| 5 | **BANK_EMPLOYEE** | `emp_bangalore` | `emp_bangalore@apexbank.com` | MG Road Bangalore (BR-BLR-01) | Customer KYC verification, account opening, authorized service requests |
| 6 | **CASHIER** | `cashier_blr` | `cashier_blr@apexbank.com` | MG Road Bangalore (BR-BLR-01) | Counter cash deposits, withdrawals, cash receipts, daily drawer balance tally |
| 7 | **LOAN_OFFICER** | `loan_officer_blr` | `loan_officer_blr@apexbank.com` | MG Road Bangalore (BR-BLR-01) | Credit appraisal, document verification, borrower eligibility, EMI schedule evaluation |
| 8 | **AUDITOR** | `chief_auditor` | `auditor@apexbank.com` | Central Head Office (HO-001) | Read-only inspection of immutable audit logs, suspicious AML alerts, compliance forensics |
| 9 | **CUSTOMER** | `cust_rahul` | `rahul.sharma@example.com` | Retail Client (BR-BLR-01) | Dedicated retail banking portal, personal account balances, statements, fund transfers |

---

## 3. Nationwide Branch Network (Sample Seed Data)

1. **Apex Central Head Office (`HO-001`)** — BKC, Mumbai, Maharashtra (IFSC: `APEX0000001`)
2. **Apex Commercial Branch (`BR-BLR-01`)** — MG Road, Bangalore, Karnataka (IFSC: `APEX0001001`)
3. **Apex Financial District Branch (`BR-MUM-02`)** — BKC Platina, Mumbai, Maharashtra (IFSC: `APEX0002001`)
4. **Apex Connaught Place Branch (`BR-DEL-03`)** — Connaught Place, New Delhi (IFSC: `APEX0003001`)
5. **Apex HITEC City Tech Branch (`BR-HYD-04`)** — Cyber Gateway, Madhapur, Hyderabad, Telangana (IFSC: `APEX0004001`)
6. **Apex Marina Commercial Branch (`BR-CHN-05`)** — Anna Salai, Chennai, Tamil Nadu (IFSC: `APEX0005001`)

---

## 4. How to Run

### Backend (Spring Boot)
```bash
cd backend
mvn spring-boot:run
```
- Server starts on: `http://localhost:8989`
- Swagger UI Documentation: `http://localhost:8989/swagger-ui/index.html`
- OpenAPI Specification: `http://localhost:8989/v3/api-docs`

### Frontend (React + Vite)
```bash
cd frontend
npm run dev
```
- Frontend application runs on: `http://localhost:5173`

---

## 5. Security & Banking Controls
- **Stateless JWT Security**: Bearer tokens with 24-hour access expiration and 7-day refresh token rotation.
- **Brute Force Lockout**: Accounts locked for 15 minutes after 5 consecutive failed login attempts.
- **Audit Logging**: Asynchronous audit recording capturing user ID, role, branch, correlation ID, client IP, action, and timestamp.
- **Maker-Checker Segregation**: Critical operations require dual authorization by distinct officials.
