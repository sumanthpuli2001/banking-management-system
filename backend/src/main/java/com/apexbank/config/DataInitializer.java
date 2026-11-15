package com.apexbank.config;

import com.apexbank.entity.*;
import com.apexbank.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final RegionRepository regionRepository;
    private final BranchRepository branchRepository;
    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;
    private final CustomerRepository customerRepository;
    private final BankAccountRepository bankAccountRepository;
    private final TransactionRepository transactionRepository;
    private final TransactionLedgerEntryRepository ledgerEntryRepository;
    private final LoanApplicationRepository loanApplicationRepository;
    private final LoanRepository loanRepository;
    private final LoanRepaymentRepository loanRepaymentRepository;
    private final FixedDepositRepository fixedDepositRepository;
    private final ApprovalRequestRepository approvalRequestRepository;
    private final BeneficiaryRepository beneficiaryRepository;
    private final AuditLogRepository auditLogRepository;
    private final GLAccountRepository glAccountRepository;
    private final AccountingRuleMappingRepository ruleMappingRepository;
    private final AccountingPeriodRepository accountingPeriodRepository;
    private final com.apexbank.repository.regulatory.RegulatoryConfigRepository regulatoryConfigRepository;
    private final com.apexbank.repository.regulatory.EligibleLiquidAssetRepository eligibleLiquidAssetRepository;
    private final com.apexbank.repository.regulatory.RegulatoryReportingPeriodRepository regulatoryReportingPeriodRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(RoleRepository roleRepository,
                           PermissionRepository permissionRepository,
                           RegionRepository regionRepository,
                           BranchRepository branchRepository,
                           UserRepository userRepository,
                           EmployeeRepository employeeRepository,
                           CustomerRepository customerRepository,
                           BankAccountRepository bankAccountRepository,
                           TransactionRepository transactionRepository,
                           TransactionLedgerEntryRepository ledgerEntryRepository,
                           LoanApplicationRepository loanApplicationRepository,
                           LoanRepository loanRepository,
                           LoanRepaymentRepository loanRepaymentRepository,
                           FixedDepositRepository fixedDepositRepository,
                           ApprovalRequestRepository approvalRequestRepository,
                           BeneficiaryRepository beneficiaryRepository,
                           AuditLogRepository auditLogRepository,
                           GLAccountRepository glAccountRepository,
                           AccountingRuleMappingRepository ruleMappingRepository,
                           AccountingPeriodRepository accountingPeriodRepository,
                           com.apexbank.repository.regulatory.RegulatoryConfigRepository regulatoryConfigRepository,
                           com.apexbank.repository.regulatory.EligibleLiquidAssetRepository eligibleLiquidAssetRepository,
                           com.apexbank.repository.regulatory.RegulatoryReportingPeriodRepository regulatoryReportingPeriodRepository,
                           PasswordEncoder passwordEncoder) {
        this.roleRepository = roleRepository;
        this.permissionRepository = permissionRepository;
        this.regionRepository = regionRepository;
        this.branchRepository = branchRepository;
        this.userRepository = userRepository;
        this.employeeRepository = employeeRepository;
        this.customerRepository = customerRepository;
        this.bankAccountRepository = bankAccountRepository;
        this.transactionRepository = transactionRepository;
        this.ledgerEntryRepository = ledgerEntryRepository;
        this.loanApplicationRepository = loanApplicationRepository;
        this.loanRepository = loanRepository;
        this.loanRepaymentRepository = loanRepaymentRepository;
        this.fixedDepositRepository = fixedDepositRepository;
        this.approvalRequestRepository = approvalRequestRepository;
        this.beneficiaryRepository = beneficiaryRepository;
        this.auditLogRepository = auditLogRepository;
        this.glAccountRepository = glAccountRepository;
        this.ruleMappingRepository = ruleMappingRepository;
        this.accountingPeriodRepository = accountingPeriodRepository;
        this.regulatoryConfigRepository = regulatoryConfigRepository;
        this.eligibleLiquidAssetRepository = eligibleLiquidAssetRepository;
        this.regulatoryReportingPeriodRepository = regulatoryReportingPeriodRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        log.info("Checking and initializing institutional banking seed data...");

        // Ensure Double-Entry Accounting Engine & Chart of Accounts is initialized
        seedDoubleEntryAccountingEngine();

        // Ensure Regulatory & Liquidity Management parameters are initialized
        seedRegulatoryAndLiquidityManagement();

        if (roleRepository.count() > 0 && userRepository.count() > 0 && bankAccountRepository.count() > 0) {
            log.info("Institutional database already populated. Skipping core seed sequence.");
            return;
        }

        // 1. Seed Permissions
        Map<String, Permission> permissions = createPermissions();

        // 2. Seed Roles
        Map<RoleType, Role> roles = createRoles(permissions);

        // 3. Seed Regions
        Map<String, Region> regions = createRegions();

        // 4. Seed Branches
        Map<String, Branch> branches = createBranches(regions);

        // 5. Seed Demo Users for all 9 Roles
        Map<String, User> users = createUsers(roles, branches);

        // 6. Seed Employees
        seedEmployees(branches, users);

        // 7. Seed Customers
        Map<String, Customer> customers = seedCustomers(branches, users);

        // 8. Seed Bank Accounts
        Map<String, BankAccount> accounts = seedAccounts(customers, branches);

        // 9. Seed Financial Transactions & Balanced Ledger Entries
        seedTransactions(accounts, branches, users);

        // 10. Seed Loans & Repayment Amortizations
        seedLoans(customers, branches, users);

        // 11. Seed Fixed Deposits
        seedFixedDeposits(customers, accounts, branches);

        // 12. Seed Maker-Checker Approvals
        seedApprovals(branches, users);

        // 13. Seed Beneficiaries
        seedBeneficiaries(customers, accounts);

        // 14. Seed Sample Audit Entries
        createSampleAuditLogs();

        log.info("Institutional banking seed completed with rich multi-module records!");
    }

    private Map<String, Permission> createPermissions() {
        Map<String, Permission> map = new HashMap<>();
        String[][] permDefs = {
                {"BRANCH_READ", "View Branch Directory", "BRANCH", "Permission to view branch profiles"},
                {"BRANCH_WRITE", "Create and Manage Branches", "BRANCH", "Permission to add or alter branch data"},
                {"REGION_READ", "View Regional Structures", "REGION", "Permission to inspect regional offices"},
                {"REGION_WRITE", "Manage Regional Territories", "REGION", "Permission to assign regions"},
                {"EMPLOYEE_READ", "View Staff Profiles", "EMPLOYEE", "Permission to view bank staff directory"},
                {"EMPLOYEE_WRITE", "Manage Bank Personnel", "EMPLOYEE", "Permission to recruit and assign staff"},
                {"CUSTOMER_READ", "View Customer KYC", "CUSTOMER", "Permission to inspect customer files"},
                {"CUSTOMER_WRITE", "Onboard & Modify Customer", "CUSTOMER", "Permission to onboard customers"},
                {"ACCOUNT_READ", "View Account Balances", "ACCOUNT", "Permission to inspect accounts and ledgers"},
                {"ACCOUNT_WRITE", "Open & Manage Accounts", "ACCOUNT", "Permission to open or freeze accounts"},
                {"DEPOSIT_EXECUTE", "Process Cash Deposits", "CASHIER", "Counter deposit transaction privilege"},
                {"WITHDRAW_EXECUTE", "Process Cash Withdrawals", "CASHIER", "Counter withdrawal transaction privilege"},
                {"TRANSFER_REQUEST", "Initiate Fund Transfers", "TRANSFER", "Initiate intra and interbank transfers"},
                {"TRANSFER_APPROVE", "Approve High-Value Transfers", "APPROVAL", "Maker-checker transfer authorization"},
                {"LOAN_APPLY", "Initiate Loan Applications", "LOAN", "Submit loan applications"},
                {"LOAN_EVALUATE", "Underwrite Loan Dossiers", "LOAN", "Assess creditworthiness and collateral"},
                {"LOAN_APPROVE", "Sanction & Disburse Loans", "APPROVAL", "Final loan sanction authorization"},
                {"AUDIT_READ", "Access Compliance Logs", "AUDIT", "Inspect system-wide immutable logs"},
                {"SYSTEM_CONFIG", "Manage Core Parameters", "ADMIN", "Configure institutional banking rules"}
        };

        for (String[] def : permDefs) {
            Permission p = permissionRepository.findByCode(def[0]).orElseGet(() ->
                    permissionRepository.save(Permission.builder()
                            .code(def[0])
                            .name(def[1])
                            .module(def[2])
                            .description(def[3])
                            .build())
            );
            map.put(def[0], p);
        }
        return map;
    }

    private Map<RoleType, Role> createRoles(Map<String, Permission> p) {
        Map<RoleType, Role> map = new HashMap<>();

        for (RoleType rt : RoleType.values()) {
            Set<Permission> perms = new HashSet<>();
            switch (rt) {
                case SUPER_ADMIN -> perms.addAll(p.values());
                case HEAD_OFFICE_ADMIN -> {
                    perms.add(p.get("BRANCH_READ"));
                    perms.add(p.get("BRANCH_WRITE"));
                    perms.add(p.get("REGION_READ"));
                    perms.add(p.get("REGION_WRITE"));
                    perms.add(p.get("EMPLOYEE_READ"));
                    perms.add(p.get("EMPLOYEE_WRITE"));
                    perms.add(p.get("CUSTOMER_READ"));
                    perms.add(p.get("ACCOUNT_READ"));
                    perms.add(p.get("TRANSFER_APPROVE"));
                    perms.add(p.get("LOAN_APPROVE"));
                    perms.add(p.get("AUDIT_READ"));
                }
                case REGIONAL_MANAGER -> {
                    perms.add(p.get("BRANCH_READ"));
                    perms.add(p.get("REGION_READ"));
                    perms.add(p.get("EMPLOYEE_READ"));
                    perms.add(p.get("CUSTOMER_READ"));
                    perms.add(p.get("ACCOUNT_READ"));
                    perms.add(p.get("TRANSFER_APPROVE"));
                    perms.add(p.get("LOAN_APPROVE"));
                }
                case BRANCH_MANAGER -> {
                    perms.add(p.get("BRANCH_READ"));
                    perms.add(p.get("EMPLOYEE_READ"));
                    perms.add(p.get("CUSTOMER_READ"));
                    perms.add(p.get("CUSTOMER_WRITE"));
                    perms.add(p.get("ACCOUNT_READ"));
                    perms.add(p.get("ACCOUNT_WRITE"));
                    perms.add(p.get("TRANSFER_APPROVE"));
                    perms.add(p.get("LOAN_APPROVE"));
                }
                case BANK_EMPLOYEE -> {
                    perms.add(p.get("CUSTOMER_READ"));
                    perms.add(p.get("CUSTOMER_WRITE"));
                    perms.add(p.get("ACCOUNT_READ"));
                    perms.add(p.get("ACCOUNT_WRITE"));
                    perms.add(p.get("TRANSFER_REQUEST"));
                    perms.add(p.get("LOAN_APPLY"));
                }
                case CASHIER -> {
                    perms.add(p.get("ACCOUNT_READ"));
                    perms.add(p.get("DEPOSIT_EXECUTE"));
                    perms.add(p.get("WITHDRAW_EXECUTE"));
                }
                case LOAN_OFFICER -> {
                    perms.add(p.get("CUSTOMER_READ"));
                    perms.add(p.get("LOAN_APPLY"));
                    perms.add(p.get("LOAN_EVALUATE"));
                }
                case AUDITOR -> {
                    perms.add(p.get("BRANCH_READ"));
                    perms.add(p.get("CUSTOMER_READ"));
                    perms.add(p.get("ACCOUNT_READ"));
                    perms.add(p.get("AUDIT_READ"));
                }
                case CUSTOMER -> {
                    perms.add(p.get("ACCOUNT_READ"));
                    perms.add(p.get("TRANSFER_REQUEST"));
                }
            }

            Role role = roleRepository.findByName(rt).orElseGet(() ->
                    roleRepository.save(Role.builder()
                            .name(rt)
                            .description("Institutional role for " + rt.name())
                            .permissions(perms)
                            .build())
            );
            map.put(rt, role);
        }

        return map;
    }

    private Map<String, Region> createRegions() {
        Map<String, Region> map = new HashMap<>();

        Region rSouth = regionRepository.findByCode("REG-SOUTH").orElseGet(() ->
                regionRepository.save(Region.builder()
                        .code("REG-SOUTH")
                        .name("Southern Regional Office")
                        .description("Supervises Karnataka, Tamil Nadu, and Telangana operations")
                        .status("ACTIVE")
                        .build()));

        Region rWest = regionRepository.findByCode("REG-WEST").orElseGet(() ->
                regionRepository.save(Region.builder()
                        .code("REG-WEST")
                        .name("Western Regional Office")
                        .description("Supervises Maharashtra and Gujarat operations")
                        .status("ACTIVE")
                        .build()));

        Region rNorth = regionRepository.findByCode("REG-NORTH").orElseGet(() ->
                regionRepository.save(Region.builder()
                        .code("REG-NORTH")
                        .name("Northern Regional Office")
                        .description("Supervises Delhi NCR and Punjab operations")
                        .status("ACTIVE")
                        .build()));

        map.put("REG-SOUTH", rSouth);
        map.put("REG-WEST", rWest);
        map.put("REG-NORTH", rNorth);
        return map;
    }

    private Map<String, Branch> createBranches(Map<String, Region> regions) {
        Map<String, Branch> map = new HashMap<>();

        Branch ho = branchRepository.findByBranchCode("HO-001").orElseGet(() ->
                branchRepository.save(Branch.builder()
                        .branchCode("HO-001")
                        .name("Apex Central Head Office")
                        .ifscCode("APEX0000001")
                        .address("Apex Financial Tower, Bandra Kurla Complex (BKC)")
                        .city("Mumbai")
                        .state("Maharashtra")
                        .postalCode("400051")
                        .phone("+91-22-69001000")
                        .email("headoffice@apexbank.com")
                        .status("ACTIVE")
                        .isHeadOffice(true)
                        .cashVaultBalance(new BigDecimal("500000000.00"))
                        .region(regions.get("REG-WEST"))
                        .build()));

        Branch blr = branchRepository.findByBranchCode("BR-BLR-01").orElseGet(() ->
                branchRepository.save(Branch.builder()
                        .branchCode("BR-BLR-01")
                        .name("Apex Commercial Branch, MG Road")
                        .ifscCode("APEX0001001")
                        .address("14/2 Trinity Square, Mahatma Gandhi Road")
                        .city("Bangalore")
                        .state("Karnataka")
                        .postalCode("560001")
                        .phone("+91-80-49202000")
                        .email("bangalore.mg@apexbank.com")
                        .status("ACTIVE")
                        .isHeadOffice(false)
                        .cashVaultBalance(new BigDecimal("25000000.00"))
                        .region(regions.get("REG-SOUTH"))
                        .build()));

        Branch mum = branchRepository.findByBranchCode("BR-MUM-02").orElseGet(() ->
                branchRepository.save(Branch.builder()
                        .branchCode("BR-MUM-02")
                        .name("Apex Financial District Branch, BKC")
                        .ifscCode("APEX0002001")
                        .address("Platina Tower, G-Block, BKC")
                        .city("Mumbai")
                        .state("Maharashtra")
                        .postalCode("400051")
                        .phone("+91-22-69002200")
                        .email("mumbai.bkc@apexbank.com")
                        .status("ACTIVE")
                        .isHeadOffice(false)
                        .cashVaultBalance(new BigDecimal("35000000.00"))
                        .region(regions.get("REG-WEST"))
                        .build()));

        Branch del = branchRepository.findByBranchCode("BR-DEL-03").orElseGet(() ->
                branchRepository.save(Branch.builder()
                        .branchCode("BR-DEL-03")
                        .name("Apex Connaught Place Branch")
                        .ifscCode("APEX0003001")
                        .address("Block B, Inner Circle, Connaught Place")
                        .city("New Delhi")
                        .state("Delhi")
                        .postalCode("110001")
                        .phone("+91-11-47103300")
                        .email("delhi.cp@apexbank.com")
                        .status("ACTIVE")
                        .isHeadOffice(false)
                        .cashVaultBalance(new BigDecimal("30000000.00"))
                        .region(regions.get("REG-NORTH"))
                        .build()));

        Branch hyd = branchRepository.findByBranchCode("BR-HYD-04").orElseGet(() ->
                branchRepository.save(Branch.builder()
                        .branchCode("BR-HYD-04")
                        .name("Apex HITEC City Tech Branch")
                        .ifscCode("APEX0004001")
                        .address("Cyber Gateway, Madhapur")
                        .city("Hyderabad")
                        .state("Telangana")
                        .postalCode("500081")
                        .phone("+91-40-66204400")
                        .email("hyderabad.hitec@apexbank.com")
                        .status("ACTIVE")
                        .isHeadOffice(false)
                        .cashVaultBalance(new BigDecimal("20000000.00"))
                        .region(regions.get("REG-SOUTH"))
                        .build()));

        Branch chn = branchRepository.findByBranchCode("BR-CHN-05").orElseGet(() ->
                branchRepository.save(Branch.builder()
                        .branchCode("BR-CHN-05")
                        .name("Apex Marina Commercial Branch")
                        .ifscCode("APEX0005001")
                        .address("Anna Salai, Mount Road")
                        .city("Chennai")
                        .state("Tamil Nadu")
                        .postalCode("600002")
                        .phone("+91-44-28505500")
                        .email("chennai.marina@apexbank.com")
                        .status("ACTIVE")
                        .isHeadOffice(false)
                        .cashVaultBalance(new BigDecimal("18000000.00"))
                        .region(regions.get("REG-SOUTH"))
                        .build()));

        map.put("HO-001", ho);
        map.put("BR-BLR-01", blr);
        map.put("BR-MUM-02", mum);
        map.put("BR-DEL-03", del);
        map.put("BR-HYD-04", hyd);
        map.put("BR-CHN-05", chn);
        return map;
    }

    private Map<String, User> createUsers(Map<RoleType, Role> roles, Map<String, Branch> branches) {
        Map<String, User> map = new HashMap<>();
        String commonPassword = passwordEncoder.encode("Password@123");

        User u1 = saveOrGetUser("superadmin", commonPassword, "Vikramaditya Singhania", "superadmin@apexbank.com",
                "+91-9820011001", "EMP-DIR-001", "Executive Director & Chief Systems Architect", branches.get("HO-001"), Set.of(roles.get(RoleType.SUPER_ADMIN)));
        User u2 = saveOrGetUser("ho_admin", commonPassword, "Rajeshwari Deshmukh", "ho_admin@apexbank.com",
                "+91-9820011002", "EMP-HO-010", "Senior Vice President - Operations & Control", branches.get("HO-001"), Set.of(roles.get(RoleType.HEAD_OFFICE_ADMIN)));
        User u3 = saveOrGetUser("rm_south", commonPassword, "Suresh Venkatesh", "rm_south@apexbank.com",
                "+91-9845011003", "EMP-RM-101", "General Manager - Southern Region", branches.get("BR-BLR-01"), Set.of(roles.get(RoleType.REGIONAL_MANAGER)));
        User u4 = saveOrGetUser("bm_bangalore", commonPassword, "Arunachalam Murugan", "bm_bangalore@apexbank.com",
                "+91-9845011004", "EMP-BM-205", "Chief Branch Manager", branches.get("BR-BLR-01"), Set.of(roles.get(RoleType.BRANCH_MANAGER)));
        User u5 = saveOrGetUser("emp_bangalore", commonPassword, "Ananya Shenoy", "emp_bangalore@apexbank.com",
                "+91-9845011005", "EMP-OPS-302", "Senior Customer Relationship Officer", branches.get("BR-BLR-01"), Set.of(roles.get(RoleType.BANK_EMPLOYEE)));
        User u6 = saveOrGetUser("cashier_blr", commonPassword, "Girish Patel", "cashier_blr@apexbank.com",
                "+91-9845011006", "EMP-CSH-401", "Senior Head Cashier Counter #1", branches.get("BR-BLR-01"), Set.of(roles.get(RoleType.CASHIER)));
        User u7 = saveOrGetUser("loan_officer_blr", commonPassword, "Kavitha Ramachandran", "loan_officer_blr@apexbank.com",
                "+91-9845011007", "EMP-LND-501", "Principal Lending & Underwriting Officer", branches.get("BR-BLR-01"), Set.of(roles.get(RoleType.LOAN_OFFICER)));
        User u8 = saveOrGetUser("chief_auditor", commonPassword, "Rameshwar Chawla", "auditor@apexbank.com",
                "+91-9810011008", "EMP-AUD-901", "Chief Compliance Inspector & External Auditor", branches.get("HO-001"), Set.of(roles.get(RoleType.AUDITOR)));
        User u9 = saveOrGetUser("cust_rahul", commonPassword, "Rahul Sharma", "rahul.sharma@example.com",
                "+91-9876543210", null, "Premium Retail Client", branches.get("BR-BLR-01"), Set.of(roles.get(RoleType.CUSTOMER)));

        map.put("superadmin", u1);
        map.put("ho_admin", u2);
        map.put("rm_south", u3);
        map.put("bm_bangalore", u4);
        map.put("emp_bangalore", u5);
        map.put("cashier_blr", u6);
        map.put("loan_officer_blr", u7);
        map.put("chief_auditor", u8);
        map.put("cust_rahul", u9);
        return map;
    }

    private User saveOrGetUser(String username, String pwd, String name, String email, String phone, String empId, String desig, Branch branch, Set<Role> roles) {
        return userRepository.findByUsername(username).orElseGet(() ->
                userRepository.save(User.builder()
                        .username(username)
                        .password(pwd)
                        .fullName(name)
                        .email(email)
                        .phone(phone)
                        .employeeId(empId)
                        .designation(desig)
                        .active(true)
                        .branch(branch)
                        .roles(roles)
                        .build()));
    }

    private void seedEmployees(Map<String, Branch> branches, Map<String, User> users) {
        if (employeeRepository.count() > 0) return;

        createEmpRecord("EMP-DIR-001", users.get("superadmin"), branches.get("HO-001"), "Executive Director", "Executive Committee", new BigDecimal("350000.00"));
        createEmpRecord("EMP-HO-010", users.get("ho_admin"), branches.get("HO-001"), "Senior Vice President", "Operations & Control", new BigDecimal("250000.00"));
        createEmpRecord("EMP-RM-101", users.get("rm_south"), branches.get("BR-BLR-01"), "General Manager", "Regional Supervision", new BigDecimal("180000.00"));
        createEmpRecord("EMP-BM-205", users.get("bm_bangalore"), branches.get("BR-BLR-01"), "Chief Branch Manager", "Branch Administration", new BigDecimal("120000.00"));
        createEmpRecord("EMP-OPS-302", users.get("emp_bangalore"), branches.get("BR-BLR-01"), "Senior Customer Relationship Officer", "Retail Operations", new BigDecimal("65000.00"));
        createEmpRecord("EMP-CSH-401", users.get("cashier_blr"), branches.get("BR-BLR-01"), "Senior Head Cashier", "Teller & Counter", new BigDecimal("55000.00"));
        createEmpRecord("EMP-LND-501", users.get("loan_officer_blr"), branches.get("BR-BLR-01"), "Principal Lending Officer", "Credit Appraisal", new BigDecimal("75000.00"));
        createEmpRecord("EMP-AUD-901", users.get("chief_auditor"), branches.get("HO-001"), "Chief Compliance Inspector", "Internal Audit", new BigDecimal("140000.00"));
    }

    private void createEmpRecord(String code, User user, Branch branch, String desig, String dept, BigDecimal salary) {
        if (user == null) return;
        employeeRepository.save(Employee.builder()
                .employeeCode(code)
                .user(user)
                .branch(branch)
                .designation(desig)
                .department(dept)
                .phone(user.getPhone())
                .salary(salary)
                .status("ACTIVE")
                .build());
    }

    private Map<String, Customer> seedCustomers(Map<String, Branch> branches, Map<String, User> users) {
        Map<String, Customer> map = new HashMap<>();

        Customer c1 = saveCustomer("CIF-100234", users.get("cust_rahul"), branches.get("BR-BLR-01"),
                "Rahul Sharma", "1988-04-12", "Male", "ABCDE****F", "********1234", "rahul.sharma@example.com",
                "+91-9876543210", "42 Palm Meadows, Whitefield", "Bangalore", "Karnataka", "560066", "Software Architect", new BigDecimal("2400000.00"));

        Customer c2 = saveCustomer("CIF-100235", null, branches.get("BR-BLR-01"),
                "Priya Sundaram", "1992-08-25", "Female", "PQRSX****Z", "********5678", "priya.sundaram@example.com",
                "+91-9876543211", "88 Indiranagar 100ft Road", "Bangalore", "Karnataka", "560038", "Product Director", new BigDecimal("3200000.00"));

        Customer c3 = saveCustomer("CIF-100236", null, branches.get("BR-MUM-02"),
                "Aditya Birla Enterprises Ltd", "2010-01-15", "Corporate", "AAACB****K", "********9900", "finance@adityabirla.example.com",
                "+91-22-26543210", "Maker Chambers IV, Nariman Point", "Mumbai", "Maharashtra", "400021", "Manufacturing & Infra", new BigDecimal("85000000.00"));

        Customer c4 = saveCustomer("CIF-100237", null, branches.get("BR-DEL-03"),
                "Meenakshi Malhotra", "1995-11-03", "Female", "DELPM****M", "********3456", "meenakshi.m@example.com",
                "+91-11-23344556", "C-4 Vasant Vihar", "New Delhi", "Delhi", "110057", "Civil Servant", new BigDecimal("1800000.00"));

        map.put("c1", c1);
        map.put("c2", c2);
        map.put("c3", c3);
        map.put("c4", c4);
        return map;
    }

    private Customer saveCustomer(String cif, User user, Branch branch, String name, String dob, String gender, String pan, String aadh, String email, String phone, String addr, String city, String state, String zip, String occ, BigDecimal income) {
        return customerRepository.findByCustomerNumber(cif).orElseGet(() ->
                customerRepository.save(Customer.builder()
                        .customerNumber(cif)
                        .user(user)
                        .primaryBranch(branch)
                        .fullName(name)
                        .dateOfBirth(dob)
                        .gender(gender)
                        .panNumber(pan)
                        .aadhaarNumber(aadh)
                        .email(email)
                        .phone(phone)
                        .addressLine1(addr)
                        .city(city)
                        .state(state)
                        .postalCode(zip)
                        .country("India")
                        .kycStatus("VERIFIED")
                        .kycVerifiedAt(LocalDateTime.now().minusMonths(6))
                        .riskCategory("LOW")
                        .occupation(occ)
                        .annualIncome(income)
                        .status("ACTIVE")
                        .build()));
    }

    private Map<String, BankAccount> seedAccounts(Map<String, Customer> customers, Map<String, Branch> branches) {
        Map<String, BankAccount> map = new HashMap<>();

        BankAccount a1 = saveAccount("5010012345678901", AccountType.SAVINGS, customers.get("c1"), branches.get("BR-BLR-01"), new BigDecimal("485200.00"), new BigDecimal("4.00"));
        BankAccount a2 = saveAccount("5010012345678902", AccountType.SALARY, customers.get("c2"), branches.get("BR-BLR-01"), new BigDecimal("824500.00"), new BigDecimal("4.25"));
        BankAccount a3 = saveAccount("5020019876543201", AccountType.CURRENT, customers.get("c3"), branches.get("BR-MUM-02"), new BigDecimal("14250000.00"), BigDecimal.ZERO);
        BankAccount a4 = saveAccount("5030014567891201", AccountType.SAVINGS, customers.get("c4"), branches.get("BR-DEL-03"), new BigDecimal("275000.00"), new BigDecimal("4.00"));

        map.put("a1", a1);
        map.put("a2", a2);
        map.put("a3", a3);
        map.put("a4", a4);
        return map;
    }

    private BankAccount saveAccount(String accNo, AccountType type, Customer customer, Branch branch, BigDecimal bal, BigDecimal rate) {
        return bankAccountRepository.findByAccountNumber(accNo).orElseGet(() ->
                bankAccountRepository.save(BankAccount.builder()
                        .accountNumber(accNo)
                        .accountType(type)
                        .customer(customer)
                        .branch(branch)
                        .balance(bal)
                        .availableBalance(bal)
                        .currency("INR")
                        .status("ACTIVE")
                        .interestRate(rate)
                        .dailyWithdrawalLimit(new BigDecimal("100000.00"))
                        .dailyTransferLimit(new BigDecimal("500000.00"))
                        .openedDate(LocalDateTime.now().minusMonths(12))
                        .build()));
    }

    private void seedTransactions(Map<String, BankAccount> accounts, Map<String, Branch> branches, Map<String, User> users) {
        if (transactionRepository.count() > 0) return;

        BankAccount a1 = accounts.get("a1");
        BankAccount a2 = accounts.get("a2");
        Branch branch = branches.get("BR-BLR-01");
        User cashier = users.get("cashier_blr");

        // 1. Counter Deposit
        String ref1 = "TXN-DEP-20261114-1011";
        Transaction t1 = transactionRepository.save(Transaction.builder()
                .referenceNumber(ref1)
                .idempotencyKey(ref1)
                .destinationAccount(a1)
                .amount(new BigDecimal("50000.00"))
                .transactionType(TransactionType.CASH_DEPOSIT)
                .status(TransactionStatus.SUCCESS)
                .paymentChannel("BRANCH_COUNTER")
                .narration("Cash counter deposit by account holder")
                .initiatedBy(cashier)
                .branch(branch)
                .transactionTimestamp(LocalDateTime.now().minusHours(4))
                .build());
        ledgerEntryRepository.save(TransactionLedgerEntry.builder()
                .transaction(t1).account(a1).entryType("CREDIT").amount(new BigDecimal("50000.00"))
                .runningBalance(a1.getBalance()).entryTimestamp(LocalDateTime.now().minusHours(4)).build());

        // 2. Intra-bank Transfer
        String ref2 = "TXN-TRF-20261114-1022";
        Transaction t2 = transactionRepository.save(Transaction.builder()
                .referenceNumber(ref2)
                .idempotencyKey(ref2)
                .sourceAccount(a1)
                .destinationAccount(a2)
                .amount(new BigDecimal("15000.00"))
                .transactionType(TransactionType.INTERNAL_TRANSFER)
                .status(TransactionStatus.SUCCESS)
                .paymentChannel("INTERNET_BANKING")
                .narration("Consulting retainer fee transfer")
                .initiatedBy(users.get("cust_rahul"))
                .branch(branch)
                .transactionTimestamp(LocalDateTime.now().minusHours(2))
                .build());
        ledgerEntryRepository.save(TransactionLedgerEntry.builder()
                .transaction(t2).account(a1).entryType("DEBIT").amount(new BigDecimal("15000.00"))
                .runningBalance(a1.getBalance().subtract(new BigDecimal("15000.00"))).entryTimestamp(LocalDateTime.now().minusHours(2)).build());
        ledgerEntryRepository.save(TransactionLedgerEntry.builder()
                .transaction(t2).account(a2).entryType("CREDIT").amount(new BigDecimal("15000.00"))
                .runningBalance(a2.getBalance()).entryTimestamp(LocalDateTime.now().minusHours(2)).build());
    }

    private void seedLoans(Map<String, Customer> customers, Map<String, Branch> branches, Map<String, User> users) {
        if (loanApplicationRepository.count() > 0) return;

        Customer c1 = customers.get("c1");
        Branch branch = branches.get("BR-BLR-01");
        User loanOfficer = users.get("loan_officer_blr");

        // Approved and active Home Loan
        LoanApplication app1 = loanApplicationRepository.save(LoanApplication.builder()
                .applicationNumber("LN-APP-BLR-2026-001")
                .customer(c1)
                .branch(branch)
                .loanType("HOME")
                .requestedAmount(new BigDecimal("4500000.00"))
                .requestedTenureMonths(180)
                .purpose("Apartment purchase at Prestige Lakeside")
                .monthlyIncome(new BigDecimal("200000.00"))
                .creditScore(790)
                .status("APPROVED")
                .assignedOfficer(loanOfficer)
                .remarks("Credit score excellent, property titles verified")
                .applicationDate(LocalDateTime.now().minusMonths(3))
                .build());

        BigDecimal p = new BigDecimal("4500000.00");
        BigDecimal rate = new BigDecimal("8.50");
        int n = 180;
        double r = (8.50 / 12) / 100;
        double emiVal = (4500000.0 * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
        BigDecimal emi = BigDecimal.valueOf(emiVal).setScale(2, RoundingMode.HALF_UP);
        BigDecimal totalPayable = emi.multiply(BigDecimal.valueOf(n)).setScale(2, RoundingMode.HALF_UP);

        Loan loan1 = loanRepository.save(Loan.builder()
                .loanAccountNumber("LA-BLR-2026-1001")
                .loanApplication(app1)
                .customer(c1)
                .branch(branch)
                .loanType("HOME")
                .principalAmount(p)
                .interestRate(rate)
                .tenureMonths(n)
                .monthlyEmi(emi)
                .totalInterest(totalPayable.subtract(p))
                .totalPayable(totalPayable)
                .outstandingPrincipal(new BigDecimal("4420000.00"))
                .status("ACTIVE")
                .sanctionedDate(LocalDateTime.now().minusMonths(3))
                .maturityDate(LocalDateTime.now().plusMonths(177))
                .nextDueDate(LocalDateTime.now().plusDays(16))
                .build());

        // First 3 installments paid
        loanRepaymentRepository.save(LoanRepayment.builder().loan(loan1).installmentNumber(1).emiAmount(emi).principalComponent(new BigDecimal("12400.00")).interestComponent(emi.subtract(new BigDecimal("12400.00"))).dueDate(LocalDateTime.now().minusMonths(2)).paidDate(LocalDateTime.now().minusMonths(2)).status("PAID").penaltyAmount(BigDecimal.ZERO).build());
        loanRepaymentRepository.save(LoanRepayment.builder().loan(loan1).installmentNumber(2).emiAmount(emi).principalComponent(new BigDecimal("12500.00")).interestComponent(emi.subtract(new BigDecimal("12500.00"))).dueDate(LocalDateTime.now().minusMonths(1)).paidDate(LocalDateTime.now().minusMonths(1)).status("PAID").penaltyAmount(BigDecimal.ZERO).build());
        loanRepaymentRepository.save(LoanRepayment.builder().loan(loan1).installmentNumber(3).emiAmount(emi).principalComponent(new BigDecimal("12600.00")).interestComponent(emi.subtract(new BigDecimal("12600.00"))).dueDate(LocalDateTime.now().plusDays(16)).status("SCHEDULED").penaltyAmount(BigDecimal.ZERO).build());

        // Pending Loan Application for Review
        loanApplicationRepository.save(LoanApplication.builder()
                .applicationNumber("LN-APP-BLR-2026-002")
                .customer(customers.get("c2"))
                .branch(branch)
                .loanType("VEHICLE")
                .requestedAmount(new BigDecimal("1800000.00"))
                .requestedTenureMonths(60)
                .purpose("EV SUV Purchase")
                .monthlyIncome(new BigDecimal("260000.00"))
                .creditScore(765)
                .status("SUBMITTED")
                .applicationDate(LocalDateTime.now().minusDays(2))
                .build());
    }

    private void seedFixedDeposits(Map<String, Customer> customers, Map<String, BankAccount> accounts, Map<String, Branch> branches) {
        if (fixedDepositRepository.count() > 0) return;

        Customer c1 = customers.get("c1");
        BankAccount a1 = accounts.get("a1");
        Branch branch = branches.get("BR-BLR-01");

        fixedDepositRepository.save(FixedDeposit.builder()
                .certificateNumber("FD-BLR-2026-5001")
                .customer(c1)
                .sourceAccount(a1)
                .branch(branch)
                .depositAmount(new BigDecimal("200000.00"))
                .interestRate(new BigDecimal("7.10"))
                .tenureMonths(24)
                .maturityAmount(new BigDecimal("230184.00"))
                .depositDate(LocalDateTime.now().minusMonths(4))
                .maturityDate(LocalDateTime.now().plusMonths(20))
                .autoRenew(true)
                .status("ACTIVE")
                .build());
    }

    private void seedApprovals(Map<String, Branch> branches, Map<String, User> users) {
        if (approvalRequestRepository.count() > 0) return;

        User maker = users.get("emp_bangalore");
        Branch branch = branches.get("BR-BLR-01");

        approvalRequestRepository.save(ApprovalRequest.builder()
                .requestType("HIGH_VALUE_TRANSFER")
                .targetEntityName("Transaction")
                .targetEntityId(101L)
                .maker(maker)
                .branch(branch)
                .amount(new BigDecimal("750000.00"))
                .payloadJson("{\"source\":\"5010012345678901\",\"destination\":\"5020019876543201\",\"amount\":750000.00}")
                .status("PENDING")
                .makerRemarks("Client requested high-value vendor advance payout")
                .requestedAt(LocalDateTime.now().minusHours(3))
                .build());

        approvalRequestRepository.save(ApprovalRequest.builder()
                .requestType("ACCOUNT_FREEZE")
                .targetEntityName("BankAccount")
                .targetEntityId(4L)
                .maker(maker)
                .branch(branch)
                .payloadJson("{\"accountNumber\":\"5030014567891201\",\"action\":\"FREEZE_DEBIT\"}")
                .status("PENDING")
                .makerRemarks("Cyber cell notice regarding temporary lien")
                .requestedAt(LocalDateTime.now().minusHours(1))
                .build());
    }

    private void seedBeneficiaries(Map<String, Customer> customers, Map<String, BankAccount> accounts) {
        if (beneficiaryRepository.count() > 0) return;

        Customer c1 = customers.get("c1");
        BankAccount a2 = accounts.get("a2");

        beneficiaryRepository.save(Beneficiary.builder()
                .customer(c1)
                .beneficiaryName("Priya Sundaram")
                .accountNumber(a2.getAccountNumber())
                .ifscCode("APEX0001001")
                .bankName("Apex National Bank")
                .branchName("Apex Commercial Branch, MG Road")
                .transferLimit(new BigDecimal("200000.00"))
                .status("ACTIVE")
                .build());
    }

    private void createSampleAuditLogs() {
        if (auditLogRepository.count() > 0) return;

        auditLogRepository.save(AuditLog.builder()
                .userId(1L)
                .username("superadmin")
                .userRole("SUPER_ADMIN")
                .branchId(1L)
                .branchName("Apex Central Head Office")
                .action("SYSTEM_INITIALIZATION")
                .module("CORE_ENGINE")
                .referenceId("INIT-CORE-2026")
                .correlationId(UUID.randomUUID().toString())
                .ipAddress("127.0.0.1")
                .status("SUCCESS")
                .details("Institutional core ledger parameters calibrated and verified")
                .eventTimestamp(LocalDateTime.now().minusHours(5))
                .build());

        auditLogRepository.save(AuditLog.builder()
                .userId(2L)
                .username("ho_admin")
                .userRole("HEAD_OFFICE_ADMIN")
                .branchId(1L)
                .branchName("Apex Central Head Office")
                .action("BRANCH_CREDIT_LIMIT_SYNC")
                .module("BRANCH_MANAGEMENT")
                .referenceId("SYNC-BR-01")
                .correlationId(UUID.randomUUID().toString())
                .ipAddress("127.0.0.1")
                .status("SUCCESS")
                .details("Automated nocturnal liquidity sweep synchronized for 6 branches")
                .eventTimestamp(LocalDateTime.now().minusHours(3))
                .build());

        auditLogRepository.save(AuditLog.builder()
                .userId(4L)
                .username("bm_bangalore")
                .userRole("BRANCH_MANAGER")
                .branchId(2L)
                .branchName("Apex Commercial Branch, MG Road")
                .action("DAILY_VAULT_OPENING")
                .module("CASH_OPERATIONS")
                .referenceId("VLT-BLR-20261114")
                .correlationId(UUID.randomUUID().toString())
                .ipAddress("192.168.1.104")
                .status("SUCCESS")
                .details("Dual-key safe vault unlocked with opening balance INR 2,50,00,000.00")
                .eventTimestamp(LocalDateTime.now().minusHours(1))
                .build());
    }

    private void seedDoubleEntryAccountingEngine() {
        if (glAccountRepository.count() > 0 && ruleMappingRepository.count() > 0) {
            log.info("Double-entry Chart of Accounts already populated.");
            return;
        }

        log.info("Seeding institutional Double-Entry Chart of Accounts & Rule Mappings...");

        // Seed Chart of Accounts
        String[][] coaDefs = {
            // Assets (1000s)
            {"1010-CASH-VAULT", "Branch Cash Vault & Counter Currency", "ASSET", "DEBIT", "Physical currency notes held in cash drawers and branch vaults"},
            {"1020-LOANS-ADVANCES", "Retail & Commercial Loan Portfolio", "ASSET", "DEBIT", "Outstanding principal advances disbursed to retail and corporate clients"},
            {"1030-INTER-BRANCH-CLEARING", "Inter-Branch Transit & Settlement", "ASSET", "DEBIT", "Inter-branch clearing settlement transit account"},
            {"1040-RBI-RESERVE-BALANCE", "Reserve Bank of India CRR/SLR Reserves", "ASSET", "DEBIT", "Statutory liquid reserves deposited with central regulatory body"},

            // Liabilities (2000s)
            {"2010-DEMAND-DEPOSITS-SAVINGS", "Customer Savings Account Deposits", "LIABILITY", "CREDIT", "Demand deposit liability owed to retail savings account holders"},
            {"2020-DEMAND-DEPOSITS-CURRENT", "Commercial Current Account Deposits", "LIABILITY", "CREDIT", "Demand deposit liability owed to corporate current account holders"},
            {"2030-TERM-DEPOSITS-FD", "Term Fixed Deposit Liabilities", "LIABILITY", "CREDIT", "Fixed time deposit commitments with contracted maturities"},
            {"2040-RECURRING-DEPOSITS-RD", "Recurring Deposit Liabilities", "LIABILITY", "CREDIT", "Monthly installment term deposit commitments"},
            {"2050-INTER-BRANCH-PAYABLE", "Due to Other Branches (Clearing)", "LIABILITY", "CREDIT", "Clearing obligations payable to counterparty branches"},

            // Equity (3000s)
            {"3010-SHARE-CAPITAL", "Apex Bank Paid-Up Equity Capital", "EQUITY", "CREDIT", "Tier-1 regulatory paid-up equity capital"},
            {"3020-RETAINED-EARNINGS", "Statutory Reserves & Retained Surplus", "EQUITY", "CREDIT", "Cumulative audited banking earnings retained in reserve fund"},

            // Revenue (4000s)
            {"4010-INTEREST-INCOME-LOANS", "Interest Income on Credit Advances", "REVENUE", "CREDIT", "Interest revenue earned from retail and commercial loan servicing"},
            {"4020-FEE-COMMISSION-INCOME", "Transaction Processing & Service Fees", "REVENUE", "CREDIT", "Interbank transfer clearing fees, penalties, and commissions"},

            // Expenses (5000s)
            {"5010-INTEREST-EXPENSE-DEPOSITS", "Interest Paid on Customer Deposits", "EXPENSE", "DEBIT", "Quarterly interest expense credited to customer savings & term accounts"},
            {"5020-OPERATING-EXPENSES", "Branch Operations & Administration", "EXPENSE", "DEBIT", "General operational overhead, IT infrastructure, and branch facilities"}
        };

        for (String[] def : coaDefs) {
            glAccountRepository.findByAccountCode(def[0]).orElseGet(() ->
                glAccountRepository.save(GLAccount.builder()
                    .accountCode(def[0])
                    .accountName(def[1])
                    .classification(AccountClassification.valueOf(def[2]))
                    .normalBalance(def[3])
                    .currentBalance(BigDecimal.ZERO)
                    .currency("INR")
                    .isActive(true)
                    .description(def[4])
                    .build())
            );
        }

        // Seed Accounting Rule Mappings
        String[][] ruleDefs = {
            {"CASH_DEPOSIT", "1010-CASH-VAULT", "2010-DEMAND-DEPOSITS-SAVINGS", "Cash received at branch counter credited to customer savings liability"},
            {"CASH_WITHDRAWAL", "2010-DEMAND-DEPOSITS-SAVINGS", "1010-CASH-VAULT", "Cash payout at branch counter debited from customer savings liability"},
            {"INTERNAL_TRANSFER", "2010-DEMAND-DEPOSITS-SAVINGS", "2010-DEMAND-DEPOSITS-SAVINGS", "Intrabank transfer between customer deposit accounts"},
            {"LOAN_DISBURSEMENT", "1020-LOANS-ADVANCES", "2010-DEMAND-DEPOSITS-SAVINGS", "Sanctioned loan advance credited to customer savings deposit account"},
            {"FD_CREATION", "2010-DEMAND-DEPOSITS-SAVINGS", "2030-TERM-DEPOSITS-FD", "Customer savings deposit transferred to Term Fixed Deposit commitment"},
            {"LOAN_REPAYMENT", "2010-DEMAND-DEPOSITS-SAVINGS", "1020-LOANS-ADVANCES", "Customer monthly repayment reducing outstanding credit advance"},
            {"NEFT_TRANSFER_OUTWARD", "2010-DEMAND-DEPOSITS-SAVINGS", "1040-RBI-RESERVE-BALANCE", "Outward NEFT electronic settlement via RBI clearing account"},
            {"RTGS_TRANSFER_OUTWARD", "2010-DEMAND-DEPOSITS-SAVINGS", "1040-RBI-RESERVE-BALANCE", "Outward RTGS high-value settlement via RBI central gross accounts"},
            {"IMPS_TRANSFER_OUTWARD", "2010-DEMAND-DEPOSITS-SAVINGS", "1040-RBI-RESERVE-BALANCE", "Outward IMPS 24x7 settlement via NPCI switch account"},
            {"PAYMENT_FEE", "2010-DEMAND-DEPOSITS-SAVINGS", "4020-FEE-COMMISSION-INCOME", "Electronic payment rail transaction processing fee"}
        };

        for (String[] r : ruleDefs) {
            ruleMappingRepository.findByEventCodeAndIsActiveTrue(r[0]).orElseGet(() ->
                ruleMappingRepository.save(AccountingRuleMapping.builder()
                    .eventCode(r[0])
                    .debitAccountCode(r[1])
                    .creditAccountCode(r[2])
                    .description(r[3])
                    .isActive(true)
                    .build())
            );
        }

        // Seed Initial Open Accounting Period
        LocalDate now = LocalDate.now();
        String periodName = "PERIOD-" + now.format(DateTimeFormatter.ofPattern("yyyyMM"));
        accountingPeriodRepository.findByPeriodName(periodName).orElseGet(() ->
            accountingPeriodRepository.save(AccountingPeriod.builder()
                .periodName(periodName)
                .periodType("MONTHLY")
                .startDate(now.withDayOfMonth(1))
                .endDate(now.withDayOfMonth(now.lengthOfMonth()))
                .status("OPEN")
                .build())
        );

        log.info("Institutional Chart of Accounts & Rule Mappings successfully initialized!");
    }

    private void seedRegulatoryAndLiquidityManagement() {
        if (regulatoryConfigRepository.count() > 0 && eligibleLiquidAssetRepository.count() > 0) {
            log.info("Regulatory and Liquidity Management records already populated.");
            return;
        }

        log.info("Seeding institutional Regulatory Configurations, Reporting Fortnights, and Sovereign Liquid Assets...");

        // 1. Seed Configurable Regulatory Rates (RBI Act & BR Act)
        String[][] regConfigs = {
            {"CRR_RATE", "Cash Reserve Ratio", "4.5000", "%", "2026-04-01", "RBI/2026-27/04 DOR.RET.REC.09/12.01.001/2026-27 Section 42(1) RBI Act", "Statutory minimum cash reserves maintained with Reserve Bank of India as a percentage of NDTL"},
            {"SLR_RATE", "Statutory Liquidity Ratio", "18.0000", "%", "2026-04-01", "RBI/2026-27/08 DOR.RET.REC.15/12.02.001/2026-27 Section 24 BR Act", "Mandatory unencumbered liquid assets maintained in approved sovereign securities, treasury bills, and cash"},
            {"MIN_DAILY_CRR_MAINTENANCE_PCT", "Minimum Daily CRR Requirement", "90.0000", "%", "2026-04-01", "RBI Master Direction - Reserve Requirements 2026", "Mandatory minimum daily balance of CRR required to be held with RBI on any single business day"},
            {"PENAL_INTEREST_RATE_CRR_DEFICIT", "Penal Interest Rate for CRR Deficit", "3.0000", "%", "2026-04-01", "Section 42(3) of RBI Act, 1934", "Penal interest charged over Bank Rate for default in maintenance of prescribed cash reserves"}
        };

        for (String[] c : regConfigs) {
            regulatoryConfigRepository.findByParameterKey(c[0]).orElseGet(() ->
                regulatoryConfigRepository.save(com.apexbank.entity.regulatory.RegulatoryConfig.builder()
                    .parameterKey(c[0])
                    .parameterName(c[1])
                    .parameterValue(new BigDecimal(c[2]))
                    .unit(c[3])
                    .effectiveDate(LocalDate.parse(c[4]))
                    .sourceCircularReference(c[5])
                    .description(c[6])
                    .isActive(true)
                    .updatedBy("RBI_STATUTORY_DIRECTIVE")
                    .build())
            );
        }

        // 2. Seed Eligible Sovereign Liquid Assets for SLR
        if (eligibleLiquidAssetRepository.count() == 0) {
            LocalDate today = LocalDate.now();
            List<com.apexbank.entity.regulatory.EligibleLiquidAsset> assets = List.of(
                com.apexbank.entity.regulatory.EligibleLiquidAsset.builder()
                    .assetIdentifier("IN0020230085")
                    .assetName("7.18% Central Government Security 2033 (Benchmark G-Sec)")
                    .assetType("CENTRAL_GOVT_SECURITY")
                    .faceValue(new BigDecimal("2500000000.00"))
                    .bookValue(new BigDecimal("2485000000.00"))
                    .marketValue(new BigDecimal("2512000000.00"))
                    .couponRate(new BigDecimal("7.1800"))
                    .maturityDate(LocalDate.of(2033, 8, 14))
                    .isEncumbered(false)
                    .custodyDepository("RBI_SGL_ACCOUNT")
                    .valuationDate(today)
                    .build(),
                com.apexbank.entity.regulatory.EligibleLiquidAsset.builder()
                    .assetIdentifier("IN0020210012")
                    .assetName("6.54% Central Government Security 2032")
                    .assetType("CENTRAL_GOVT_SECURITY")
                    .faceValue(new BigDecimal("1200000000.00"))
                    .bookValue(new BigDecimal("1180000000.00"))
                    .marketValue(new BigDecimal("1195000000.00"))
                    .couponRate(new BigDecimal("6.5400"))
                    .maturityDate(LocalDate.of(2032, 1, 17))
                    .isEncumbered(false)
                    .custodyDepository("RBI_SGL_ACCOUNT")
                    .valuationDate(today)
                    .build(),
                com.apexbank.entity.regulatory.EligibleLiquidAsset.builder()
                    .assetIdentifier("IN1920230114")
                    .assetName("7.42% Maharashtra State Development Loan (SDL) 2033")
                    .assetType("STATE_DEV_LOAN")
                    .faceValue(new BigDecimal("600000000.00"))
                    .bookValue(new BigDecimal("598000000.00"))
                    .marketValue(new BigDecimal("602500000.00"))
                    .couponRate(new BigDecimal("7.4200"))
                    .maturityDate(LocalDate.of(2033, 11, 22))
                    .isEncumbered(false)
                    .custodyDepository("RBI_SGL_ACCOUNT")
                    .valuationDate(today)
                    .build(),
                com.apexbank.entity.regulatory.EligibleLiquidAsset.builder()
                    .assetIdentifier("IN002023X048")
                    .assetName("Government of India 91-Day Treasury Bill")
                    .assetType("TREASURY_BILL")
                    .faceValue(new BigDecimal("400000000.00"))
                    .bookValue(new BigDecimal("393200000.00"))
                    .marketValue(new BigDecimal("396800000.00"))
                    .couponRate(new BigDecimal("6.8500"))
                    .maturityDate(today.plusDays(45))
                    .isEncumbered(false)
                    .custodyDepository("CLEARING_CORP_OF_INDIA")
                    .valuationDate(today)
                    .build()
            );
            eligibleLiquidAssetRepository.saveAll(assets);
        }

        // 3. Seed Regulatory Reporting Fortnights
        if (regulatoryReportingPeriodRepository.count() == 0) {
            LocalDate today = LocalDate.now();
            List<com.apexbank.entity.regulatory.RegulatoryReportingPeriod> periods = List.of(
                com.apexbank.entity.regulatory.RegulatoryReportingPeriod.builder()
                    .periodName("RRF-2026-NOV-F1")
                    .fortnightNumber(23)
                    .reportingStartDate(today.withDayOfMonth(1))
                    .reportingEndDate(today.withDayOfMonth(14))
                    .submissionDeadline(today.withDayOfMonth(21))
                    .reportingStatus("SIMULATED_REPORTED")
                    .ndtlBasisAmount(new BigDecimal("1845200000.00"))
                    .formASubmittedAt(LocalDateTime.now().minusDays(1))
                    .submittedBy("COMPLIANCE_DIRECTOR")
                    .build(),
                com.apexbank.entity.regulatory.RegulatoryReportingPeriod.builder()
                    .periodName("RRF-2026-NOV-F2")
                    .fortnightNumber(24)
                    .reportingStartDate(today.withDayOfMonth(15))
                    .reportingEndDate(today.withDayOfMonth(today.lengthOfMonth()))
                    .submissionDeadline(today.plusMonths(1).withDayOfMonth(7))
                    .reportingStatus("ACTIVE_ACCUMULATING")
                    .ndtlBasisAmount(null)
                    .build()
            );
            regulatoryReportingPeriodRepository.saveAll(periods);
        }

        log.info("Institutional Regulatory and Liquidity Management records successfully initialized!");
    }
}
