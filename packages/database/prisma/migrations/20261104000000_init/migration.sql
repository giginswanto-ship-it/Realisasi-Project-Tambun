-- ==============================================================================
-- MIGRATION: 20261104000000_init
-- DESCRIPTION: Initial Database Schema with Relational Constraints,
--              Automated Audit Timestamps, and Financial Integrity Checks.
-- PROJECT: Monitoring Realisasi Pembelanjaan Proyek Tambun
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUM TYPES
DO $$ BEGIN
    CREATE TYPE "RoleName" AS ENUM (
        'SUPERADMIN',
        'PROJECT_MANAGER',
        'SITE_ENGINEER',
        'FINANCE',
        'DIRECTOR'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "ProjectStatus" AS ENUM (
        'PLANNING',
        'ACTIVE',
        'ON_HOLD',
        'COMPLETED'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "ExpenseRequestType" AS ENUM (
        'CASH_ADVANCE',
        'DIRECT_PURCHASE',
        'REIMBURSEMENT'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "ExpenseRequestStatus" AS ENUM (
        'DRAFT',
        'SUBMITTED',
        'APPROVED_PM',
        'APPROVED_DIRECTOR',
        'APPROVED_FINANCE',
        'DISBURSED',
        'SETTLED',
        'REJECTED',
        'REVISION_REQUESTED'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "ApprovalStage" AS ENUM (
        'PM_APPROVAL',
        'FINANCE_APPROVAL',
        'DIRECTOR_APPROVAL'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "ApprovalDecision" AS ENUM (
        'APPROVED',
        'REJECTED',
        'REVISION_REQUESTED'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "RealizationStatus" AS ENUM (
        'DRAFT',
        'SUBMITTED',
        'VERIFIED_FINANCE',
        'REVISION_REQUESTED',
        'SETTLED'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "AuditAction" AS ENUM (
        'CREATE',
        'UPDATE',
        'DELETE',
        'SUBMIT',
        'APPROVE',
        'REJECT',
        'DISBURSE',
        'SETTLE'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 3. REUSABLE TRIGGER FOR AUTOMATED UPDATED_AT TIMESTAMP
CREATE OR REPLACE FUNCTION set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 4. TABLE DEFINITIONS & CONSTRAINTS
-- ==============================================================================

-- A. ROLES
CREATE TABLE IF NOT EXISTS "roles" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" "RoleName" NOT NULL UNIQUE,
    "description" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- B. USERS
CREATE TABLE IF NOT EXISTS "users" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "role_id" UUID NOT NULL REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    "full_name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(150) NOT NULL UNIQUE,
    "password_hash" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(25),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- C. AUDIT LOGS
CREATE TABLE IF NOT EXISTS "audit_logs" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" UUID REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    "action" "AuditAction" NOT NULL,
    "entity_name" VARCHAR(60) NOT NULL,
    "entity_id" UUID NOT NULL,
    "old_values" JSONB,
    "new_values" JSONB,
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- D. PROJECTS
CREATE TABLE IF NOT EXISTS "projects" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "project_code" VARCHAR(50) NOT NULL UNIQUE,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "location" TEXT NOT NULL,
    "client_name" VARCHAR(150) NOT NULL,
    "contract_value" NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK ("contract_value" >= 0),
    "total_budget" NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK ("total_budget" >= 0),
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "status" "ProjectStatus" NOT NULL DEFAULT 'PLANNING',
    "manager_id" UUID REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    "created_by" UUID REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_project_dates CHECK ("end_date" >= "start_date")
);

-- E. BUDGET CATEGORIES (WBS LEVEL 1)
CREATE TABLE IF NOT EXISTS "budget_categories" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "project_id" UUID NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "category_code" VARCHAR(30) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "allocated_amount" NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK ("allocated_amount" >= 0),
    "created_by" UUID REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_project_category_code UNIQUE ("project_id", "category_code")
);

-- F. BUDGET ITEMS (RAB DETAIL)
CREATE TABLE IF NOT EXISTS "budget_items" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "category_id" UUID NOT NULL REFERENCES "budget_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "item_code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "unit" VARCHAR(30) NOT NULL,
    "quantity" NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK ("quantity" >= 0),
    "unit_price" NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK ("unit_price" >= 0),
    "total_budget" NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK ("total_budget" >= 0),
    "committed_amount" NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK ("committed_amount" >= 0),
    "realized_amount" NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK ("realized_amount" >= 0),
    "created_by" UUID REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_category_item_code UNIQUE ("category_id", "item_code")
);

-- G. EXPENSE REQUESTS (PENGAJUAN DANA / KAS BON)
CREATE TABLE IF NOT EXISTS "expense_requests" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "request_number" VARCHAR(50) NOT NULL UNIQUE,
    "project_id" UUID NOT NULL REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    "requester_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    "type" "ExpenseRequestType" NOT NULL DEFAULT 'CASH_ADVANCE',
    "title" VARCHAR(255) NOT NULL,
    "purpose" TEXT NOT NULL,
    "total_amount_requested" NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK ("total_amount_requested" >= 0),
    "current_status" "ExpenseRequestStatus" NOT NULL DEFAULT 'DRAFT',
    "need_by_date" DATE NOT NULL,
    "disbursed_at" TIMESTAMPTZ,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- H. EXPENSE REQUEST ITEMS
CREATE TABLE IF NOT EXISTS "expense_request_items" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "request_id" UUID NOT NULL REFERENCES "expense_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "budget_item_id" UUID NOT NULL REFERENCES "budget_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    "description" TEXT NOT NULL,
    "requested_qty" NUMERIC(12, 2) NOT NULL DEFAULT 1.00 CHECK ("requested_qty" > 0),
    "estimated_unit_price" NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK ("estimated_unit_price" >= 0),
    "estimated_total" NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK ("estimated_total" >= 0),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- I. APPROVAL LOGS
CREATE TABLE IF NOT EXISTS "approval_logs" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "request_id" UUID NOT NULL REFERENCES "expense_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "approver_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    "stage" "ApprovalStage" NOT NULL,
    "decision" "ApprovalDecision" NOT NULL,
    "comment" TEXT,
    "decided_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- J. VENDORS
CREATE TABLE IF NOT EXISTS "vendors" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" VARCHAR(150) NOT NULL,
    "contact_person" VARCHAR(100),
    "phone" VARCHAR(30),
    "email" VARCHAR(150),
    "address" TEXT,
    "bank_name" VARCHAR(50),
    "bank_account_number" VARCHAR(50),
    "bank_account_holder" VARCHAR(150),
    "tax_number_npwp" VARCHAR(40),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- K. REALIZATIONS (LPJ / SETTLEMENT)
CREATE TABLE IF NOT EXISTS "realizations" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "realization_number" VARCHAR(50) NOT NULL UNIQUE,
    "request_id" UUID NOT NULL UNIQUE REFERENCES "expense_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    "submitted_by" UUID NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    "total_realized_amount" NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK ("total_realized_amount" >= 0),
    "remaining_balance" NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    "status" "RealizationStatus" NOT NULL DEFAULT 'DRAFT',
    "verified_by" UUID REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    "verified_at" TIMESTAMPTZ,
    "settled_at" TIMESTAMPTZ,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- L. REALIZATION ITEMS
CREATE TABLE IF NOT EXISTS "realization_items" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "realization_id" UUID NOT NULL REFERENCES "realizations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "budget_item_id" UUID NOT NULL REFERENCES "budget_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    "vendor_id" UUID REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    "invoice_number" VARCHAR(80),
    "item_name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "actual_qty" NUMERIC(12, 2) NOT NULL DEFAULT 1.00 CHECK ("actual_qty" > 0),
    "actual_unit_price" NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK ("actual_unit_price" >= 0),
    "actual_total_price" NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK ("actual_total_price" >= 0),
    "invoice_date" DATE NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- M. RECEIPT ATTACHMENTS
CREATE TABLE IF NOT EXISTS "receipt_attachments" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "realization_item_id" UUID NOT NULL REFERENCES "realization_items"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "file_name" VARCHAR(255) NOT NULL,
    "file_key" VARCHAR(255) NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_size_bytes" INTEGER NOT NULL CHECK ("file_size_bytes" > 0),
    "mime_type" VARCHAR(80) NOT NULL,
    "checksum_sha256" VARCHAR(64),
    "uploaded_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 5. ATTACH TRIGGER UNTUK OTOMASI UPDATED_AT
-- ==============================================================================

DO $$ 
DECLARE
    tbl_name text;
BEGIN
    FOR tbl_name IN 
        SELECT table_name 
        FROM information_schema.columns 
        WHERE column_name = 'updated_at' 
          AND table_schema = 'public'
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS trg_set_updated_at ON %I;
            CREATE TRIGGER trg_set_updated_at
            BEFORE UPDATE ON %I
            FOR EACH ROW
            EXECUTE FUNCTION set_updated_at_timestamp();
        ', tbl_name, tbl_name);
    END LOOP;
END $$;

-- ==============================================================================
-- 6. PERFORMANCE & RELATIONAL INDEXES
-- ==============================================================================

CREATE INDEX IF NOT EXISTS "idx_users_role" ON "users"("role_id");
CREATE INDEX IF NOT EXISTS "idx_users_email" ON "users"("email");

CREATE INDEX IF NOT EXISTS "idx_audit_logs_entity" ON "audit_logs"("entity_name", "entity_id");
CREATE INDEX IF NOT EXISTS "idx_audit_logs_user" ON "audit_logs"("user_id");
CREATE INDEX IF NOT EXISTS "idx_audit_logs_created_at" ON "audit_logs"("created_at");

CREATE INDEX IF NOT EXISTS "idx_projects_code" ON "projects"("project_code");
CREATE INDEX IF NOT EXISTS "idx_projects_status" ON "projects"("status");

CREATE INDEX IF NOT EXISTS "idx_budget_categories_project" ON "budget_categories"("project_id");
CREATE INDEX IF NOT EXISTS "idx_budget_items_category" ON "budget_items"("category_id");
CREATE INDEX IF NOT EXISTS "idx_budget_items_code" ON "budget_items"("item_code");

CREATE INDEX IF NOT EXISTS "idx_expense_requests_project" ON "expense_requests"("project_id");
CREATE INDEX IF NOT EXISTS "idx_expense_requests_requester" ON "expense_requests"("requester_id");
CREATE INDEX IF NOT EXISTS "idx_expense_requests_status" ON "expense_requests"("current_status");

CREATE INDEX IF NOT EXISTS "idx_expense_req_items_request" ON "expense_request_items"("request_id");
CREATE INDEX IF NOT EXISTS "idx_expense_req_items_budget_item" ON "expense_request_items"("budget_item_id");

CREATE INDEX IF NOT EXISTS "idx_approval_logs_request" ON "approval_logs"("request_id");
CREATE INDEX IF NOT EXISTS "idx_approval_logs_approver" ON "approval_logs"("approver_id");

CREATE INDEX IF NOT EXISTS "idx_vendors_name" ON "vendors"("name");

CREATE INDEX IF NOT EXISTS "idx_realizations_request" ON "realizations"("request_id");
CREATE INDEX IF NOT EXISTS "idx_realizations_submitter" ON "realizations"("submitted_by");
CREATE INDEX IF NOT EXISTS "idx_realizations_status" ON "realizations"("status");

CREATE INDEX IF NOT EXISTS "idx_realization_items_realization" ON "realization_items"("realization_id");
CREATE INDEX IF NOT EXISTS "idx_realization_items_budget_item" ON "realization_items"("budget_item_id");
CREATE INDEX IF NOT EXISTS "idx_realization_items_vendor" ON "realization_items"("vendor_id");

CREATE INDEX IF NOT EXISTS "idx_receipt_attach_item" ON "receipt_attachments"("realization_item_id");
CREATE INDEX IF NOT EXISTS "idx_receipt_attach_checksum" ON "receipt_attachments"("checksum_sha256");
