import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Res,
  Logger,
} from '@nestjs/common';
import { ViolentIncidentReportsService } from './violent-incident-reports.service';
import { CreateViolentIncidentReportDto } from './dto/create-violent-incident-report.dto';
import { UpdateViolentIncidentReportDto } from './dto/update-violent-incident-report.dto';
import { GetPresignedUploadUrlsDto } from 'src/forms/forms/dto/get-presigned-upload-urls.dto';
import { BaseQueryDto } from 'src/common/dto/base-query.dto';
import { GetSubmissionCountsQueryDto } from 'src/forms/forms/dto/get-submission-counts-query.dto';
import { CreateNoteDto } from 'src/users/dto/create-note.dto';
import {
  ViolentIncidentReport,
  ViolentIncidentReportStatus,
} from './entities/violent-incident-report.entity';
import { CheckPolicies } from 'src/auth/casl/policies.guard';
import { EntityAbilityChecker } from 'src/common/entity-ability-checker';
import { Response } from 'express';
import { ViolentIncidentReportQueryDto } from './dto/violent-incident-report-query.dto';

@Controller('violent-incident-reports')
@CheckPolicies(new EntityAbilityChecker(ViolentIncidentReport))
export class ViolentIncidentReportsController {
  private readonly logger = new Logger(ViolentIncidentReportsController.name);

  constructor(
    private readonly violentIncidentReportsService: ViolentIncidentReportsService,
  ) {}

  @Post('submissions')
  create(
    @Body() createViolentIncidentReportDto: CreateViolentIncidentReportDto,
  ) {
    return this.violentIncidentReportsService.create(
      createViolentIncidentReportDto,
    );
  }

  @Get('submissions')
  findAll(@Query() query: ViolentIncidentReportQueryDto) {
    return this.violentIncidentReportsService.findAll(query);
  }

  @Get('submissions/:id')
  findOne(@Param('id') id: string) {
    return this.violentIncidentReportsService.findOne(id);
  }

  @Get('form')
  getForm(
    @Query('id') id?: string,
    @Query('language_code') languageCode?: string,
  ) {
    return this.violentIncidentReportsService.getForm(id, languageCode);
  }

  @Get('forms')
  getForms() {
    return this.violentIncidentReportsService.getForms();
  }

  @Get('submissions/:id/pdf')
  async generateFormPDF(@Param('id') id: string, @Res() response: Response) {
    const pdf =
      await this.violentIncidentReportsService.generateSubmissionPDF(id);

    pdf.on('error', (e) => {
      this.logger.error('An error occurred while generating PDF.', e.stack);
      response.status(500).send('An error occurred while generating PDF.');
    });

    response.setHeader('Content-Type', 'application/pdf');
    pdf.pipe(response);
    pdf.end();
  }

  @Patch('submissions/:id')
  update(
    @Param('id') id: string,
    @Body() updateViolentIncidentReportDto: UpdateViolentIncidentReportDto,
  ) {
    return this.violentIncidentReportsService.update(
      id,
      updateViolentIncidentReportDto,
    );
  }

  @Delete('submissions/:id')
  remove(@Param('id') id: string) {
    return this.violentIncidentReportsService.remove(id);
  }

  @Post('submissions/presigned-upload-urls')
  getPresignedUploadUrls(@Body() body: GetPresignedUploadUrlsDto) {
    return this.violentIncidentReportsService.getPresignedUploadUrls(body);
  }

  @Post('submissions/:id/notes')
  addNote(@Param('id') id: string, @Body() createNoteDto: CreateNoteDto) {
    return this.violentIncidentReportsService.addNote(id, createNoteDto);
  }

  @Get('submissions/:id/notes')
  getNotes(@Param('id') id: string, @Query() query: BaseQueryDto) {
    return this.violentIncidentReportsService.getNotes(id, query);
  }

  @Patch('submissions/:id/notes/:noteId')
  editNote(
    @Param('id') id: string,
    @Param('noteId') noteId: string,
    @Body() createNoteDto: CreateNoteDto,
  ) {
    return this.violentIncidentReportsService.editNote(
      id,
      noteId,
      createNoteDto,
    );
  }

  @Delete('submissions/:id/notes/:noteId')
  removeNote(@Param('id') id: string, @Param('noteId') noteId: string) {
    return this.violentIncidentReportsService.removeNote(id, noteId);
  }

  @Get('stats')
  getCountStats(@Query() query: GetSubmissionCountsQueryDto) {
    return this.violentIncidentReportsService.getSubmissionCounts(
      query,
      Object.values(ViolentIncidentReportStatus),
    );
  }
}
