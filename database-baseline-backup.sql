-- =====================================================
-- APEX NATIONAL BANK (BMS v2.4) - DATABASE BASELINE BACKUP
-- Created for Phase 1 Safety Audit
-- Host: TiDB Cloud Serverless (enterprise_bank_db)
-- Timestamp: Sun Nov 15 12:15:24 IST 2026
-- =====================================================

-- Table structure for table: account_status_history
CREATE TABLE `account_status_history` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `changed_at` datetime NOT NULL,
  `changed_by` varchar(50) NOT NULL,
  `new_status` varchar(30) NOT NULL,
  `previous_status` varchar(30) DEFAULT NULL,
  `reason` varchar(255) DEFAULT NULL,
  `account_id` bigint NOT NULL,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  KEY `FK2ffpvaehihhxn3e0p68ng6hsi` (`account_id`),
  CONSTRAINT `FK2ffpvaehihhxn3e0p68ng6hsi` FOREIGN KEY (`account_id`) REFERENCES `bank_accounts` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Table structure for table: approval_requests
CREATE TABLE `approval_requests` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL,
  `created_by` varchar(255) DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `updated_by` varchar(255) DEFAULT NULL,
  `version` bigint DEFAULT NULL,
  `amount` decimal(18,2) DEFAULT NULL,
  `checker_remarks` varchar(255) DEFAULT NULL,
  `decided_at` datetime DEFAULT NULL,
  `maker_remarks` varchar(255) DEFAULT NULL,
  `payload_json` text DEFAULT NULL,
  `request_type` varchar(50) NOT NULL,
  `requested_at` datetime NOT NULL,
  `status` varchar(30) NOT NULL,
  `target_entity_id` bigint DEFAULT NULL,
  `target_entity_name` varchar(50) DEFAULT NULL,
  `branch_id` bigint DEFAULT NULL,
  `checker_id` bigint DEFAULT NULL,
  `maker_id` bigint NOT NULL,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  KEY `FK4dl7w8orf87h87l8y3gkkkg3h` (`branch_id`),
  KEY `FK1hebplryj0b4rhri36fvtikk6` (`checker_id`),
  KEY `FKf4xadqpgsg06wtakwqu4igyuy` (`maker_id`),
  CONSTRAINT `FK4dl7w8orf87h87l8y3gkkkg3h` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`),
  CONSTRAINT `FK1hebplryj0b4rhri36fvtikk6` FOREIGN KEY (`checker_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKf4xadqpgsg06wtakwqu4igyuy` FOREIGN KEY (`maker_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin AUTO_INCREMENT=30001;

-- Table structure for table: audit_logs
CREATE TABLE `audit_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `action` varchar(100) NOT NULL,
  `branch_id` bigint DEFAULT NULL,
  `branch_name` varchar(120) DEFAULT NULL,
  `correlation_id` varchar(64) DEFAULT NULL,
  `details` text DEFAULT NULL,
  `event_timestamp` datetime NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `module` varchar(80) NOT NULL,
  `reference_id` varchar(100) DEFAULT NULL,
  `status` varchar(30) DEFAULT NULL,
  `user_id` bigint DEFAULT NULL,
  `user_role` varchar(50) DEFAULT NULL,
  `username` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  KEY `idx_audit_user` (`user_id`),
  KEY `idx_audit_branch` (`branch_id`),
  KEY `idx_audit_timestamp` (`event_timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin AUTO_INCREMENT=210001;

-- Table structure for table: bank_accounts
CREATE TABLE `bank_accounts` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL,
  `created_by` varchar(255) DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `updated_by` varchar(255) DEFAULT NULL,
  `version` bigint DEFAULT NULL,
  `account_number` varchar(30) NOT NULL,
  `account_type` enum('CURRENT','FIXED_DEPOSIT','RECURRING_DEPOSIT','SALARY','SAVINGS') NOT NULL,
  `available_balance` decimal(18,2) NOT NULL,
  `balance` decimal(18,2) NOT NULL,
  `closed_date` datetime DEFAULT NULL,
  `currency` varchar(10) NOT NULL,
  `daily_transfer_limit` decimal(18,2) DEFAULT NULL,
  `daily_withdrawal_limit` decimal(18,2) DEFAULT NULL,
  `freeze_reason` varchar(255) DEFAULT NULL,
  `interest_rate` decimal(5,2) DEFAULT NULL,
  `opened_date` datetime DEFAULT NULL,
  `status` varchar(30) NOT NULL,
  `branch_id` bigint NOT NULL,
  `customer_id` bigint NOT NULL,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  UNIQUE KEY `UKr9gi1et82prjsig51uqxj2qm6` (`account_number`),
  KEY `FK4dfphvjoinwhdikx70y7w2aaq` (`branch_id`),
  KEY `FKp50dmd8rost9bdqfvosjihkv7` (`customer_id`),
  CONSTRAINT `FK4dfphvjoinwhdikx70y7w2aaq` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`),
  CONSTRAINT `FKp50dmd8rost9bdqfvosjihkv7` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin AUTO_INCREMENT=30001;

-- Table structure for table: banking_configurations
CREATE TABLE `banking_configurations` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `config_key` varchar(80) NOT NULL,
  `config_value` varchar(255) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `updated_by` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  UNIQUE KEY `UKr8vx6qabkq7orj5sddikscwpi` (`config_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Table structure for table: beneficiaries
