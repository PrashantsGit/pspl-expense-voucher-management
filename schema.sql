-- ============================================================================
-- Expense Voucher Management System (PSPL)
-- Database: MySQL 8.0+
-- Database Name: prachay_db
-- ============================================================================

CREATE DATABASE IF NOT EXISTS `prachay_db`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE `prachay_db`;

-- ----------------------------------------------------------------------------
-- Table: users
-- Description: Stores authenticated corporate users and role definitions
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(60) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(100) NOT NULL,
  `employee_id` VARCHAR(50) DEFAULT NULL,
  `department` VARCHAR(100) DEFAULT NULL,
  `role` VARCHAR(30) NOT NULL,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_users_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Table: vouchers
-- Description: Core expense voucher tracking with workflow state machine
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `vouchers` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `voucher_number` VARCHAR(32) NOT NULL,
  `voucher_date` DATE NOT NULL,
  `expense_date` DATE NOT NULL,
  `department_name` VARCHAR(100) NOT NULL,
  `expense_title` VARCHAR(150) NOT NULL,
  `expense_category` VARCHAR(80) NOT NULL,
  `expense_description` TEXT NOT NULL,
  `amount` DECIMAL(12,2) NOT NULL,
  `status` VARCHAR(30) NOT NULL,
  `employee_id` BIGINT NOT NULL,
  `employee_name` VARCHAR(100) NOT NULL,
  `employee_custom_id` VARCHAR(50) DEFAULT NULL,
  `employee_signature_path` VARCHAR(255) DEFAULT NULL,
  `director_id` BIGINT DEFAULT NULL,
  `director_name` VARCHAR(100) DEFAULT NULL,
  `director_signature_path` VARCHAR(255) DEFAULT NULL,
  `approval_date` DATE DEFAULT NULL,
  `rejection_reason` TEXT DEFAULT NULL,
  `created_date` DATETIME NOT NULL,
  `last_updated_date` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_voucher_number` (`voucher_number`),
  KEY `idx_voucher_status` (`status`),
  KEY `idx_voucher_department` (`department_name`),
  KEY `idx_voucher_employee` (`employee_id`),
  KEY `idx_voucher_director` (`director_id`),
  CONSTRAINT `fk_voucher_employee` FOREIGN KEY (`employee_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_voucher_director` FOREIGN KEY (`director_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Default Demo User Credentials (Passwords hashed with BCrypt, default: "password123")
-- ----------------------------------------------------------------------------
-- Note: The Spring Boot application seeds these users and sample lifecycle vouchers
-- automatically upon initial startup if the users table is empty.
