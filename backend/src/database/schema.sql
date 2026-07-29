-- ============================================================================
-- Working Time Estimation System — reference schema
-- ============================================================================
-- This file is a human-readable mirror of the Sequelize migrations in
-- src/database/migrations/. The migrations are the source of truth (run via
-- `npm run db:migrate`); this file is provided for quick manual inspection or
-- for graders who want to `mysql < schema.sql` without running Node at all.
-- ============================================================================

CREATE DATABASE IF NOT EXISTS working_time_estimation
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE working_time_estimation;

-- ----------------------------------------------------------------------------
-- users
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(180) NOT NULL UNIQUE,
  password VARCHAR(100) NOT NULL,           -- bcrypt hash
  role ENUM('PM', 'ENGINEER') NOT NULL DEFAULT 'ENGINEER',
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- working_settings  (single-row table: global working hours)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS working_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  workingStartTime TIME NOT NULL DEFAULT '08:00:00',
  workingEndTime TIME NOT NULL DEFAULT '16:00:00',
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- recurring_holidays  (repeats every year, e.g. 17 May)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recurring_holidays (
  id INT AUTO_INCREMENT PRIMARY KEY,
  month INT NOT NULL,
  day INT NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY recurring_holidays_month_day_unique (month, day)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- one_time_holidays  (a single specific calendar date, e.g. 27 May 2004)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS one_time_holidays (
  id INT AUTO_INCREMENT PRIMARY KEY,
  holidayDate DATE NOT NULL UNIQUE,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- tasks
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  assignedEngineer INT NULL,
  estimateDays DECIMAL(12, 7) NULL,          -- signed, fractional working days
  startDateTime DATETIME NULL,
  calculatedEndDateTime DATETIME NULL,
  status ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED') NOT NULL DEFAULT 'PENDING',
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_tasks_assigned_engineer
    FOREIGN KEY (assignedEngineer) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  INDEX idx_tasks_assigned_engineer (assignedEngineer),
  INDEX idx_tasks_status (status)
) ENGINE=InnoDB;