CREATE TABLE `beneficiaries` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL,
  `created_by` varchar(255) DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `updated_by` varchar(255) DEFAULT NULL,
  `version` bigint DEFAULT NULL,
  `account_number` varchar(40) NOT NULL,
  `bank_name` varchar(100) DEFAULT NULL,
  `beneficiary_name` varchar(120) NOT NULL,
  `branch_name` varchar(100) DEFAULT NULL,
  `cooling_period_ends_at` datetime DEFAULT NULL,
  `ifsc_code` varchar(20) NOT NULL,
  `status` varchar(30) NOT NULL,
  `transfer_limit` decimal(18,2) DEFAULT NULL,
  `customer_id` bigint NOT NULL,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  KEY `FKmm45xj9n6sed6pswp1iotl8dq` (`customer_id`),
  CONSTRAINT `FKmm45xj9n6sed6pswp1iotl8dq` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin AUTO_INCREMENT=30001;

-- Table structure for table: branches
CREATE TABLE `branches` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL,
  `created_by` varchar(255) DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `updated_by` varchar(255) DEFAULT NULL,
  `version` bigint DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `branch_code` varchar(30) NOT NULL,
  `cash_vault_balance` decimal(18,2) DEFAULT NULL,
  `city` varchar(80) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `ifsc_code` varchar(20) NOT NULL,
  `is_head_office` bit(1) NOT NULL,
  `name` varchar(120) NOT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `postal_code` varchar(20) DEFAULT NULL,
  `state` varchar(80) DEFAULT NULL,
  `status` varchar(30) NOT NULL,
  `region_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  UNIQUE KEY `UKaqmyw20ht3aku27r3oorfaw43` (`branch_code`),
  UNIQUE KEY `UKqy9blvpuri947wgdqlxj4wlt4` (`ifsc_code`),
  KEY `FKuxn1ghyjts6nvfcr6awgdy4` (`region_id`),
  CONSTRAINT `FKuxn1ghyjts6nvfcr6awgdy4` FOREIGN KEY (`region_id`) REFERENCES `regions` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin AUTO_INCREMENT=30001;

-- Table structure for table: customer_documents
CREATE TABLE `customer_documents` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL,
  `created_by` varchar(255) DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `updated_by` varchar(255) DEFAULT NULL,
  `version` bigint DEFAULT NULL,
  `document_number` varchar(100) DEFAULT NULL,
  `document_type` varchar(50) NOT NULL,
  `document_url` varchar(255) DEFAULT NULL,
  `remarks` varchar(255) DEFAULT NULL,
  `verification_status` varchar(30) DEFAULT NULL,
  `customer_id` bigint NOT NULL,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  KEY `FKp8yxbfjsubcrp9pur4ejb9gtv` (`customer_id`),
  CONSTRAINT `FKp8yxbfjsubcrp9pur4ejb9gtv` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Table structure for table: customers
CREATE TABLE `customers` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL,
  `created_by` varchar(255) DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `updated_by` varchar(255) DEFAULT NULL,
  `version` bigint DEFAULT NULL,
  `aadhaar_number` varchar(30) DEFAULT NULL,
  `address_line1` varchar(255) DEFAULT NULL,
  `address_line2` varchar(255) DEFAULT NULL,
  `annual_income` decimal(18,2) DEFAULT NULL,
  `city` varchar(80) DEFAULT NULL,
  `country` varchar(50) DEFAULT NULL,
  `customer_number` varchar(30) NOT NULL,
  `date_of_birth` varchar(30) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `full_name` varchar(120) NOT NULL,
  `gender` varchar(20) DEFAULT NULL,
  `kyc_status` varchar(30) NOT NULL,
  `kyc_verified_at` datetime DEFAULT NULL,
  `occupation` varchar(80) DEFAULT NULL,
  `pan_number` varchar(30) DEFAULT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `postal_code` varchar(20) DEFAULT NULL,
  `risk_category` varchar(30) NOT NULL,
  `state` varchar(80) DEFAULT NULL,
  `status` varchar(30) NOT NULL,
  `primary_branch_id` bigint DEFAULT NULL,
  `user_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  UNIQUE KEY `UKt74y58jagthxqxysuw9l0jx6y` (`customer_number`),
  UNIQUE KEY `UKeuat1oase6eqv195jvb71a93s` (`user_id`),
  KEY `FKsah981lw9hgkv57qv8u6l6tcq` (`primary_branch_id`),
  CONSTRAINT `FKsah981lw9hgkv57qv8u6l6tcq` FOREIGN KEY (`primary_branch_id`) REFERENCES `branches` (`id`),
  CONSTRAINT `FKrh1g1a20omjmn6kurd35o3eit` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin AUTO_INCREMENT=30001;

