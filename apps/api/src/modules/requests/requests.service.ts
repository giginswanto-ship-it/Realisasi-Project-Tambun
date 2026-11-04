import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  ApprovalDecision,
  ApprovalStage,
  AuditAction,
  DIRECTOR_APPROVAL_THRESHOLD,
  ExpenseRequestStatus,
  RoleName,
} from '@tambun/shared';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';
import { ApprovalActionDto, CreateExpenseRequestDto } from './requests.dto';

@Injectable()
export class RequestsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const where: Prisma.ExpenseRequestWhereInput = {};

    if (query.projectId) {
      where.projectId = query.projectId;
    }

    if (query.status) {
      where.currentStatus = query.status as any;
    }

    if (query.search) {
      where.OR = [
        { requestNumber: { contains: query.search, mode: 'insensitive' } },
        { title: { contains: query.search, mode: 'insensitive' } },
        { purpose: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const orderBy: Prisma.ExpenseRequestOrderByWithRelationInput = {
      [query.sortBy || 'createdAt']: query.sortOrder || 'desc',
    };

    const [totalItems, requests] = await Promise.all([
      this.prisma.expenseRequest.count({ where }),
      this.prisma.expenseRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          project: { select: { id: true, projectCode: true, name: true } },
          requester: { select: { id: true, fullName: true, email: true } },
          _count: { select: { items: true, approvalLogs: true } },
        },
      }),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    return {
      message: 'Daftar pengajuan kasbon berhasil dimuat.',
      data: requests,
      meta: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  async findOne(id: string) {
    const request = await this.prisma.expenseRequest.findUnique({
      where: { id },
      include: {
        project: true,
        requester: { select: { id: true, fullName: true, email: true, phone: true } },
        items: {
          include: {
            budgetItem: {
              include: {
                category: true,
              },
            },
          },
        },
        approvalLogs: {
          include: {
            approver: { select: { id: true, fullName: true, email: true } },
          },
          orderBy: { decidedAt: 'asc' },
        },
        realization: {
          include: {
            items: {
              include: {
                attachments: true,
                vendor: true,
              },
            },
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundException(`Pengajuan dana dengan ID ${id} tidak ditemukan.`);
    }

    const isHighValue = Number(request.totalAmountRequested) > DIRECTOR_APPROVAL_THRESHOLD;

    return {
      message: 'Detail pengajuan dana berhasil diambil.',
      data: {
        ...request,
        governance: {
          isHighValue,
          requiresDirectorApproval: isHighValue,
          threshold: DIRECTOR_APPROVAL_THRESHOLD,
        },
      },
    };
  }

  async create(dto: CreateExpenseRequestDto, userId: string) {
    // 1. Generate nomor pengajuan unik: REQ-TBN-YYYYMM-XXXX
    const datePrefix = new Date().toISOString().slice(0, 7).replace('-', '');
    const count = await this.prisma.expenseRequest.count();
    const requestNumber = `REQ-TBN-${datePrefix}-${String(count + 1).padStart(4, '0')}`;

    // 2. Validasi setiap item terhadap pagu anggaran (Budget Ceiling Check)
    let totalAmount = 0;
    const itemsData = [];

    for (const itemDto of dto.items) {
      const budgetItem = await this.prisma.budgetItem.findUnique({
        where: { id: itemDto.budgetItemId },
      });

      if (!budgetItem) {
        throw new NotFoundException(`Budget item dengan ID ${itemDto.budgetItemId} tidak ditemukan.`);
      }

      const estimatedTotal = itemDto.requestedQty * itemDto.estimatedUnitPrice;
      totalAmount += estimatedTotal;

      const availablePagu =
        Number(budgetItem.totalBudget) -
        (Number(budgetItem.committedAmount) + Number(budgetItem.realizedAmount));

      if (estimatedTotal > availablePagu) {
        throw new BadRequestException(
          `Pengajuan untuk '${budgetItem.name}' senilai Rp ${estimatedTotal.toLocaleString('id-ID')} melampaui sisa pagu tersedia (Rp ${availablePagu.toLocaleString('id-ID')}).`,
        );
      }

      itemsData.push({
        budgetItemId: itemDto.budgetItemId,
        description: itemDto.description,
        requestedQty: itemDto.requestedQty,
        estimatedUnitPrice: itemDto.estimatedUnitPrice,
        estimatedTotal,
      });
    }

    // 3. Simpan dalam database
    const createdRequest = await this.prisma.$transaction(async (tx) => {
      const newReq = await tx.expenseRequest.create({
        data: {
          requestNumber,
          projectId: dto.projectId,
          requesterId: userId,
          type: dto.type as any,
          title: dto.title,
          purpose: dto.purpose,
          needByDate: new Date(dto.needByDate),
          notes: dto.notes,
          totalAmountRequested: totalAmount,
          currentStatus: ExpenseRequestStatus.DRAFT as any,
          items: {
            create: itemsData,
          },
        },
        include: { items: true },
      });

      // Catat Audit Trail
      await tx.auditLog.create({
        data: {
          userId,
          action: AuditAction.CREATE as any,
          entityName: 'EXPENSE_REQUEST',
          entityId: newReq.id,
          newValues: {
            requestNumber: newReq.requestNumber,
            totalAmountRequested: totalAmount,
            status: newReq.currentStatus,
          },
        },
      });

      return newReq;
    });

    return {
      message: 'Draft pengajuan kasbon berhasil dibuat.',
      data: createdRequest,
    };
  }

  async submit(id: string, userId: string) {
    const request = await this.prisma.expenseRequest.findUnique({ where: { id } });

    if (!request) {
      throw new NotFoundException('Pengajuan kasbon tidak ditemukan.');
    }

    if (request.currentStatus !== ExpenseRequestStatus.DRAFT && request.currentStatus !== ExpenseRequestStatus.REVISION_REQUESTED) {
      throw new BadRequestException(
        `Pengajuan tidak dapat disubmit karena berstatus: ${request.currentStatus}`,
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const req = await tx.expenseRequest.update({
        where: { id },
        data: { currentStatus: ExpenseRequestStatus.SUBMITTED as any },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: AuditAction.SUBMIT as any,
          entityName: 'EXPENSE_REQUEST',
          entityId: id,
          oldValues: { status: request.currentStatus },
          newValues: { status: ExpenseRequestStatus.SUBMITTED },
        },
      });

      return req;
    });

    return {
      message: 'Pengajuan kasbon berhasil diserahkan untuk review Project Manager.',
      data: updated,
    };
  }

  async processApproval(
    id: string,
    stage: ApprovalStage,
    dto: ApprovalActionDto,
    approverId: string,
    role: RoleName,
  ) {
    const request = await this.prisma.expenseRequest.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!request) {
      throw new NotFoundException('Pengajuan kasbon tidak ditemukan.');
    }

    const amount = Number(request.totalAmountRequested);
    const isHighValue = amount > DIRECTOR_APPROVAL_THRESHOLD;

    // 1. Validasi Tahap dan Hak Akses Role
    if (stage === ApprovalStage.PM_APPROVAL) {
      if (role !== RoleName.PROJECT_MANAGER && role !== RoleName.SUPERADMIN) {
        throw new ForbiddenException('Hanya Project Manager yang berwenang menyetujui tahap PM_APPROVAL.');
      }
      if (request.currentStatus !== ExpenseRequestStatus.SUBMITTED) {
        throw new BadRequestException('Status pengajuan belum dalam tahap SUBMITTED.');
      }
    } else if (stage === ApprovalStage.DIRECTOR_APPROVAL) {
      if (role !== RoleName.DIRECTOR && role !== RoleName.SUPERADMIN) {
        throw new ForbiddenException('Hanya Direktur yang berwenang menyetujui tahap DIRECTOR_APPROVAL.');
      }
      if (request.currentStatus !== ExpenseRequestStatus.APPROVED_PM) {
        throw new BadRequestException('Status pengajuan harus sudah disetujui PM terlebih dahulu.');
      }
    } else if (stage === ApprovalStage.FINANCE_APPROVAL) {
      if (role !== RoleName.FINANCE && role !== RoleName.SUPERADMIN) {
        throw new ForbiddenException('Hanya Finance yang berwenang menyetujui tahap FINANCE_APPROVAL.');
      }
      const validPrevStatus = isHighValue
        ? ExpenseRequestStatus.APPROVED_DIRECTOR
        : ExpenseRequestStatus.APPROVED_PM;

      if (request.currentStatus !== validPrevStatus) {
        throw new BadRequestException(
          `Pengeluaran ini membutuhkan persetujuan sebelumnya: ${validPrevStatus}`,
        );
      }
    }

    // 2. Hitung Status Baru
    let nextStatus: ExpenseRequestStatus;

    if (dto.decision === ApprovalDecision.REJECTED) {
      nextStatus = ExpenseRequestStatus.REJECTED;
    } else if (dto.decision === ApprovalDecision.REVISION_REQUESTED) {
      nextStatus = ExpenseRequestStatus.REVISION_REQUESTED;
    } else {
      // APPROVED
      if (stage === ApprovalStage.PM_APPROVAL) {
        nextStatus = isHighValue
          ? ExpenseRequestStatus.APPROVED_PM
          : ExpenseRequestStatus.APPROVED_PM;
      } else if (stage === ApprovalStage.DIRECTOR_APPROVAL) {
        nextStatus = ExpenseRequestStatus.APPROVED_DIRECTOR;
      } else {
        nextStatus = ExpenseRequestStatus.APPROVED_FINANCE;
      }
    }

    // 3. Simpan Log & Perubahan Status dalam Transaksi ACID
    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.approvalLog.create({
        data: {
          requestId: id,
          approverId,
          stage: stage as any,
          decision: dto.decision as any,
          comment: dto.comment,
        },
      });

      const req = await tx.expenseRequest.update({
        where: { id },
        data: { currentStatus: nextStatus as any },
      });

      await tx.auditLog.create({
        data: {
          userId: approverId,
          action: (dto.decision === ApprovalDecision.APPROVED ? AuditAction.APPROVE : AuditAction.REJECT) as any,
          entityName: 'EXPENSE_REQUEST',
          entityId: id,
          oldValues: { status: request.currentStatus },
          newValues: { status: nextStatus, stage, decision: dto.decision, comment: dto.comment },
        },
      });

      return req;
    });

    return {
      message: `Keputusan approval (${dto.decision}) pada tahap ${stage} berhasil dicatat.`,
      data: updated,
    };
  }

  async disburse(id: string, financeUserId: string) {
    const request = await this.prisma.expenseRequest.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!request) {
      throw new NotFoundException('Pengajuan kasbon tidak ditemukan.');
    }

    if (request.currentStatus !== ExpenseRequestStatus.APPROVED_FINANCE) {
      throw new BadRequestException(
        `Dana hanya dapat dicairkan jika sudah disetujui Finance (Status saat ini: ${request.currentStatus}).`,
      );
    }

    // Eksekusi Pencairan Dana & Kunci Pagu Anggaran (Committed Amount)
    const result = await this.prisma.$transaction(async (tx) => {
      // Update status menjadi DISBURSED
      const disbursedReq = await tx.expenseRequest.update({
        where: { id },
        data: {
          currentStatus: ExpenseRequestStatus.DISBURSED as any,
          disbursedAt: new Date(),
        },
      });

      // Naikkan committed_amount pada setiap budget item terkait
      for (const item of request.items) {
        await tx.budgetItem.update({
          where: { id: item.budgetItemId },
          data: {
            committedAmount: {
              increment: item.estimatedTotal,
            },
          },
        });
      }

      // Catat Audit Trail
      await tx.auditLog.create({
        data: {
          userId: financeUserId,
          action: AuditAction.DISBURSE as any,
          entityName: 'EXPENSE_REQUEST',
          entityId: id,
          newValues: {
            status: ExpenseRequestStatus.DISBURSED,
            disbursedAt: new Date(),
            amount: request.totalAmountRequested,
          },
        },
      });

      return disbursedReq;
    });

    return {
      message: 'Dana kasbon berhasil dicairkan dan pagu anggaran telah dikunci (committed).',
      data: result,
    };
  }
}
