import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface BudgetAlert {
  projectId: string;
  projectName: string;
  categoryCode: string;
  categoryName: string;
  budgetItemId: string;
  itemCode: string;
  itemName: string;
  totalBudget: number;
  usedAmount: number;
  remainingAmount: number;
  depletionPercent: number;
  level: 'WARNING' | 'CRITICAL' | 'OVERRUN';
  message: string;
}

export interface PendingApprovalNotification {
  requestId: string;
  requestNumber: string;
  title: string;
  amount: number;
  currentStatus: string;
  targetRole: string;
  urgent: boolean;
  message: string;
  daysPending: number;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Pengecekan otomatis pagu anggaran yang menipis (sisa <= 15% atau overrun).
   */
  async getBudgetDepletionAlerts(projectId?: string): Promise<BudgetAlert[]> {
    const whereClause = projectId ? { projectId } : {};

    const categories = await this.prisma.budgetCategory.findMany({
      where: whereClause,
      include: {
        project: { select: { id: true, name: true } },
        items: true,
      },
    });

    const alerts: BudgetAlert[] = [];

    for (const cat of categories) {
      for (const item of cat.items) {
        const total = Number(item.totalBudget);
        const committed = Number(item.committedAmount);
        const realized = Number(item.realizedAmount);
        const used = committed + realized;
        const remaining = total - used;
        const usedPercent = total > 0 ? (used / total) * 100 : 0;
        const remainingPercent = total > 0 ? (remaining / total) * 100 : 0;

        if (remaining < 0) {
          alerts.push({
            projectId: cat.project.id,
            projectName: cat.project.name,
            categoryCode: cat.categoryCode,
            categoryName: cat.name,
            budgetItemId: item.id,
            itemCode: item.itemCode,
            itemName: item.name,
            totalBudget: total,
            usedAmount: used,
            remainingAmount: remaining,
            depletionPercent: Number(usedPercent.toFixed(1)),
            level: 'OVERRUN',
            message: `ALERTA KRITIS: Pagu item '${item.name}' (${item.itemCode}) mengalami overrun sebesar Rp ${Math.abs(remaining).toLocaleString('id-ID')}!`,
          });
        } else if (remainingPercent <= 15 && total > 0) {
          const isCritical = remainingPercent <= 5;
          alerts.push({
            projectId: cat.project.id,
            projectName: cat.project.name,
            categoryCode: cat.categoryCode,
            categoryName: cat.name,
            budgetItemId: item.id,
            itemCode: item.itemCode,
            itemName: item.name,
            totalBudget: total,
            usedAmount: used,
            remainingAmount: remaining,
            depletionPercent: Number(usedPercent.toFixed(1)),
            level: isCritical ? 'CRITICAL' : 'WARNING',
            message: `Peringatan: Sisa pagu '${item.name}' tersisa ${remainingPercent.toFixed(1)}% (Rp ${remaining.toLocaleString('id-ID')}).`,
          });
        }
      }
    }

    return alerts;
  }

  /**
   * Pengecekan otomatis tiket kasbon yang membutuhkan approval & disposisi segera.
   */
  async getPendingApprovalNotifications(): Promise<PendingApprovalNotification[]> {
    const pendingRequests = await this.prisma.expenseRequest.findMany({
      where: {
        currentStatus: {
          in: ['SUBMITTED', 'APPROVED_PM', 'APPROVED_DIRECTOR', 'APPROVED_FINANCE'],
        },
      },
      include: {
        project: { select: { name: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    const notifications: PendingApprovalNotification[] = [];
    const now = new Date();

    for (const req of pendingRequests) {
      const createdAt = new Date(req.createdAt);
      const daysPending = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 3600 * 24));
      const amount = Number(req.totalAmountRequested);
      const isHighValue = amount > 25_000_000;

      let targetRole = 'PROJECT_MANAGER';
      let message = `Tiket ${req.requestNumber} menunggu review PM.`;

      if (req.currentStatus === 'SUBMITTED') {
        targetRole = 'PROJECT_MANAGER';
        message = `Kasbon ${req.requestNumber} (${req.title}) butuh verifikasi teknis PM.`;
      } else if (req.currentStatus === 'APPROVED_PM') {
        if (isHighValue) {
          targetRole = 'DIRECTOR';
          message = `Eskalasi Direksi: Kasbon ${req.requestNumber} senilai Rp ${amount.toLocaleString('id-ID')} (> 25 Juta) butuh approval Direktur.`;
        } else {
          targetRole = 'FINANCE';
          message = `Kasbon ${req.requestNumber} telah disetujui PM, menunggu verifikasi anggaran Finance.`;
        }
      } else if (req.currentStatus === 'APPROVED_DIRECTOR') {
        targetRole = 'FINANCE';
        message = `Kasbon ${req.requestNumber} telah disetujui Direktur, siap diteruskan ke pencairan kasir.`;
      } else if (req.currentStatus === 'APPROVED_FINANCE') {
        targetRole = 'FINANCE';
        message = `Kasbon ${req.requestNumber} siap dicairkan / ditransfer ke Site Engineer.`;
      }

      notifications.push({
        requestId: req.id,
        requestNumber: req.requestNumber,
        title: req.title,
        amount,
        currentStatus: req.currentStatus,
        targetRole,
        urgent: daysPending >= 2 || isHighValue,
        message,
        daysPending,
      });
    }

    return notifications;
  }
}
