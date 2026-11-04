import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApprovalStage, RoleName } from '@tambun/shared';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ApprovalActionDto, CreateExpenseRequestDto } from './requests.dto';
import { RequestsService } from './requests.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Get()
  async findAll(@Query() query: PaginationQueryDto) {
    return this.requestsService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.requestsService.findOne(id);
  }

  @Post()
  @Roles(RoleName.SUPERADMIN, RoleName.SITE_ENGINEER, RoleName.PROJECT_MANAGER)
  async create(@Body() dto: CreateExpenseRequestDto, @CurrentUser('id') userId: string) {
    return this.requestsService.create(dto, userId);
  }

  @Patch(':id/submit')
  @Roles(RoleName.SUPERADMIN, RoleName.SITE_ENGINEER, RoleName.PROJECT_MANAGER)
  async submit(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.requestsService.submit(id, userId);
  }

  @Post(':id/approve/pm')
  @Roles(RoleName.SUPERADMIN, RoleName.PROJECT_MANAGER)
  async approvePM(
    @Param('id') id: string,
    @Body() dto: ApprovalActionDto,
    @CurrentUser('id') approverId: string,
    @CurrentUser('roleName') role: RoleName,
  ) {
    return this.requestsService.processApproval(
      id,
      ApprovalStage.PM_APPROVAL,
      dto,
      approverId,
      role,
    );
  }

  @Post(':id/approve/director')
  @Roles(RoleName.SUPERADMIN, RoleName.DIRECTOR)
  async approveDirector(
    @Param('id') id: string,
    @Body() dto: ApprovalActionDto,
    @CurrentUser('id') approverId: string,
    @CurrentUser('roleName') role: RoleName,
  ) {
    return this.requestsService.processApproval(
      id,
      ApprovalStage.DIRECTOR_APPROVAL,
      dto,
      approverId,
      role,
    );
  }

  @Post(':id/approve/finance')
  @Roles(RoleName.SUPERADMIN, RoleName.FINANCE)
  async approveFinance(
    @Param('id') id: string,
    @Body() dto: ApprovalActionDto,
    @CurrentUser('id') approverId: string,
    @CurrentUser('roleName') role: RoleName,
  ) {
    return this.requestsService.processApproval(
      id,
      ApprovalStage.FINANCE_APPROVAL,
      dto,
      approverId,
      role,
    );
  }

  @Patch(':id/disburse')
  @Roles(RoleName.SUPERADMIN, RoleName.FINANCE)
  async disburse(@Param('id') id: string, @CurrentUser('id') financeUserId: string) {
    return this.requestsService.disburse(id, financeUserId);
  }
}
