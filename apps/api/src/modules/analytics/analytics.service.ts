import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getExecutiveDashboard(projectId?: string) {
    const projectFilter = projectId ? { id: projectId } : {};

    const [projects, totalRequests, totalRealizations, recentAudits] = await Promise.all([
      this.prisma.project.findMany({
        where: projectFilter,
        include: {
          categories: {
            include: {
              items: true,
            },
          },
        },
      }),
      this.prisma.expenseRequest.count({
        where: projectId ? { projectId } : {},
      }),
      this.prisma.realization.count({
        where: projectId ? { request: { projectId } } : {},
      }),
      this.prisma.auditLog.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, fullName: true, email: true } },
        },
      }),
    ]);

    let grandContractValue = 0;
    let grandBudget = 0;
    let grandCommitted = 0;
    let grandRealized = 0;
    const overrunItems: any[] = [];

    projects.forEach((prj) => {
      grandContractValue += Number(prj.contractValue);
      grandBudget += Number(prj.totalBudget);

      prj.categories.forEach((cat) => {
        cat.items.forEach((item) => {
          const itemBudget = Number(item.totalBudget);
          const itemCommitted = Number(item.committedAmount);
          const itemRealized = Number(item.realizedAmount);

          grandCommitted += itemCommitted;
          grandRealized += itemRealized;

          if (itemCommitted + itemRealized > itemBudget) {
            overrunItems.push({
              projectId: prj.id,
              projectName: prj.name,
              categoryName: cat.name,
              itemCode: item.itemCode,
              itemName: item.name,
              totalBudget: itemBudget,
              usedAmount: itemCommitted + itemRealized,
              overrunAmount: itemCommitted + itemRealized - itemBudget,
            });
          }
        });
      });
    });

    const grandRemainingBudget = grandBudget - (grandCommitted + grandRealized);
    const burnRatePercent = grandBudget > 0 ? Number(((grandRealized / grandBudget) * 100).toFixed(2)) : 0;
    const committedPercent = grandBudget > 0 ? Number(((grandCommitted / grandBudget) * 100).toFixed(2)) : 0;

    return {
      message: 'Data metrik dashboard eksekutif berhasil dimuat.',
      data: {
        summary: {
          totalProjects: projects.length,
          grandContractValue,
          grandBudget,
          grandCommitted,
          grandRealized,
          grandRemainingBudget,
          burnRatePercent,
          committedPercent,
          totalExpenseRequests: totalRequests,
          totalRealizations,
          overrunCount: overrunItems.length,
        },
        overrunAlerts: overrunItems,
        recentAudits,
      },
    };
  }
}