-- Table structure for table: employees
CREATE TABLE `employees` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL,
  `created_by` varchar(255) DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `updated_by` varchar(255) DEFAULT NULL,
  `version` bigint DEFAULT NULL,
  `department` varchar(80) DEFAULT NULL,
  `designation` varchar(80) NOT NULL,
  `employee_code` varchar(50) NOT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `salary` decimal(18,2) DEFAULT NULL,
  `status` varchar(30) NOT NULL,
  `branch_id` bigint DEFAULT NULL,
  `reporting_manager_id` bigint DEFAULT NULL,
  `user_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  UNIQUE KEY `UKetqhw9qqnad1kyjq3ks1glw8x` (`employee_code`),
  UNIQUE KEY `UKj2dmgsma6pont6kf7nic9elpd` (`user_id`),
  KEY `FKmef7fp4oyblw7d2y3g1whac3o` (`branch_id`),
  KEY `FKj5dawmyfw3dmtixnsrr6cbk63` (`reporting_manager_id`),
  CONSTRAINT `FKmef7fp4oyblw7d2y3g1whac3o` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`),
  CONSTRAINT `FKj5dawmyfw3dmtixnsrr6cbk63` FOREIGN KEY (`reporting_manager_id`) REFERENCES `employees` (`id`),
  CONSTRAINT `FK69x3vjuy1t5p18a5llb8h2fjx` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin AUTO_INCREMENT=30001;

-- Table structure for table: fixed_deposits
CREATE TABLE `fixed_deposits` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL,
  `created_by` varchar(255) DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `updated_by` varchar(255) DEFAULT NULL,
  `version` bigint DEFAULT NULL,
  `auto_renew` bit(1) NOT NULL,
  `certificate_number` varchar(40) NOT NULL,
  `deposit_amount` decimal(18,2) NOT NULL,
  `deposit_date` datetime NOT NULL,
  `interest_rate` decimal(5,2) NOT NULL,
  `maturity_amount` decimal(18,2) NOT NULL,
  `maturity_date` datetime NOT NULL,
  `status` varchar(30) NOT NULL,
  `tenure_months` int NOT NULL,
  `branch_id` bigint NOT NULL,
  `customer_id` bigint NOT NULL,
  `source_account_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  UNIQUE KEY `UKo8it65sp4nv0ghd33jytud71a` (`certificate_number`),
  KEY `FK18sr2gtdsc8shqg4w94cik1mq` (`branch_id`),
  KEY `FK8uxlxbt7lw4y80xquk0aclws1` (`customer_id`),
  KEY `FK6nwew3we06a7o3lrjn9rekv1q` (`source_account_id`),
  CONSTRAINT `FK18sr2gtdsc8shqg4w94cik1mq` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`),
  CONSTRAINT `FK8uxlxbt7lw4y80xquk0aclws1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`),
  CONSTRAINT `FK6nwew3we06a7o3lrjn9rekv1q` FOREIGN KEY (`source_account_id`) REFERENCES `bank_accounts` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin AUTO_INCREMENT=30001;

