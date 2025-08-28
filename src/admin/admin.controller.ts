import { Body, Controller, Post } from '@nestjs/common';
import { CheckPolicies } from 'src/auth/casl/policies.guard';
import { LEVEL } from 'src/auth/permissions';
import { AdminService } from './admin.service';
import { SendTestTrainingReminderEmailDto } from './dto/send-test-training-reminder-email.dto';

@Controller('admin')
@CheckPolicies(
  (ability, context) => !!context.request.user?.hasPermission?.(LEVEL.ADMIN),
)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('send-test-training-reminder-email')
  async sendTestTrainingReminderEmail(
    @Body() dto: SendTestTrainingReminderEmailDto,
  ) {
    return this.adminService.sendTestTrainingReminderEmail(dto);
  }
}
