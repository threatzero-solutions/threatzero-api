import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { TrainingAdminService } from './training-admin.service';
import { SendTrainingLinksDto } from './dto/send-training-links.dto';
import { CheckPolicies } from 'src/auth/casl/policies.guard';
import { EntityAbilityChecker } from 'src/common/entity-ability-checker';
import { WatchStatsDto } from './dto/watch-stats.dto';
import { Response } from 'express';
import { WatchStatsQueryDto } from './dto/watch-stats-query.dto';
import { TrainingTokenQueryDto } from 'src/users/dto/training-token-query.dto';
import { ResendTrainingLinksDto } from './dto/resend-training-link.dto';

@Controller('training-admin')
export class TrainingAdminController {
  constructor(private readonly trainingAdminService: TrainingAdminService) {}

  @CheckPolicies(new EntityAbilityChecker(SendTrainingLinksDto))
  @Post('invites')
  @HttpCode(HttpStatus.ACCEPTED)
  async sendLinks(@Body() sendTrainingLinksDto: SendTrainingLinksDto) {
    await this.trainingAdminService.sendTrainingLinks(sendTrainingLinksDto);
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

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="training-links.csv"',
    );
    this.trainingAdminService
      .findTrainingLinksCsv(query, trainingUrlTemplate)
      .then((stream) => stream.pipe(res));
  }

  @CheckPolicies(new EntityAbilityChecker(WatchStatsDto))
  @Get('watch-stats')
  async getWatchStats(@Query() query: WatchStatsQueryDto) {
    return this.trainingAdminService.getWatchStats(query);
  }

  @CheckPolicies(new EntityAbilityChecker(WatchStatsDto))
  @Get('watch-stats/csv/')
  getWatchStatsCsv(@Res() res: Response, @Query() query: WatchStatsQueryDto) {
    // Make sure to get entire results.
    query.offset = 0;
    query.limit = Number.MAX_SAFE_INTEGER;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="watch-stats.csv"',
    );
    this.trainingAdminService
      .getWatchStatsCsv(query)
      .then((stream) => stream.pipe(res));
  }
}