-- Table structure for table: loan_applications
CREATE TABLE `loan_applications` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL,
  `created_by` varchar(255) DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `updated_by` varchar(255) DEFAULT NULL,
  `version` bigint DEFAULT NULL,
  `application_date` datetime NOT NULL,
  `application_number` varchar(50) NOT NULL,
  `credit_score` int DEFAULT NULL,
  `loan_type` varchar(40) NOT NULL,
  `monthly_income` decimal(18,2) DEFAULT NULL,
  `purpose` varchar(255) DEFAULT NULL,
  `remarks` varchar(255) DEFAULT NULL,
  `requested_amount` decimal(18,2) NOT NULL,
  `requested_tenure_months` int NOT NULL,
  `status` varchar(30) NOT NULL,
  `assigned_officer_id` bigint DEFAULT NULL,
  `branch_id` bigint NOT NULL,
  `customer_id` bigint NOT NULL,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  UNIQUE KEY `UKlmmebb2xnyy3oghe068hwcc1x` (`application_number`),
  KEY `FKs7ljqh0b7vv3vjwt1cb9dywdl` (`assigned_officer_id`),
  KEY `FKj1u3a9qyuwkbayi44rg0gbj1x` (`branch_id`),
  KEY `FKs6p85101r2lbn61hmgth4kwg2` (`customer_id`),
  CONSTRAINT `FKs7ljqh0b7vv3vjwt1cb9dywdl` FOREIGN KEY (`assigned_officer_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKj1u3a9qyuwkbayi44rg0gbj1x` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`),
  CONSTRAINT `FKs6p85101r2lbn61hmgth4kwg2` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin AUTO_INCREMENT=30001;

-- Table structure for table: loan_repayments
CREATE TABLE `loan_repayments` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `due_date` datetime NOT NULL,
  `emi_amount` decimal(18,2) NOT NULL,
  `installment_number` int NOT NULL,
  `interest_component` decimal(18,2) DEFAULT NULL,
  `paid_date` datetime DEFAULT NULL,
  `penalty_amount` decimal(18,2) DEFAULT NULL,
  `principal_component` decimal(18,2) DEFAULT NULL,
  `status` varchar(30) NOT NULL,
  `loan_id` bigint NOT NULL,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  KEY `FKmvfjvk48bhsvwbdis0s9uwn1t` (`loan_id`),
  CONSTRAINT `FKmvfjvk48bhsvwbdis0s9uwn1t` FOREIGN KEY (`loan_id`) REFERENCES `loans` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin AUTO_INCREMENT=30001;

-- Table structure for table: loans
CREATE TABLE `loans` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL,
  `created_by` varchar(255) DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `updated_by` varchar(255) DEFAULT NULL,
  `version` bigint DEFAULT NULL,
  `interest_rate` decimal(5,2) NOT NULL,
  `loan_account_number` varchar(40) NOT NULL,
  `loan_type` varchar(40) NOT NULL,
  `maturity_date` datetime DEFAULT NULL,
  `monthly_emi` decimal(18,2) NOT NULL,
  `next_due_date` datetime DEFAULT NULL,
  `outstanding_principal` decimal(18,2) NOT NULL,
  `principal_amount` decimal(18,2) NOT NULL,
  `sanctioned_date` datetime DEFAULT NULL,
  `status` varchar(30) NOT NULL,
  `tenure_months` int NOT NULL,
  `total_interest` decimal(18,2) DEFAULT NULL,
  `total_payable` decimal(18,2) DEFAULT NULL,
  `branch_id` bigint NOT NULL,
  `customer_id` bigint NOT NULL,
  `loan_application_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  UNIQUE KEY `UKed3cs76y2fs1gm0guxj0jn5rd` (`loan_account_number`),
  UNIQUE KEY `UKkckam2gpweq2tsh67kghe8ih6` (`loan_application_id`),
  KEY `FKkdlfyotxm4afvu9pk8ismc2ii` (`branch_id`),
  KEY `FK3s60kbg0a404doyf8ii6qwb9g` (`customer_id`),
  CONSTRAINT `FKkdlfyotxm4afvu9pk8ismc2ii` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`),
  CONSTRAINT `FK3s60kbg0a404doyf8ii6qwb9g` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`),
  CONSTRAINT `FK48lba6mtncmcu7jiuoh041dr7` FOREIGN KEY (`loan_application_id`) REFERENCES `loan_applications` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin AUTO_INCREMENT=30001;

-- Table structure for table: login_history
CREATE TABLE `login_history` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `failure_reason` varchar(150) DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `login_status` varchar(20) NOT NULL,
  `login_time` datetime NOT NULL,
  `user_agent` varchar(255) DEFAULT NULL,
  `user_id` bigint DEFAULT NULL,
  `username` varchar(50) NOT NULL,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin AUTO_INCREMENT=210001;

