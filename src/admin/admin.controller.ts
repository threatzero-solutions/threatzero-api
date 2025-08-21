import { Controller, Post } from '@nestjs/common';
import { CheckPolicies } from 'src/auth/casl/policies.guard';
import { LEVEL } from 'src/auth/permissions';
import { AdminService } from './admin.service';

@Controller('admin')
@CheckPolicies(
  (ability, context) => !!context.request.user?.hasPermission?.(LEVEL.ADMIN),
)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('send-test-training-reminder-email')
  async sendTestTrainingReminderEmail() {
    return this.adminService.sendTestTrainingReminderEmail();
  }
}
