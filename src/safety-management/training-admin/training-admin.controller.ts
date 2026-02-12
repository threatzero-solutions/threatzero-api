import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { TrainingAdminService } from './training-admin.service';
import { SendTrainingLinksDto } from './dto/send-training-links.dto';
import { SendTrainingReminderDto } from './dto/send-training-reminder.dto';
import { MarkCompletionDto } from './dto/mark-completion.dto';
import { CheckPolicies } from 'src/auth/casl/policies.guard';
import { EntityAbilityChecker } from 'src/common/entity-ability-checker';
import { Response } from 'express';
import { TrainingTokenQueryDto } from 'src/users/dto/training-token-query.dto';
import { ResendTrainingLinksDto } from './dto/resend-training-link.dto';

@Controller('training-admin')
export class TrainingAdminController {
  private readonly logger = new Logger(TrainingAdminController.name);

  constructor(private readonly trainingAdminService: TrainingAdminService) {}

  @CheckPolicies(new EntityAbilityChecker(SendTrainingLinksDto))
  @Post('invites')
  @HttpCode(HttpStatus.ACCEPTED)
  async sendLinks(@Body() sendTrainingLinksDto: SendTrainingLinksDto) {
    await this.trainingAdminService.sendTrainingLinks(sendTrainingLinksDto);
  }

  @CheckPolicies(new EntityAbilityChecker(SendTrainingLinksDto))
  @Post('reminders')
  @HttpCode(HttpStatus.ACCEPTED)
  async sendReminder(@Body() dto: SendTrainingReminderDto) {
    await this.trainingAdminService.sendTrainingReminder(dto);
  }

  @CheckPolicies(new EntityAbilityChecker(SendTrainingLinksDto))
  @Post('completions/mark-complete')
  @HttpCode(HttpStatus.OK)
  async markComplete(@Body() dto: MarkCompletionDto) {
    return this.trainingAdminService.markComplete(dto);
  }

  @CheckPolicies(new EntityAbilityChecker(SendTrainingLinksDto))
  @Post('invites/resend')
  @HttpCode(HttpStatus.ACCEPTED)
  async resendLinks(@Body() resendTrainingLinksDto: ResendTrainingLinksDto) {
    await this.trainingAdminService.resendTrainingLinks(resendTrainingLinksDto);
  }

  @CheckPolicies(new EntityAbilityChecker(SendTrainingLinksDto))
  @Get('invites')
  async viewLinks(@Query() query: TrainingTokenQueryDto) {
    return this.trainingAdminService.findTrainingLinks(query);
  }

  @CheckPolicies(new EntityAbilityChecker(SendTrainingLinksDto))
  @Get('invites/csv/')
  async viewLinksCsv(
    @Res() res: Response,
    @Query() query: TrainingTokenQueryDto,
    @Query('trainingUrlTemplate') trainingUrlTemplate: string,
  ) {
    // Make sure to get entire results.
    query.offset = 0;
    query.limit = Number.MAX_SAFE_INTEGER;

    const stream = await this.trainingAdminService.findTrainingLinksCsv(
      query,
      trainingUrlTemplate,
    );

    stream.on('error', (e) => {
      this.logger.error(
        'An error occurred while streaming training links csv data.',
        e.stack,
      );
      res.status(500).send('An error occurred while downloading data.');
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="training-links.csv"',
    );
    stream.pipe(res);
  }
}
