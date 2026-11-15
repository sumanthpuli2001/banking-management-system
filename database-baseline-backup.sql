-- =====================================================
-- APEX NATIONAL BANK (BMS v2.4) - DATABASE BASELINE BACKUP
-- Created for Phase 1 Safety Audit
-- Host: TiDB Cloud Serverless (enterprise_bank_db)
-- Timestamp: Sun Nov 15 15:51:12 IST 2026
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

-- Table structure for table: accounting_periods
CREATE TABLE `accounting_periods` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL,
  `created_by` varchar(255) DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `updated_by` varchar(255) DEFAULT NULL,
  `version` bigint DEFAULT NULL,
  `closed_at` datetime(6) DEFAULT NULL,
  `end_date` date NOT NULL,
  `period_name` varchar(60) NOT NULL,
  `period_type` varchar(20) NOT NULL,
  `start_date` date NOT NULL,
  `status` varchar(20) NOT NULL,
  `closed_by_user_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  UNIQUE KEY `UKmjb7uarsku2dnmuh6if3uox98` (`period_name`),
  KEY `FK5p76el8uuambb9p93r573ky42` (`closed_by_user_id`),
  CONSTRAINT `FK5p76el8uuambb9p93r573ky42` FOREIGN KEY (`closed_by_user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin AUTO_INCREMENT=30001;

