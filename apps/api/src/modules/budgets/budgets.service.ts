import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBudgetCategoryDto, CreateBudgetItemDto } from './budgets.dto';

@Injectable()
export class BudgetsService {
  constructor(private prisma: PrismaService) {}

  async getCategoriesByProject(projectId: string) {
    const categories = await this.prisma.budgetCategory.findMany({
      where: { projectId },
      include: {
        items: true,
      },
      orderBy: { categoryCode: 'asc' },
    });

    return categories.map((cat) => {
      let totalItemBudget = 0;
      let totalCommitted = 0;
      let totalRealized = 0;

      const itemsWithHealth = cat.items.map((item) => {
        const itemBudget = Number(item.totalBudget);
        const itemCommitted = Number(item.committedAmount);
        const itemRealized = Number(item.realizedAmount);
        const availableAmount = itemBudget - (itemCommitted + itemRealized);

        totalItemBudget += itemBudget;
        totalCommitted += itemCommitted;
        totalRealized += itemRealized;

        return {
          ...item,
          availableAmount,
          usagePercentage: itemBudget > 0 ? Number(((itemRealized / itemBudget) * 100).toFixed(2)) : 0,
        };
      });

      return {
        ...cat,
        items: itemsWithHealth,
        summary: {
          allocatedAmount: Number(cat.allocatedAmount),
          totalItemBudget,
          totalCommitted,
          totalRealized,
          remainingAllocation: Number(cat.allocatedAmount) - (totalCommitted + totalRealized),
        },
      };
    });
  }

  async checkBudgetItemAvailability(budgetItemId: string, requestedAmount: number) {
    const item = await this.prisma.budgetItem.findUnique({
      where: { id: budgetItemId },
    });

    if (!item) {
      throw new NotFoundException(`Budget item dengan ID ${budgetItemId} tidak ditemukan.`);
    }

    const totalBudget = Number(item.totalBudget);
    const committed = Number(item.committedAmount);
    const realized = Number(item.realizedAmount);
    const available = totalBudget - (committed + realized);

    const isAvailable = available >= requestedAmount;

    return {
      item,
      totalBudget,
      committed,
      realized,
      available,
      requestedAmount,
      isAvailable,
      deficit: isAvailable ? 0 : requestedAmount - available,
    };
  }

  async createCategory(dto: CreateBudgetCategoryDto, userId: string) {
    const existing = await this.prisma.budgetCategory.findUnique({
      where: {
        projectId_categoryCode: {
          projectId: dto.projectId,
          categoryCode: dto.categoryCode,
        },
      },
    });

    if (existing) {
      throw new BadRequestException(
        `Kategori dengan kode '${dto.categoryCode}' sudah ada di proyek ini.`,
      );
    }

    return this.prisma.budgetCategory.create({
      data: {
        ...dto,
        createdBy: userId,
      },
    });
  }

  async createItem(dto: CreateBudgetItemDto, userId: string) {
    const existing = await this.prisma.budgetItem.findUnique({
      where: {
        categoryId_itemCode: {
          categoryId: dto.categoryId,
          itemCode: dto.itemCode,
        },
      },
    });

    if (existing) {
      throw new BadRequestException(
        `Budget item dengan kode '${dto.itemCode}' sudah ada di kategori ini.`,
      );
    }

    const totalBudget = dto.quantity * dto.unitPrice;

    return this.prisma.budgetItem.create({
      data: {
        ...dto,
        totalBudget,
        createdBy: userId,
      },
    });
  }
}
