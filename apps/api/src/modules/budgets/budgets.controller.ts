import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { RoleName } from '@tambun/shared';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateBudgetCategoryDto, CreateBudgetItemDto } from './budgets.dto';
import { BudgetsService } from './budgets.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('budgets')
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Get('project/:projectId')
  async getCategories(@Param('projectId') projectId: string) {
    return this.budgetsService.getCategoriesByProject(projectId);
  }

  @Post('categories')
  @Roles(RoleName.SUPERADMIN, RoleName.PROJECT_MANAGER)
  async createCategory(@Body() dto: CreateBudgetCategoryDto, @CurrentUser('id') userId: string) {
    return this.budgetsService.createCategory(dto, userId);
  }

  @Post('items')
  @Roles(RoleName.SUPERADMIN, RoleName.PROJECT_MANAGER)
  async createItem(@Body() dto: CreateBudgetItemDto, @CurrentUser('id') userId: string) {
    return this.budgetsService.createItem(dto, userId);
  }
}
