import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('budget-alerts')
  async getBudgetAlerts(@Query('projectId') projectId?: string) {
    return this.notificationsService.getBudgetDepletionAlerts(projectId);
  }

  @Get('pending-approvals')
  async getPendingApprovals() {
    return this.notificationsService.getPendingApprovalNotifications();
  }
}
