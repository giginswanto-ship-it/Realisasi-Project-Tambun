import { z } from 'zod';

// ==========================================
// 1. ENUMS
// ==========================================
export const RoleName = {
  SUPERADMIN: 'SUPERADMIN',
  PROJECT_MANAGER: 'PROJECT_MANAGER',
  SITE_ENGINEER: 'SITE_ENGINEER',
  FINANCE: 'FINANCE',
  DIRECTOR: 'DIRECTOR',
} as const;
export type RoleName = (typeof RoleName)[keyof typeof RoleName];

export const ProjectStatus = {
  PLANNING: 'PLANNING',
  ACTIVE: 'ACTIVE',
  ON_HOLD: 'ON_HOLD',
  COMPLETED: 'COMPLETED',
} as const;
export type ProjectStatus = (typeof ProjectStatus)[keyof typeof ProjectStatus];

export const ExpenseRequestType = {
  CASH_ADVANCE: 'CASH_ADVANCE',
  DIRECT_PURCHASE: 'DIRECT_PURCHASE',
  REIMBURSEMENT: 'REIMBURSEMENT',
} as const;
export type ExpenseRequestType = (typeof ExpenseRequestType)[keyof typeof ExpenseRequestType];

export const ExpenseRequestStatus = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  APPROVED_PM: 'APPROVED_PM',
  APPROVED_DIRECTOR: 'APPROVED_DIRECTOR',
  APPROVED_FINANCE: 'APPROVED_FINANCE',
  DISBURSED: 'DISBURSED',
  SETTLED: 'SETTLED',
  REJECTED: 'REJECTED',
  REVISION_REQUESTED: 'REVISION_REQUESTED',
} as const;
export type ExpenseRequestStatus = (typeof ExpenseRequestStatus)[keyof typeof ExpenseRequestStatus];

export const ApprovalStage = {
  PM_APPROVAL: 'PM_APPROVAL',
  FINANCE_APPROVAL: 'FINANCE_APPROVAL',
  DIRECTOR_APPROVAL: 'DIRECTOR_APPROVAL',
} as const;
export type ApprovalStage = (typeof ApprovalStage)[keyof typeof ApprovalStage];

export const ApprovalDecision = {
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  REVISION_REQUESTED: 'REVISION_REQUESTED',
} as const;
export type ApprovalDecision = (typeof ApprovalDecision)[keyof typeof ApprovalDecision];

export const RealizationStatus = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  VERIFIED_FINANCE: 'VERIFIED_FINANCE',
  REVISION_REQUESTED: 'REVISION_REQUESTED',
  SETTLED: 'SETTLED',
} as const;
export type RealizationStatus = (typeof RealizationStatus)[keyof typeof RealizationStatus];

export const AuditAction = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  SUBMIT: 'SUBMIT',
  APPROVE: 'APPROVE',
  REJECT: 'REJECT',
  DISBURSE: 'DISBURSE',
  SETTLE: 'SETTLE',
} as const;
export type AuditAction = (typeof AuditAction)[keyof typeof AuditAction];

// ==========================================
// 2. UNIFORM API CONTRACTS
// ==========================================
export interface ApiResponse<T = any> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  meta?: ApiPaginationMeta;
  timestamp: string;
}

export interface ApiPaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
  roleName: RoleName;
}

// Threshold persetujuan eskalasi Direksi
export const DIRECTOR_APPROVAL_THRESHOLD = 25_000_000;

// ==========================================
// 3. ZOD VALIDATION SCHEMAS
// ==========================================

export const LoginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
});
export type LoginDto = z.infer<typeof LoginSchema>;

export const CreateExpenseRequestItemSchema = z.object({
  budgetItemId: z.string().uuid('ID Budget Item harus berupa UUID valid'),
  description: z.string().min(3, 'Deskripsi minimal 3 karakter'),
  requestedQty: z.number().positive('Jumlah kuantitas harus lebih dari 0'),
  estimatedUnitPrice: z.number().nonnegative('Estimasi harga satuan tidak boleh minus'),
});
export type CreateExpenseRequestItemDto = z.infer<typeof CreateExpenseRequestItemSchema>;

export const CreateExpenseRequestSchema = z.object({
  projectId: z.string().uuid('ID Project harus berupa UUID valid'),
  type: z.enum([
    ExpenseRequestType.CASH_ADVANCE,
    ExpenseRequestType.DIRECT_PURCHASE,
    ExpenseRequestType.REIMBURSEMENT,
  ]),
  title: z.string().min(5, 'Judul pengajuan minimal 5 karakter'),
  purpose: z.string().min(10, 'Tujuan pengeluaran minimal 10 karakter'),
  needByDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Format tanggal needByDate tidak valid (YYYY-MM-DD)',
  }),
  notes: z.string().optional(),
  items: z.array(CreateExpenseRequestItemSchema).min(1, 'Minimal sertakan 1 item pengeluaran'),
});
export type CreateExpenseRequestDto = z.infer<typeof CreateExpenseRequestSchema>;

export const ApprovalDecisionSchema = z.object({
  decision: z.enum([
    ApprovalDecision.APPROVED,
    ApprovalDecision.REJECTED,
    ApprovalDecision.REVISION_REQUESTED,
  ]),
  comment: z.string().optional(),
});
export type ApprovalDecisionDto = z.infer<typeof ApprovalDecisionSchema>;

export const CreateRealizationItemSchema = z.object({
  budgetItemId: z.string().uuid(),
  vendorId: z.string().uuid().optional(),
  invoiceNumber: z.string().optional(),
  itemName: z.string().min(3, 'Nama item minimal 3 karakter'),
  description: z.string().optional(),
  actualQty: z.number().positive('Kuantitas aktual harus lebih dari 0'),
  actualUnitPrice: z.number().nonnegative('Harga satuan aktual tidak boleh minus'),
  invoiceDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Format tanggal faktur/nota tidak valid (YYYY-MM-DD)',
  }),
  notes: z.string().optional(),
});
export type CreateRealizationItemDto = z.infer<typeof CreateRealizationItemSchema>;

export const CreateRealizationSchema = z.object({
  requestId: z.string().uuid('ID Expense Request harus berupa UUID valid'),
  notes: z.string().optional(),
  items: z.array(CreateRealizationItemSchema).min(1, 'Minimal sertakan 1 item realisasi belanja'),
});
export type CreateRealizationDto = z.infer<typeof CreateRealizationSchema>;
