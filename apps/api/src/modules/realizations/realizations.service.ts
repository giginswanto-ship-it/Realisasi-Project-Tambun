import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  AuditAction,
  ExpenseRequestStatus,
  RealizationStatus,
} from '@tambun/shared';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRealizationDto } from './realizations.dto';

@Injectable()
export class RealizationsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const where: Prisma.RealizationWhereInput = {};

    if (query.status) {
      where.status = query.status as any;
    }

    if (query.search) {
      where.OR = [
        { realizationNumber: { contains: query.search, mode: 'insensitive' } },
        { request: { requestNumber: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    const [totalItems, realizations] = await Promise.all([
      this.prisma.realization.count({ where }),
      this.prisma.realization.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [query.sortBy || 'createdAt']: query.sortOrder || 'desc' },
        include: {
          request: {
            select: {
              id: true,
              requestNumber: true,
              title: true,
              totalAmountRequested: true,
              project: { select: { id: true, projectCode: true, name: true } },
            },
          },
          submitter: { select: { id: true, fullName: true, email: true } },
          verifier: { select: { id: true, fullName: true, email: true } },
          _count: { select: { items: true } },
        },
      }),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    return {
      message: 'Daftar LPJ realisasi berhasil dimuat.',
      data: realizations,
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
    const rlz = await this.prisma.realization.findUnique({
      where: { id },
      include: {
        request: {
          include: {
            project: true,
            requester: { select: { id: true, fullName: true, email: true } },
          },
        },
        submitter: { select: { id: true, fullName: true, email: true } },
        verifier: { select: { id: true, fullName: true, email: true } },
        items: {
          include: {
            budgetItem: true,
            vendor: true,
            attachments: true,
          },
        },
      },
    });

    if (!rlz) {
      throw new NotFoundException(`LPJ Realisasi dengan ID ${id} tidak ditemukan.`);
    }

    return {
      message: 'Detail LPJ realisasi berhasil dimuat.',
      data: rlz,
    };
  }

  async create(dto: CreateRealizationDto, userId: string) {
    // 1. Cek kasbon terkait
    const request = await this.prisma.expenseRequest.findUnique({
      where: { id: dto.requestId },
      include: { realization: true },
    });

    if (!request) {
      throw new NotFoundException('Pengajuan kasbon tidak ditemukan.');
    }

    if (request.currentStatus !== ExpenseRequestStatus.DISBURSED) {
      throw new BadRequestException(
        `LPJ hanya dapat diajukan untuk kasbon yang dananya telah dicairkan (Status saat ini: ${request.currentStatus}).`,
      );
    }

    if (request.realization) {
      throw new BadRequestException('Kasbon ini sudah memiliki berkas LPJ realisasi terdaftar.');
    }

    // 2. Kalkulasi total belanja dan sisa dana
    let totalRealized = 0;
    const itemsData = [];

    for (const item of dto.items) {
      const actualTotal = item.actualQty * item.actualUnitPrice;
      totalRealized += actualTotal;

      itemsData.push({
        budgetItemId: item.budgetItemId,
        vendorId: item.vendorId || null,
        invoiceNumber: item.invoiceNumber || null,
        itemName: item.itemName,
        description: item.description || null,
        actualQty: item.actualQty,
        actualUnitPrice: item.actualUnitPrice,
        actualTotalPrice: actualTotal,
        invoiceDate: new Date(item.invoiceDate),
        notes: item.notes || null,
      });
    }

    const requestedAmount = Number(request.totalAmountRequested);
    const remainingBalance = requestedAmount - totalRealized;

    // 3. Generate Nomor Realisasi: RLZ-TBN-YYYYMM-XXXX
    const datePrefix = new Date().toISOString().slice(0, 7).replace('-', '');
    const count = await this.prisma.realization.count();
    const realizationNumber = `RLZ-TBN-${datePrefix}-${String(count + 1).padStart(4, '0')}`;

    const created = await this.prisma.$transaction(async (tx) => {
      const rlz = await tx.realization.create({
        data: {
          realizationNumber,
          requestId: dto.requestId,
          submittedBy: userId,
          totalRealizedAmount: totalRealized,
          remainingBalance,
          status: RealizationStatus.SUBMITTED as any,
          notes: dto.notes,
          items: {
            create: itemsData,
          },
        },
        include: { items: true },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: AuditAction.SUBMIT as any,
          entityName: 'REALIZATION',
          entityId: rlz.id,
          newValues: {
            realizationNumber,
            totalRealizedAmount: totalRealized,
            remainingBalance,
          },
        },
      });

      return rlz;
    });

    return {
      message: 'LPJ Realisasi berhasil diajukan untuk verifikasi Finance.',
      data: created,
    };
  }

  async verify(id: string, financeUserId: string) {
    const rlz = await this.prisma.realization.findUnique({
      where: { id },
    });

    if (!rlz) {
      throw new NotFoundException('LPJ Realisasi tidak ditemukan.');
    }

    if (rlz.status !== RealizationStatus.SUBMITTED) {
      throw new BadRequestException('Hanya LPJ berstatus SUBMITTED yang dapat diverifikasi.');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.realization.update({
        where: { id },
        data: {
          status: RealizationStatus.VERIFIED_FINANCE as any,
          verifiedBy: financeUserId,
          verifiedAt: new Date(),
        },
      });

      await tx.auditLog.create({
        data: {
          userId: financeUserId,
          action: AuditAction.APPROVE as any,
          entityName: 'REALIZATION',
          entityId: id,
          newValues: { status: RealizationStatus.VERIFIED_FINANCE },
        },
      });

      return result;
    });

    return {
      message: 'Berkas bukti LPJ telah diverifikasi sah oleh Finance.',
      data: updated,
    };
  }

  async settle(id: string, financeUserId: string) {
    const rlz = await this.prisma.realization.findUnique({
      where: { id },
      include: {
        items: true,
        request: { include: { items: true } },
      },
    });

    if (!rlz) {
      throw new NotFoundException('LPJ Realisasi tidak ditemukan.');
    }

    if (rlz.status !== RealizationStatus.VERIFIED_FINANCE) {
      throw new BadRequestException('Hanya LPJ berstatus VERIFIED_FINANCE yang dapat diselesaikan (settled).');
    }

    // Rekonsiliasi Finansial Akhir:
    // 1. Ubah status LPJ ke SETTLED
    // 2. Ubah status kasbon ke SETTLED
    // 3. Kurangkan committedAmount dari budget items dan tambahkan realizedAmount aktual
    const settled = await this.prisma.$transaction(async (tx) => {
      const settledRlz = await tx.realization.update({
        where: { id },
        data: {
          status: RealizationStatus.SETTLED as any,
          settledAt: new Date(),
        },
      });

      await tx.expenseRequest.update({
        where: { id: rlz.requestId },
        data: { currentStatus: ExpenseRequestStatus.SETTLED as any },
      });

      // Kurangkan komitmen kasbon awal
      for (const reqItem of rlz.request.items) {
        await tx.budgetItem.update({
          where: { id: reqItem.budgetItemId },
          data: {
            committedAmount: {
              decrement: reqItem.estimatedTotal,
            },
          },
        });
      }

      // Masukkan realisasi aktual ke budget items
      for (const rlzItem of rlz.items) {
        await tx.budgetItem.update({
          where: { id: rlzItem.budgetItemId },
          data: {
            realizedAmount: {
              increment: rlzItem.actualTotalPrice,
            },
          },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: financeUserId,
          action: AuditAction.SETTLE as any,
          entityName: 'REALIZATION',
          entityId: id,
          newValues: {
            status: RealizationStatus.SETTLED,
            settledAt: new Date(),
          },
        },
      });

      return settledRlz;
    });

    return {
      message: 'Settlement LPJ tuntas. Pagu anggaran telah diperbarui ke nilai realisasi.',
      data: settled,
    };
  }
}
