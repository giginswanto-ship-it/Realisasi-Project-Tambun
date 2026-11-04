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
import { RoleName } from '@tambun/shared';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateRealizationDto } from './realizations.dto';
import { RealizationsService } from './realizations.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('realizations')
export class RealizationsController {
  constructor(private readonly realizationsService: RealizationsService) {}

  @Get()
  async findAll(@Query() query: PaginationQueryDto) {
    return this.realizationsService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.realizationsService.findOne(id);
  }

  @Post()
  @Roles(RoleName.SUPERADMIN, RoleName.SITE_ENGINEER, RoleName.PROJECT_MANAGER)
  async create(@Body() dto: CreateRealizationDto, @CurrentUser('id') userId: string) {
    return this.realizationsService.create(dto, userId);
  }

  @Patch(':id/verify')
  @Roles(RoleName.SUPERADMIN, RoleName.FINANCE)
  async verify(@Param('id') id: string, @CurrentUser('id') financeUserId: string) {
    return this.realizationsService.verify(id, financeUserId);
  }

  @Patch(':id/settle')
  @Roles(RoleName.SUPERADMIN, RoleName.FINANCE)
  async settle(@Param('id') id: string, @CurrentUser('id') financeUserId: string) {
    return this.realizationsService.settle(id, financeUserId);
  }
}