-- Table structure for table: accounting_rule_mappings
CREATE TABLE `accounting_rule_mappings` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL,
  `created_by` varchar(255) DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `updated_by` varchar(255) DEFAULT NULL,
  `version` bigint DEFAULT NULL,
  `credit_account_code` varchar(50) NOT NULL,
  `debit_account_code` varchar(50) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `event_code` varchar(60) NOT NULL,
  `is_active` bit(1) NOT NULL,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  UNIQUE KEY `UKb2j97k9cd19e9r03xk1jjb225` (`event_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin AUTO_INCREMENT=30001;

-- Table structure for table: aml_alerts
CREATE TABLE `aml_alerts` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL,
  `created_by` varchar(255) DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `updated_by` varchar(255) DEFAULT NULL,
  `version` bigint DEFAULT NULL,
  `account_number` varchar(40) DEFAULT NULL,
  `alert_number` varchar(50) NOT NULL,
  `assigned_officer` varchar(60) DEFAULT NULL,
  `closed_timestamp` datetime(6) DEFAULT NULL,
  `closure_reason` varchar(255) DEFAULT NULL,
  `customer_id` bigint NOT NULL,
  `customer_name` varchar(120) DEFAULT NULL,
  `customer_number` varchar(40) DEFAULT NULL,
  `customer_risk_category` varchar(30) DEFAULT NULL,
  `detected_timestamp` datetime(6) NOT NULL,
  `detection_score` int DEFAULT NULL,
  `escalated_timestamp` datetime(6) DEFAULT NULL,
  `fiu_str_reference` varchar(80) DEFAULT NULL,
  `rule_code` varchar(50) NOT NULL,
  `rule_name` varchar(120) NOT NULL,
  `severity` varchar(20) NOT NULL,
  `status` varchar(30) NOT NULL,
  `transaction_amount` decimal(18,4) DEFAULT NULL,
  `transaction_reference` varchar(64) DEFAULT NULL,
  `transaction_type` varchar(40) DEFAULT NULL,
  `trigger_details` text DEFAULT NULL,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  KEY `idx_aml_status` (`status`),
  KEY `idx_aml_severity` (`severity`),
  KEY `idx_aml_cust` (`customer_id`),
  UNIQUE KEY `idx_aml_alert_num` (`alert_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Table structure for table: aml_case_notes
CREATE TABLE `aml_case_notes` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL,
  `created_by` varchar(255) DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `updated_by` varchar(255) DEFAULT NULL,
  `version` bigint DEFAULT NULL,
  `action_taken` varchar(60) NOT NULL,
  `alert_id` bigint NOT NULL,
  `author_username` varchar(60) NOT NULL,
  `is_confidential` bit(1) DEFAULT NULL,
  `note_text` text NOT NULL,
  `recorded_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  KEY `idx_case_note_alert` (`alert_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Table structure for table: aml_rule_configs
CREATE TABLE `aml_rule_configs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL,
  `created_by` varchar(255) DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `updated_by` varchar(255) DEFAULT NULL,
  `version` bigint DEFAULT NULL,
  `description` text DEFAULT NULL,
  `effective_from` datetime(6) DEFAULT NULL,
  `is_active` bit(1) NOT NULL,
  `is_regulatory_report_required` bit(1) DEFAULT NULL,
  `lookback_hours` int DEFAULT NULL,
  `multiplier` decimal(6,2) DEFAULT NULL,
  `rule_code` varchar(60) NOT NULL,
  `rule_name` varchar(120) NOT NULL,
  `severity` varchar(20) NOT NULL,
  `statutory_reference` varchar(120) DEFAULT NULL,
  `threshold_amount` decimal(18,2) DEFAULT NULL,
  `updated_by_officer` varchar(60) DEFAULT NULL,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  UNIQUE KEY `idx_aml_rule_code` (`rule_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin AUTO_INCREMENT=30001;

-- Table structure for table: approval_audit_logs
CREATE TABLE `approval_audit_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL,
  `created_by` varchar(255) DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `updated_by` varchar(255) DEFAULT NULL,
  `version` bigint DEFAULT NULL,
  `action` varchar(40) NOT NULL,
  `approval_request_id` bigint NOT NULL,
  `notes` varchar(500) DEFAULT NULL,
  `performed_by_role` varchar(50) DEFAULT NULL,
  `performed_by_username` varchar(50) NOT NULL,
  `recorded_at` datetime NOT NULL,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Table structure for table: approval_matrix_rules
CREATE TABLE `approval_matrix_rules` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL,
  `created_by` varchar(255) DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `updated_by` varchar(255) DEFAULT NULL,
  `version` bigint DEFAULT NULL,
  `auto_escalate_after_hours` int DEFAULT NULL,
  `description` varchar(300) DEFAULT NULL,
  `escalate_to_role` varchar(50) DEFAULT NULL,
  `expiry_hours` int NOT NULL,
  `is_active` bit(1) NOT NULL,
  `is_self_approval_allowed` bit(1) NOT NULL,
  `max_amount` decimal(18,2) DEFAULT NULL,
  `min_amount` decimal(18,2) DEFAULT NULL,
  `operation_type` varchar(50) NOT NULL,
  `required_checker_role` varchar(50) NOT NULL,
  `risk_category` varchar(20) NOT NULL,
  `rule_code` varchar(50) NOT NULL,
  `rule_name` varchar(100) NOT NULL,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  UNIQUE KEY `UK52g50waqcw90iyjhjj4ykqea6` (`rule_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin AUTO_INCREMENT=30001;

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
  `delegated_to_username` varchar(50) DEFAULT NULL,
  `escalated_at` datetime(6) DEFAULT NULL,
  `escalated_to_role` varchar(50) DEFAULT NULL,
  `expires_at` datetime DEFAULT NULL,
  `is_escalated` bit(1) NOT NULL,
  `rejection_reason` varchar(255) DEFAULT NULL,
  `required_role` varchar(50) DEFAULT NULL,
  `risk_level` varchar(20) DEFAULT NULL,
  `rule_code` varchar(50) DEFAULT NULL,
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin AUTO_INCREMENT=240001;

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

-- Table structure for table: cash_shortage_excess_records
CREATE TABLE `cash_shortage_excess_records` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL,
  `created_by` varchar(255) DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `updated_by` varchar(255) DEFAULT NULL,
  `version` bigint DEFAULT NULL,
  `expected_amount` decimal(19,2) NOT NULL,
  `incident_number` varchar(64) NOT NULL,
  `incident_type` varchar(20) NOT NULL,
  `investigation_notes` varchar(500) DEFAULT NULL,
  `physical_amount` decimal(19,2) NOT NULL,
  `reported_at` datetime(6) NOT NULL,
  `resolved_at` datetime(6) DEFAULT NULL,
  `status` varchar(30) NOT NULL,
  `variance_amount` decimal(19,2) NOT NULL,
  `branch_id` bigint NOT NULL,
  `cashier_user_id` bigint NOT NULL,
  `drawer_id` bigint DEFAULT NULL,
  `resolved_by_user_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  KEY `idx_var_inc_num` (`incident_number`),
  KEY `idx_var_status` (`status`),
  UNIQUE KEY `UK1sumrklcy7kygdygsnqi45r80` (`incident_number`),
  KEY `FKkhbncxxjmesugdwveml1xu5n` (`branch_id`),
  KEY `FKr4x836xvjrln0h2vt7oq8fs29` (`cashier_user_id`),
  KEY `FKfj6tjn935v8hfw1y7t4jsofh` (`drawer_id`),
  KEY `FKq11m6fg1aj3kyxq9vldcnbs10` (`resolved_by_user_id`),
  CONSTRAINT `FKkhbncxxjmesugdwveml1xu5n` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`),
  CONSTRAINT `FKr4x836xvjrln0h2vt7oq8fs29` FOREIGN KEY (`cashier_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKfj6tjn935v8hfw1y7t4jsofh` FOREIGN KEY (`drawer_id`) REFERENCES `teller_cash_drawers` (`id`),
  CONSTRAINT `FKq11m6fg1aj3kyxq9vldcnbs10` FOREIGN KEY (`resolved_by_user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

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

-- Table structure for table: customer_kyc_profiles
CREATE TABLE `customer_kyc_profiles` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL,
  `created_by` varchar(255) DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `updated_by` varchar(255) DEFAULT NULL,
  `version` bigint DEFAULT NULL,
  `aadhaar_verification_source` varchar(60) DEFAULT NULL,
  `aadhaar_verification_status` varchar(30) DEFAULT NULL,
  `address_verification_status` varchar(30) DEFAULT NULL,
  `cdd_status` varchar(30) NOT NULL,
  `customer_id` bigint NOT NULL,
  `document_expiry_date` date DEFAULT NULL,
  `edd_approved_at` datetime(6) DEFAULT NULL,
  `edd_approved_by` varchar(60) DEFAULT NULL,
  `edd_beneficial_ownership` text DEFAULT NULL,
  `edd_source_of_wealth` text DEFAULT NULL,
  `edd_status` varchar(30) NOT NULL,
  `is_pep` bit(1) NOT NULL,
  `kyc_notes` text DEFAULT NULL,
  `last_kyc_review_date` date DEFAULT NULL,
  `next_kyc_review_due_date` date DEFAULT NULL,
  `pan_verification_source` varchar(60) DEFAULT NULL,
  `pan_verification_status` varchar(30) DEFAULT NULL,
  `risk_category` varchar(20) NOT NULL,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  KEY `idx_kyc_due_date` (`next_kyc_review_due_date`),
  KEY `idx_kyc_edd_status` (`edd_status`),
  UNIQUE KEY `idx_kyc_cust_id` (`customer_id`)
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

-- Table structure for table: daily_closings
CREATE TABLE `daily_closings` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL,
  `created_by` varchar(255) DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `updated_by` varchar(255) DEFAULT NULL,
  `version` bigint DEFAULT NULL,
  `closed_at` datetime(6) NOT NULL,
  `closing_date` date NOT NULL,
  `discrepancy` decimal(19,4) NOT NULL,
  `expected_closing_cash` decimal(19,4) NOT NULL,
  `notes` varchar(500) DEFAULT NULL,
  `opening_cash` decimal(19,4) NOT NULL,
  `physical_cash_counted` decimal(19,4) NOT NULL,
  `status` varchar(30) NOT NULL,
  `total_cash_payments` decimal(19,4) NOT NULL,
  `total_cash_receipts` decimal(19,4) NOT NULL,
  `branch_id` bigint NOT NULL,
  `cashier_user_id` bigint DEFAULT NULL,
  `verified_by_user_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  KEY `FK2nqugs1v6jp6wmw92bity74u2` (`branch_id`),
  KEY `FK7q86v34gsqfkph1swkj3w58jt` (`cashier_user_id`),
  KEY `FKtf3jouvlshcdaa95lh3v6kgtg` (`verified_by_user_id`),
  CONSTRAINT `FK2nqugs1v6jp6wmw92bity74u2` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`),
  CONSTRAINT `FK7q86v34gsqfkph1swkj3w58jt` FOREIGN KEY (`cashier_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKtf3jouvlshcdaa95lh3v6kgtg` FOREIGN KEY (`verified_by_user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Table structure for table: deposit_products
CREATE TABLE `deposit_products` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL,
  `created_by` varchar(255) DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `updated_by` varchar(255) DEFAULT NULL,
  `version` bigint DEFAULT NULL,
  `base_interest_rate` decimal(5,2) NOT NULL,
  `compounding_frequency` varchar(20) NOT NULL,
  `deposit_type` varchar(30) NOT NULL,
  `description` varchar(300) DEFAULT NULL,
  `is_active` bit(1) NOT NULL,
  `is_tax_saver` bit(1) NOT NULL,
  `lock_in_months` int DEFAULT NULL,
  `max_amount` decimal(18,2) NOT NULL,
  `max_tenure_months` int NOT NULL,
  `min_amount` decimal(18,2) NOT NULL,
  `min_tenure_months` int NOT NULL,
  `premature_penalty_rate` decimal(5,2) NOT NULL,
  `product_code` varchar(40) NOT NULL,
  `product_name` varchar(100) NOT NULL,
  `senior_citizen_bonus_rate` decimal(5,2) NOT NULL,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  UNIQUE KEY `UKdg5sd9vbwn8ah7gpin97v0g6t` (`product_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin AUTO_INCREMENT=30001;

-- Table structure for table: eligible_liquid_assets
CREATE TABLE `eligible_liquid_assets` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `asset_identifier` varchar(50) NOT NULL,
  `asset_name` varchar(120) NOT NULL,
  `asset_type` varchar(50) NOT NULL,
  `book_value` decimal(18,4) NOT NULL,
  `coupon_rate` decimal(6,4) DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `custody_depository` varchar(80) DEFAULT NULL,
  `face_value` decimal(18,4) NOT NULL,
  `is_encumbered` bit(1) NOT NULL,
  `market_value` decimal(18,4) NOT NULL,
  `maturity_date` date DEFAULT NULL,
  `valuation_date` date NOT NULL,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  KEY `idx_ela_type` (`asset_type`),
  KEY `idx_ela_isin` (`asset_identifier`)
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

-- Table structure for table: eod_batch_runs
CREATE TABLE `eod_batch_runs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL,
  `created_by` varchar(255) DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `updated_by` varchar(255) DEFAULT NULL,
  `version` bigint DEFAULT NULL,
  `batch_date` date NOT NULL,
  `batch_type` varchar(20) NOT NULL,
  `branch_count_verified` int DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `initiated_by` varchar(50) DEFAULT NULL,
  `interest_accrual_total` decimal(18,2) DEFAULT NULL,
  `regulatory_reserve_calculated` bit(1) DEFAULT NULL,
  `started_at` datetime NOT NULL,
  `status` varchar(30) NOT NULL,
  `summary_notes` varchar(500) DEFAULT NULL,
  `unbalanced_entries_count` int DEFAULT NULL,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Table structure for table: eod_batch_steps
CREATE TABLE `eod_batch_steps` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL,
  `created_by` varchar(255) DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `updated_by` varchar(255) DEFAULT NULL,
  `version` bigint DEFAULT NULL,
  `batch_run_id` bigint NOT NULL,
  `details` varchar(500) DEFAULT NULL,
  `duration_ms` bigint DEFAULT NULL,
  `executed_at` datetime DEFAULT NULL,
  `status` varchar(30) NOT NULL,
  `step_code` varchar(60) NOT NULL,
  `step_name` varchar(100) NOT NULL,
  `step_number` int NOT NULL,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

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
  `accrued_interest` decimal(18,2) DEFAULT NULL,
  `closed_at` datetime(6) DEFAULT NULL,
  `closed_by_username` varchar(50) DEFAULT NULL,
  `compounding_frequency` varchar(20) DEFAULT NULL,
  `deposit_type` varchar(30) DEFAULT NULL,
  `installments_paid` int DEFAULT NULL,
  `is_senior_citizen` bit(1) DEFAULT NULL,
  `monthly_installment_amount` decimal(18,2) DEFAULT NULL,
  `nominee_name` varchar(100) DEFAULT NULL,
  `nominee_relation` varchar(50) DEFAULT NULL,
  `payout_account_number` varchar(34) DEFAULT NULL,
  `payout_amount` decimal(18,2) DEFAULT NULL,
  `penalty_deducted` decimal(18,2) DEFAULT NULL,
  `premature_penalty_rate` decimal(5,2) DEFAULT NULL,
  `product_code` varchar(40) DEFAULT NULL,
  `senior_citizen_bonus_rate` decimal(5,2) DEFAULT NULL,
  `tax_deducted_at_source` decimal(18,2) DEFAULT NULL,
  `tds_exemption_form_15g` bit(1) DEFAULT NULL,
  `total_installments` int DEFAULT NULL,
  `total_interest_payable` decimal(18,2) DEFAULT NULL,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  UNIQUE KEY `UKo8it65sp4nv0ghd33jytud71a` (`certificate_number`),
  KEY `FK18sr2gtdsc8shqg4w94cik1mq` (`branch_id`),
  KEY `FK8uxlxbt7lw4y80xquk0aclws1` (`customer_id`),
  KEY `FK6nwew3we06a7o3lrjn9rekv1q` (`source_account_id`),
  CONSTRAINT `FK18sr2gtdsc8shqg4w94cik1mq` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`),
  CONSTRAINT `FK8uxlxbt7lw4y80xquk0aclws1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`),
  CONSTRAINT `FK6nwew3we06a7o3lrjn9rekv1q` FOREIGN KEY (`source_account_id`) REFERENCES `bank_accounts` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin AUTO_INCREMENT=30001;

-- Table structure for table: gl_accounts
CREATE TABLE `gl_accounts` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL,
  `created_by` varchar(255) DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `updated_by` varchar(255) DEFAULT NULL,
  `version` bigint DEFAULT NULL,
  `account_code` varchar(50) NOT NULL,
  `account_name` varchar(150) NOT NULL,
  `classification` enum('ASSET','EQUITY','EXPENSE','LIABILITY','REVENUE') NOT NULL,
  `currency` varchar(10) NOT NULL,
  `current_balance` decimal(19,4) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `is_active` bit(1) NOT NULL,
  `normal_balance` varchar(10) NOT NULL,
  `branch_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  UNIQUE KEY `UKrdgur130frmj84stmgnyxq9ea` (`account_code`),
  KEY `FKoewwjkdfgckt2gjx76x1nfvx3` (`branch_id`),
  CONSTRAINT `FKoewwjkdfgckt2gjx76x1nfvx3` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin AUTO_INCREMENT=30001;

-- Table structure for table: inter_branch_cash_transfers
CREATE TABLE `inter_branch_cash_transfers` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL,
  `created_by` varchar(255) DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `updated_by` varchar(255) DEFAULT NULL,
  `version` bigint DEFAULT NULL,
  `amount` decimal(19,2) NOT NULL,
  `dispatch_remarks` varchar(500) DEFAULT NULL,
  `dispatched_at` datetime(6) NOT NULL,
  `receipt_remarks` varchar(500) DEFAULT NULL,
  `received_at` datetime(6) DEFAULT NULL,
  `security_seal_number` varchar(60) DEFAULT NULL,
  `status` varchar(30) NOT NULL,
  `transfer_number` varchar(64) NOT NULL,
  `transit_carrier` varchar(120) DEFAULT NULL,
  `destination_branch_id` bigint NOT NULL,
  `dispatching_officer_id` bigint NOT NULL,
  `receiving_officer_id` bigint DEFAULT NULL,
  `source_branch_id` bigint NOT NULL,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  KEY `idx_ibct_num` (`transfer_number`),
  KEY `idx_ibct_status` (`status`),
  UNIQUE KEY `UK5hg1niw5pymqdk23xgd3792c6` (`transfer_number`),
  KEY `FK9o1w0mfiqm0uv41ukcm57jqmc` (`destination_branch_id`),
  KEY `FKpq4lruu72lvh2f1qebr5bdl04` (`dispatching_officer_id`),
  KEY `FKt4bndvy5b7ocswa5ouvkdhq8v` (`receiving_officer_id`),
  KEY `FKn9v2kfj320ghnpi937hkd1mte` (`source_branch_id`),
  CONSTRAINT `FK9o1w0mfiqm0uv41ukcm57jqmc` FOREIGN KEY (`destination_branch_id`) REFERENCES `branches` (`id`),
  CONSTRAINT `FKpq4lruu72lvh2f1qebr5bdl04` FOREIGN KEY (`dispatching_officer_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKt4bndvy5b7ocswa5ouvkdhq8v` FOREIGN KEY (`receiving_officer_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKn9v2kfj320ghnpi937hkd1mte` FOREIGN KEY (`source_branch_id`) REFERENCES `branches` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Table structure for table: journal_entries
CREATE TABLE `journal_entries` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL,
  `created_by` varchar(255) DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `updated_by` varchar(255) DEFAULT NULL,
  `version` bigint DEFAULT NULL,
  `entry_number` varchar(50) NOT NULL,
  `narration` varchar(500) DEFAULT NULL,
  `posted_at` datetime(6) NOT NULL,
  `posting_date` date NOT NULL,
  `reversal_reason` varchar(255) DEFAULT NULL,
  `reversed_by_entry_id` bigint DEFAULT NULL,
  `status` varchar(20) NOT NULL,
  `total_credit` decimal(19,4) NOT NULL,
  `total_debit` decimal(19,4) NOT NULL,
  `transaction_reference` varchar(60) DEFAULT NULL,
  `transaction_type` varchar(50) DEFAULT NULL,
  `branch_id` bigint DEFAULT NULL,
  `posted_by_user_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  UNIQUE KEY `UK6vtg8oj18vbcqphqfokc7qtvf` (`entry_number`),
  KEY `FKj8dwcu6b7aid0hux1y8sxo1ov` (`branch_id`),
  KEY `FKr31upke3e44fbebrc7i3l0d81` (`posted_by_user_id`),
  CONSTRAINT `FKj8dwcu6b7aid0hux1y8sxo1ov` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`),
  CONSTRAINT `FKr31upke3e44fbebrc7i3l0d81` FOREIGN KEY (`posted_by_user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Table structure for table: journal_entry_lines
CREATE TABLE `journal_entry_lines` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `amount` decimal(19,4) NOT NULL,
  `entry_type` varchar(10) NOT NULL,
  `line_number` int NOT NULL,
  `memo` varchar(255) DEFAULT NULL,
  `gl_account_id` bigint NOT NULL,
  `journal_entry_id` bigint NOT NULL,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  KEY `FK94f8e5n5w10pnbut4nsc5qxq1` (`gl_account_id`),
  KEY `FKl0yqkqwya5s96hmxy9hq2c8yi` (`journal_entry_id`),
  CONSTRAINT `FK94f8e5n5w10pnbut4nsc5qxq1` FOREIGN KEY (`gl_account_id`) REFERENCES `gl_accounts` (`id`),
  CONSTRAINT `FKl0yqkqwya5s96hmxy9hq2c8yi` FOREIGN KEY (`journal_entry_id`) REFERENCES `journal_entries` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Table structure for table: liquidity_alerts
CREATE TABLE `liquidity_alerts` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `acknowledged_at` datetime(6) DEFAULT NULL,
  `acknowledged_by` varchar(60) DEFAULT NULL,
  `alert_type` varchar(60) NOT NULL,
  `created_timestamp` datetime(6) NOT NULL,
  `description` varchar(400) NOT NULL,
  `is_acknowledged` bit(1) NOT NULL,
  `metric_observed` varchar(100) DEFAULT NULL,
  `regulatory_threshold` varchar(100) DEFAULT NULL,
  `severity` varchar(20) NOT NULL,
  `title` varchar(150) NOT NULL,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  KEY `idx_alert_severity` (`severity`),
  KEY `idx_alert_ack` (`is_acknowledged`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

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
  `approval_hierarchy_level` varchar(60) DEFAULT NULL,
  `bureau_status` varchar(40) DEFAULT NULL,
  `credit_risk_grade` varchar(30) DEFAULT NULL,
  `existing_monthly_obligations` decimal(18,2) DEFAULT NULL,
  `foir_percentage` decimal(5,2) DEFAULT NULL,
  `sanction_letter_reference` varchar(60) DEFAULT NULL,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  UNIQUE KEY `UKlmmebb2xnyy3oghe068hwcc1x` (`application_number`),
  KEY `FKs7ljqh0b7vv3vjwt1cb9dywdl` (`assigned_officer_id`),
  KEY `FKj1u3a9qyuwkbayi44rg0gbj1x` (`branch_id`),
  KEY `FKs6p85101r2lbn61hmgth4kwg2` (`customer_id`),
  CONSTRAINT `FKs7ljqh0b7vv3vjwt1cb9dywdl` FOREIGN KEY (`assigned_officer_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKj1u3a9qyuwkbayi44rg0gbj1x` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`),
  CONSTRAINT `FKs6p85101r2lbn61hmgth4kwg2` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin AUTO_INCREMENT=30001;

-- Table structure for table: loan_products
CREATE TABLE `loan_products` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL,
  `created_by` varchar(255) DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `updated_by` varchar(255) DEFAULT NULL,
  `version` bigint DEFAULT NULL,
  `base_interest_rate` decimal(5,2) NOT NULL,
  `collateral_required` bit(1) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `is_active` bit(1) NOT NULL,
  `loan_type` varchar(40) NOT NULL,
  `max_amount` decimal(18,2) NOT NULL,
  `max_foir_percentage` decimal(5,2) DEFAULT NULL,
  `max_tenure_months` int NOT NULL,
  `min_amount` decimal(18,2) NOT NULL,
  `min_credit_score` int DEFAULT NULL,
  `min_tenure_months` int NOT NULL,
  `processing_fee_percentage` decimal(5,2) DEFAULT NULL,
  `product_code` varchar(50) NOT NULL,
  `product_name` varchar(120) NOT NULL,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  UNIQUE KEY `idx_loan_product_code` (`product_code`)
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
  `payment_reference` varchar(64) DEFAULT NULL,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  KEY `FKmvfjvk48bhsvwbdis0s9uwn1t` (`loan_id`),
  CONSTRAINT `FKmvfjvk48bhsvwbdis0s9uwn1t` FOREIGN KEY (`loan_id`) REFERENCES `loans` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin AUTO_INCREMENT=30001;

-- Table structure for table: loan_sanction_letters
CREATE TABLE `loan_sanction_letters` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL,
  `created_by` varchar(255) DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `updated_by` varchar(255) DEFAULT NULL,
  `version` bigint DEFAULT NULL,
  `approved_interest_rate` decimal(5,2) NOT NULL,
  `approved_tenure_months` int NOT NULL,
  `approving_authority_level` varchar(60) DEFAULT NULL,
  `customer_id` bigint NOT NULL,
  `customer_name` varchar(120) NOT NULL,
  `loan_application_id` bigint NOT NULL,
  `monthly_emi` decimal(18,2) NOT NULL,
  `processing_fee_amount` decimal(18,2) DEFAULT NULL,
  `sanction_date` date NOT NULL,
  `sanction_reference` varchar(60) NOT NULL,
  `sanctioned_amount` decimal(18,2) NOT NULL,
  `sanctioning_officer_username` varchar(60) DEFAULT NULL,
  `special_conditions` text DEFAULT NULL,
  `status` varchar(30) NOT NULL,
  `validity_expiry_date` date NOT NULL,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  KEY `idx_sanction_app_id` (`loan_application_id`),
  UNIQUE KEY `idx_sanction_letter_num` (`sanction_reference`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

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
  `accrued_penal_interest` decimal(18,2) DEFAULT NULL,
  `asset_classification` varchar(30) NOT NULL,
  `days_past_due` int DEFAULT NULL,
  `provisioning_percentage` decimal(5,2) DEFAULT NULL,
  `required_provision_amount` decimal(18,2) DEFAULT NULL,
  `total_repaid_interest` decimal(18,2) DEFAULT NULL,
  `total_repaid_principal` decimal(18,2) DEFAULT NULL,
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin AUTO_INCREMENT=240001;

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

-- Table structure for table: payment_status_histories
CREATE TABLE `payment_status_histories` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `new_status` enum('FAILED','INITIATED','RECONCILED','SETTLED','SIMULATED_ACCEPTED','SIMULATED_PENDING','SIMULATED_REJECTED','SIMULATED_TIMEOUT') NOT NULL,
  `payment_record_id` bigint NOT NULL,
  `payment_reference` varchar(64) NOT NULL,
  `previous_status` enum('FAILED','INITIATED','RECONCILED','SETTLED','SIMULATED_ACCEPTED','SIMULATED_PENDING','SIMULATED_REJECTED','SIMULATED_TIMEOUT') DEFAULT NULL,
  `reason` varchar(255) DEFAULT NULL,
  `transition_timestamp` datetime(6) NOT NULL,
  `updated_by` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  KEY `idx_pay_hist_record` (`payment_record_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Table structure for table: payment_transaction_records
CREATE TABLE `payment_transaction_records` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL,
  `created_by` varchar(255) DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `updated_by` varchar(255) DEFAULT NULL,
  `version` bigint DEFAULT NULL,
  `amount` decimal(18,4) NOT NULL,
  `beneficiary_ifsc` varchar(20) DEFAULT NULL,
  `beneficiary_name` varchar(120) NOT NULL,
  `branch_id` bigint DEFAULT NULL,
  `destination_account_number` varchar(40) NOT NULL,
  `fee` decimal(18,4) NOT NULL,
  `idempotency_key` varchar(100) DEFAULT NULL,
  `initiated_at` datetime(6) NOT NULL,
  `initiated_by_user_id` bigint DEFAULT NULL,
  `is_demo_simulated` bit(1) NOT NULL,
  `narration` varchar(255) DEFAULT NULL,
  `operating_mode` enum('INTEGRATION','SIMULATION') NOT NULL,
  `payment_reference` varchar(64) NOT NULL,
  `rail_type` enum('IMPS','INTERNAL','NEFT','RTGS') NOT NULL,
  `reconciled_at` datetime(6) DEFAULT NULL,
  `response_code` varchar(30) DEFAULT NULL,
  `response_message` varchar(255) DEFAULT NULL,
  `rrn_number` varchar(20) DEFAULT NULL,
  `settled_at` datetime(6) DEFAULT NULL,
  `settlement_batch_id` varchar(50) DEFAULT NULL,
  `simulation_notes` varchar(500) DEFAULT NULL,
  `source_account_number` varchar(40) NOT NULL,
  `source_bank_account_id` bigint DEFAULT NULL,
  `status` enum('FAILED','INITIATED','RECONCILED','SETTLED','SIMULATED_ACCEPTED','SIMULATED_PENDING','SIMULATED_REJECTED','SIMULATED_TIMEOUT') NOT NULL,
  `total_debited` decimal(18,4) NOT NULL,
  `utr_number` varchar(32) DEFAULT NULL,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  KEY `idx_pay_utr` (`utr_number`),
  KEY `idx_pay_rrn` (`rrn_number`),
  KEY `idx_pay_idempotency` (`idempotency_key`),
  KEY `idx_pay_rail_status` (`rail_type`,`status`),
  UNIQUE KEY `idx_pay_reference` (`payment_reference`)
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

-- Table structure for table: reconciliation_exceptions
CREATE TABLE `reconciliation_exceptions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL,
  `created_by` varchar(255) DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `updated_by` varchar(255) DEFAULT NULL,
  `version` bigint DEFAULT NULL,
  `actual_amount` decimal(19,2) NOT NULL,
  `detected_at` datetime(6) NOT NULL,
  `discrepancy_amount` decimal(19,2) NOT NULL,
  `entity_identifier` varchar(64) NOT NULL,
  `entity_type` varchar(40) NOT NULL,
  `exception_number` varchar(64) NOT NULL,
  `expected_amount` decimal(19,2) NOT NULL,
  `reconciliation_type` enum('BRANCH_CASH_VS_LEDGER','CUSTOMER_ACCOUNTS_VS_LEDGER','DAILY_TRANSACTION_TOTALS','EXTERNAL_PAYMENT_VS_LEDGER','INTERNAL_TRANSFER_INTEGRITY') NOT NULL,
  `resolution_notes` varchar(500) DEFAULT NULL,
  `resolved_at` datetime(6) DEFAULT NULL,
  `status` varchar(30) NOT NULL,
  `resolved_by_user_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  KEY `idx_rec_ex_num` (`exception_number`),
  KEY `idx_rec_ex_status` (`status`),
  UNIQUE KEY `UKb1u4tareilpqr97ado8hsb1ta` (`exception_number`),
  KEY `FKaulb1sv6me6wk26us2a7ax01h` (`resolved_by_user_id`),
  CONSTRAINT `FKaulb1sv6me6wk26us2a7ax01h` FOREIGN KEY (`resolved_by_user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Table structure for table: reconciliation_reports
CREATE TABLE `reconciliation_reports` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL,
  `created_by` varchar(255) DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `updated_by` varchar(255) DEFAULT NULL,
  `version` bigint DEFAULT NULL,
  `actual_ledger_amount` decimal(19,2) NOT NULL,
  `details_json` text DEFAULT NULL,
  `discrepancy_amount` decimal(19,2) NOT NULL,
  `expected_amount` decimal(19,2) NOT NULL,
  `reconciliation_type` enum('BRANCH_CASH_VS_LEDGER','CUSTOMER_ACCOUNTS_VS_LEDGER','DAILY_TRANSACTION_TOTALS','EXTERNAL_PAYMENT_VS_LEDGER','INTERNAL_TRANSFER_INTEGRITY') NOT NULL,
  `report_number` varchar(64) NOT NULL,
  `run_date` date NOT NULL,
  `status` varchar(30) NOT NULL,
  `branch_id` bigint DEFAULT NULL,
  `reconciled_by_user_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  KEY `idx_rec_rep_num` (`report_number`),
  KEY `idx_rec_rep_date` (`run_date`),
  UNIQUE KEY `UK24k4ygmd2mlubfpyx3kcf6jqk` (`report_number`),
  KEY `FK4pv1y1invos4u8nxii33ew7gn` (`branch_id`),
  KEY `FKh4eqswm50bf6r3ru2jiq90ol4` (`reconciled_by_user_id`),
  CONSTRAINT `FK4pv1y1invos4u8nxii33ew7gn` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`),
  CONSTRAINT `FKh4eqswm50bf6r3ru2jiq90ol4` FOREIGN KEY (`reconciled_by_user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

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

-- Table structure for table: regulatory_configs
CREATE TABLE `regulatory_configs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `description` varchar(300) DEFAULT NULL,
  `effective_date` date NOT NULL,
  `is_active` bit(1) NOT NULL,
  `parameter_key` varchar(80) NOT NULL,
  `parameter_name` varchar(120) NOT NULL,
  `parameter_value` decimal(8,4) NOT NULL,
  `source_circular_reference` varchar(150) DEFAULT NULL,
  `unit` varchar(20) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `updated_by` varchar(60) DEFAULT NULL,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  UNIQUE KEY `idx_reg_param_key` (`parameter_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin AUTO_INCREMENT=30001;

-- Table structure for table: regulatory_reporting_periods
CREATE TABLE `regulatory_reporting_periods` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `form_a_submitted_at` datetime(6) DEFAULT NULL,
  `fortnight_number` int NOT NULL,
  `ndtl_basis_amount` decimal(18,4) DEFAULT NULL,
  `period_name` varchar(50) NOT NULL,
  `reporting_end_date` date NOT NULL,
  `reporting_start_date` date NOT NULL,
  `reporting_status` varchar(30) NOT NULL,
  `submission_deadline` date NOT NULL,
  `submitted_by` varchar(60) DEFAULT NULL,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  UNIQUE KEY `idx_rrp_period_name` (`period_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin AUTO_INCREMENT=30001;

-- Table structure for table: reserve_calculation_histories
CREATE TABLE `reserve_calculation_histories` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `calculated_by` varchar(60) DEFAULT NULL,
  `calculation_classification` varchar(40) NOT NULL,
  `calculation_date` date NOT NULL,
  `calculation_details_json` text DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `crr_actual_maintained` decimal(18,4) NOT NULL,
  `crr_compliance_status` varchar(30) NOT NULL,
  `crr_rate_applied` decimal(6,4) NOT NULL,
  `crr_required_amount` decimal(18,4) NOT NULL,
  `crr_surplus_deficit` decimal(18,4) NOT NULL,
  `demand_liabilities` decimal(18,4) NOT NULL,
  `interbank_exemptions` decimal(18,4) NOT NULL,
  `is_regulatory_verified` bit(1) NOT NULL,
  `net_demand_time_liabilities` decimal(18,4) NOT NULL,
  `other_demand_time_liabilities` decimal(18,4) NOT NULL,
  `reporting_fortnight` varchar(30) NOT NULL,
  `slr_actual_maintained` decimal(18,4) NOT NULL,
  `slr_compliance_status` varchar(30) NOT NULL,
  `slr_rate_applied` decimal(6,4) NOT NULL,
  `slr_required_amount` decimal(18,4) NOT NULL,
  `slr_surplus_deficit` decimal(18,4) NOT NULL,
  `time_liabilities` decimal(18,4) NOT NULL,
  `verified_at` datetime(6) DEFAULT NULL,
  `verified_by` varchar(60) DEFAULT NULL,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  KEY `idx_rch_calc_date` (`calculation_date`),
  KEY `idx_rch_fortnight` (`reporting_fortnight`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

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

-- Table structure for table: teller_cash_drawers
CREATE TABLE `teller_cash_drawers` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL,
  `created_by` varchar(255) DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `updated_by` varchar(255) DEFAULT NULL,
  `version` bigint DEFAULT NULL,
  `cash_payments` decimal(19,2) NOT NULL,
  `cash_receipts` decimal(19,2) NOT NULL,
  `closed_at` datetime(6) DEFAULT NULL,
  `current_balance` decimal(19,2) NOT NULL,
  `drawer_code` varchar(40) NOT NULL,
  `opened_at` datetime(6) NOT NULL,
  `opening_balance` decimal(19,2) NOT NULL,
  `status` varchar(30) NOT NULL,
  `assigned_cashier_id` bigint DEFAULT NULL,
  `branch_id` bigint NOT NULL,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  KEY `idx_drawer_code` (`drawer_code`),
  KEY `idx_drawer_status` (`status`),
  UNIQUE KEY `UKibhvjuu0eo4k681xgndm29c01` (`drawer_code`),
  KEY `FKeo4vu2ftf1ly3k238kpq3mtl5` (`assigned_cashier_id`),
  KEY `FK4o8n8fr1wc1nxi0sp95rmmtj5` (`branch_id`),
  CONSTRAINT `FKeo4vu2ftf1ly3k238kpq3mtl5` FOREIGN KEY (`assigned_cashier_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FK4o8n8fr1wc1nxi0sp95rmmtj5` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Table structure for table: teller_handovers
CREATE TABLE `teller_handovers` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL,
  `created_by` varchar(255) DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `updated_by` varchar(255) DEFAULT NULL,
  `version` bigint DEFAULT NULL,
  `discrepancy_amount` decimal(19,2) NOT NULL,
  `handover_number` varchar(64) NOT NULL,
  `handover_remarks` varchar(500) DEFAULT NULL,
  `handover_timestamp` datetime(6) NOT NULL,
  `is_vault_return` bit(1) NOT NULL,
  `physical_count_amount` decimal(19,2) NOT NULL,
  `status` varchar(30) NOT NULL,
  `supervisor_remarks` varchar(500) DEFAULT NULL,
  `system_expected_amount` decimal(19,2) NOT NULL,
  `authorized_by_id` bigint DEFAULT NULL,
  `destination_teller_id` bigint DEFAULT NULL,
  `drawer_id` bigint NOT NULL,
  `source_teller_id` bigint NOT NULL,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  KEY `idx_handover_num` (`handover_number`),
  KEY `idx_handover_status` (`status`),
  UNIQUE KEY `UKt2huwnuscvakrudnpxq31d52v` (`handover_number`),
  KEY `FKrsqf8tvm50w1dw548a9i21lqb` (`authorized_by_id`),
  KEY `FKb2gxyn9y6ngky0k2wkfoexd5x` (`destination_teller_id`),
  KEY `FKj9treauan2gkmhtvih8gc4f57` (`drawer_id`),
  KEY `FKf5eru8e13n70opokt6njkf66o` (`source_teller_id`),
  CONSTRAINT `FKrsqf8tvm50w1dw548a9i21lqb` FOREIGN KEY (`authorized_by_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKb2gxyn9y6ngky0k2wkfoexd5x` FOREIGN KEY (`destination_teller_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKj9treauan2gkmhtvih8gc4f57` FOREIGN KEY (`drawer_id`) REFERENCES `teller_cash_drawers` (`id`),
  CONSTRAINT `FKf5eru8e13n70opokt6njkf66o` FOREIGN KEY (`source_teller_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

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
  `status` enum('FAILED','INITIATED','PENDING_APPROVAL','POSTED','PROCESSING','RECONCILED','REVERSED','SETTLED','SUCCESS','VALIDATING') NOT NULL,
  `transaction_timestamp` datetime NOT NULL,
  `transaction_type` enum('CASH_DEPOSIT','CASH_WITHDRAWAL','EMI_REPAYMENT','FD_CREATION','FD_MATURITY_PAYOUT','FD_PREMATURE_WITHDRAWAL','INTERBANK_TRANSFER','INTEREST_CREDIT','INTERNAL_TRANSFER','LOAN_DISBURSEMENT','RD_CREATION') NOT NULL,
  `branch_id` bigint DEFAULT NULL,
  `destination_account_id` bigint DEFAULT NULL,
  `initiated_by_user_id` bigint DEFAULT NULL,
  `source_account_id` bigint DEFAULT NULL,
  `accounting_posting_status` enum('POSTED_BALANCED','POSTING','POSTING_FAILED','REVERSED','UNPOSTED') DEFAULT NULL,
  `external_payment_status` enum('INTERNAL','PENDING_CLEARING','REJECTED_BY_NETWORK','SETTLED_EXTERNALLY','TIMEOUT') DEFAULT NULL,
  `reconciled_at` datetime DEFAULT NULL,
  `settled_at` datetime DEFAULT NULL,
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

