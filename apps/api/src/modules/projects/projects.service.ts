import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './projects.dto';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const where: Prisma.ProjectWhereInput = {};

    if (query.search) {
      where.OR = [
        { projectCode: { contains: query.search, mode: 'insensitive' } },
        { name: { contains: query.search, mode: 'insensitive' } },
        { clientName: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.status) {
      where.status = query.status as any;
    }

    const orderBy: Prisma.ProjectOrderByWithRelationInput = {
      [query.sortBy || 'createdAt']: query.sortOrder || 'desc',
    };

    const [totalItems, projects] = await Promise.all([
      this.prisma.project.count({ where }),
      this.prisma.project.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          manager: {
            select: { id: true, fullName: true, email: true },
          },
          _count: {
            select: { categories: true, expenseRequests: true },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    return {
      message: 'Daftar proyek berhasil diambil.',
      data: projects,
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
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        manager: {
          select: { id: true, fullName: true, email: true, phone: true },
        },
        categories: {
          include: {
            items: true,
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException(`Proyek dengan ID ${id} tidak ditemukan.`);
    }

    // Hitung aggregat real-time: total pagu, komitmen kasbon berjalan, dan total realisasi
    let totalCommitted = 0;
    let totalRealized = 0;

    project.categories.forEach((cat) => {
      cat.items.forEach((item) => {
        totalCommitted += Number(item.committedAmount);
        totalRealized += Number(item.realizedAmount);
      });
    });

    const totalBudget = Number(project.totalBudget);
    const remainingBudget = totalBudget - (totalCommitted + totalRealized);
    const burnRatePercent = totalBudget > 0 ? ((totalRealized / totalBudget) * 100).toFixed(2) : 0;

    return {
      message: 'Detail proyek berhasil diambil.',
      data: {
        ...project,
        financialSummary: {
          totalBudget,
          totalCommitted,
          totalRealized,
          remainingBudget,
          burnRatePercent: Number(burnRatePercent),
        },
      },
    };
  }

  async create(dto: CreateProjectDto, userId: string) {
    const existing = await this.prisma.project.findUnique({
      where: { projectCode: dto.projectCode },
    });

    if (existing) {
      throw new BadRequestException(`Kode proyek '${dto.projectCode}' sudah terdaftar.`);
    }

    const project = await this.prisma.project.create({
      data: {
        ...dto,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        createdBy: userId,
      },
    });

    return {
      message: 'Proyek baru berhasil didaftarkan.',
      data: project,
    };
  }
}