-- Table structure for table: notifications
CREATE TABLE `notifications` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `category` varchar(30) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `message` varchar(500) NOT NULL,
  `read_status` bit(1) NOT NULL,
  `title` varchar(120) NOT NULL,
  `user_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  KEY `FK9y21adhxn0ayjhfocscqox7bh` (`user_id`),
  CONSTRAINT `FK9y21adhxn0ayjhfocscqox7bh` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Table structure for table: permissions
CREATE TABLE `permissions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL,
  `created_by` varchar(255) DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `updated_by` varchar(255) DEFAULT NULL,
  `version` bigint DEFAULT NULL,
  `code` varchar(100) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `module` varchar(80) NOT NULL,
  `name` varchar(150) NOT NULL,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  UNIQUE KEY `UK7lcb6glmvwlro3p2w2cewxtvd` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin AUTO_INCREMENT=30001;

-- Table structure for table: recurring_deposits
CREATE TABLE `recurring_deposits` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL,
  `created_by` varchar(255) DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `updated_by` varchar(255) DEFAULT NULL,
  `version` bigint DEFAULT NULL,
  `interest_rate` decimal(5,2) NOT NULL,
  `maturity_amount` decimal(18,2) NOT NULL,
  `monthly_installment` decimal(18,2) NOT NULL,
  `next_installment_date` datetime DEFAULT NULL,
  `status` varchar(30) NOT NULL,
  `tenure_months` int NOT NULL,
  `account_id` bigint NOT NULL,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  KEY `FKa3e2awcxu8m2webumjnxjsr2d` (`account_id`),
  CONSTRAINT `FKa3e2awcxu8m2webumjnxjsr2d` FOREIGN KEY (`account_id`) REFERENCES `bank_accounts` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Table structure for table: regions
CREATE TABLE `regions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL,
  `created_by` varchar(255) DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `updated_by` varchar(255) DEFAULT NULL,
  `version` bigint DEFAULT NULL,
  `code` varchar(20) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `name` varchar(100) NOT NULL,
  `status` varchar(30) NOT NULL,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  UNIQUE KEY `UK375c9j7h9mbq52nyh2m7xyqwp` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin AUTO_INCREMENT=30001;

-- Table structure for table: role_permissions
CREATE TABLE `role_permissions` (
  `role_id` bigint NOT NULL,
  `permission_id` bigint NOT NULL,
  PRIMARY KEY (`role_id`,`permission_id`) /*T![clustered_index] CLUSTERED */,
  KEY `FKegdk29eiy7mdtefy5c7eirr6e` (`permission_id`),
  CONSTRAINT `FKegdk29eiy7mdtefy5c7eirr6e` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`),
  CONSTRAINT `FKn5fotdgk8d1xvo8nav9uv3muc` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Table structure for table: roles
CREATE TABLE `roles` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL,
  `created_by` varchar(255) DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `updated_by` varchar(255) DEFAULT NULL,
  `version` bigint DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `name` enum('AUDITOR','BANK_EMPLOYEE','BRANCH_MANAGER','CASHIER','CUSTOMER','HEAD_OFFICE_ADMIN','LOAN_OFFICER','REGIONAL_MANAGER','SUPER_ADMIN') NOT NULL,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  UNIQUE KEY `UKofx66keruapi6vyqpv6f2or37` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin AUTO_INCREMENT=30001;

-- Table structure for table: transaction_ledger_entries
CREATE TABLE `transaction_ledger_entries` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `amount` decimal(18,2) NOT NULL,
  `entry_timestamp` datetime NOT NULL,
  `entry_type` varchar(10) NOT NULL,
  `running_balance` decimal(18,2) NOT NULL,
  `account_id` bigint NOT NULL,
  `transaction_id` bigint NOT NULL,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  KEY `FKg1j8ore6d1h9kgpaf4883ru66` (`account_id`),
  KEY `FKcmbf7rawn1ghnoti750ehgf3j` (`transaction_id`),
  CONSTRAINT `FKg1j8ore6d1h9kgpaf4883ru66` FOREIGN KEY (`account_id`) REFERENCES `bank_accounts` (`id`),
  CONSTRAINT `FKcmbf7rawn1ghnoti750ehgf3j` FOREIGN KEY (`transaction_id`) REFERENCES `transactions` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin AUTO_INCREMENT=30001;

-- Table structure for table: transactions
CREATE TABLE `transactions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL,
  `created_by` varchar(255) DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `updated_by` varchar(255) DEFAULT NULL,
  `version` bigint DEFAULT NULL,
  `amount` decimal(18,2) NOT NULL,
  `failure_reason` varchar(255) DEFAULT NULL,
  `fee` decimal(18,2) DEFAULT NULL,
  `idempotency_key` varchar(100) DEFAULT NULL,
  `narration` varchar(255) DEFAULT NULL,
  `payment_channel` varchar(40) DEFAULT NULL,
  `reference_number` varchar(64) NOT NULL,
  `status` enum('FAILED','INITIATED','PENDING_APPROVAL','REVERSED','SUCCESS') NOT NULL,
  `transaction_timestamp` datetime NOT NULL,
  `transaction_type` enum('CASH_DEPOSIT','CASH_WITHDRAWAL','EMI_REPAYMENT','FD_CREATION','INTERBANK_TRANSFER','INTEREST_CREDIT','INTERNAL_TRANSFER','LOAN_DISBURSEMENT') NOT NULL,
  `branch_id` bigint DEFAULT NULL,
  `destination_account_id` bigint DEFAULT NULL,
  `initiated_by_user_id` bigint DEFAULT NULL,
  `source_account_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  KEY `idx_txn_ref` (`reference_number`),
  KEY `idx_txn_idempotency` (`idempotency_key`),
  KEY `idx_txn_timestamp` (`transaction_timestamp`),
  UNIQUE KEY `UKe58eyb3fj0t2cl16q1ll436b7` (`idempotency_key`),
  UNIQUE KEY `UK96ogkdl6a4f18ybi32m3mi6h0` (`reference_number`),
  KEY `FKti961feu1yn980b0kebj16cxh` (`branch_id`),
  KEY `FKebblqd4jvtueix3992r5ephj2` (`destination_account_id`),
  KEY `FK2t3c9440feqvfxm9ofsvwnm36` (`initiated_by_user_id`),
  KEY `FK6qwhn8icuip4ftxvd3pq67dvg` (`source_account_id`),
  CONSTRAINT `FKti961feu1yn980b0kebj16cxh` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`),
  CONSTRAINT `FKebblqd4jvtueix3992r5ephj2` FOREIGN KEY (`destination_account_id`) REFERENCES `bank_accounts` (`id`),
  CONSTRAINT `FK2t3c9440feqvfxm9ofsvwnm36` FOREIGN KEY (`initiated_by_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FK6qwhn8icuip4ftxvd3pq67dvg` FOREIGN KEY (`source_account_id`) REFERENCES `bank_accounts` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin AUTO_INCREMENT=30001;

-- Table structure for table: user_roles
CREATE TABLE `user_roles` (
  `user_id` bigint NOT NULL,
  `role_id` bigint NOT NULL,
  PRIMARY KEY (`user_id`,`role_id`) /*T![clustered_index] CLUSTERED */,
  KEY `FKh8ciramu9cc9q3qcqiv4ue8a6` (`role_id`),
  CONSTRAINT `FKh8ciramu9cc9q3qcqiv4ue8a6` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`),
  CONSTRAINT `FKhfh9dx7w3ubf1co1vdev94g3f` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Table structure for table: users
CREATE TABLE `users` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL,
  `created_by` varchar(255) DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `updated_by` varchar(255) DEFAULT NULL,
  `version` bigint DEFAULT NULL,
  `is_active` bit(1) NOT NULL,
  `designation` varchar(80) DEFAULT NULL,
  `email` varchar(100) NOT NULL,
  `employee_id` varchar(50) DEFAULT NULL,
  `failed_attempts` int DEFAULT NULL,
  `full_name` varchar(100) NOT NULL,
  `last_login` datetime DEFAULT NULL,
  `is_locked` bit(1) NOT NULL,
  `lockout_until` datetime DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `username` varchar(50) NOT NULL,
  `branch_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  UNIQUE KEY `UK6dotkott2kjsp8vw4d0m25fb7` (`email`),
  UNIQUE KEY `UKd1s31g1a7ilra77m65xmka3ei` (`employee_id`),
  UNIQUE KEY `UKr43af9ap4edm43mmtq01oddj6` (`username`),
  KEY `FK9o70sp9ku40077y38fk4wieyk` (`branch_id`),
  CONSTRAINT `FK9o70sp9ku40077y38fk4wieyk` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin AUTO_INCREMENT=30001;

