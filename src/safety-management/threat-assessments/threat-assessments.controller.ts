import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Patch,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { CheckPolicies } from 'src/auth/casl/policies.guard';
import { BaseQueryDto } from 'src/common/dto/base-query.dto';
import { EntityAbilityChecker } from 'src/common/entity-ability-checker';
import { GetSubmissionCountsQueryDto } from 'src/forms/forms/dto/get-submission-counts-query.dto';
import { GetPresignedUploadUrlsDto } from 'src/media/dto/get-presigned-upload-urls.dto';
import { CreateNoteDto } from 'src/users/dto/create-note.dto';
import { CreateThreatAssessmentDto } from './dto/create-threat-assessment.dto';
import { ThreatAssessmentQueryDto } from './dto/threat-assessment-query.dto';
import { UpdateThreatAssessmentDto } from './dto/update-threat-assessment.dto';
import {
  AssessmentStatus,
  ThreatAssessment,
} from './entities/threat-assessment.entity';
import { ThreatAssessmentsService } from './threat-assessments.service';

@Controller('assessments')
@CheckPolicies(new EntityAbilityChecker(ThreatAssessment))
export class ThreatAssessmentsController {
  private readonly logger = new Logger(ThreatAssessmentsController.name);

  constructor(
    private readonly threatAssessmentsService: ThreatAssessmentsService,
  ) {}

  @Post('submissions')
  create(@Body() createThreatAssessmentDto: CreateThreatAssessmentDto) {
    return this.threatAssessmentsService.create(createThreatAssessmentDto);
  }

  @Get('submissions')
  findAll(@Query() query: ThreatAssessmentQueryDto) {
    return this.threatAssessmentsService.findAll(query);
  }

  @Get('submissions/:id')
  findOne(@Param('id') id: string) {
    return this.threatAssessmentsService.findOne(id);
  }

  @Get('form')
  getForm(
    @Query('id') id?: string,
    @Query('language_code') languageCode?: string,
  ) {
    return this.threatAssessmentsService.getForm(id, languageCode);
  }

  @Get('forms')
  getForms() {
    return this.threatAssessmentsService.getForms();
  }

  @Get('submissions/:id/pdf')
  async generateFormPDF(@Param('id') id: string, @Res() response: Response) {
    const pdf = await this.threatAssessmentsService.generateSubmissionPDF(id);

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
    @Body() updateThreatAssessmentDto: UpdateThreatAssessmentDto,
  ) {
    return this.threatAssessmentsService.update(id, updateThreatAssessmentDto);
  }

  @Delete('submissions/:id')
  remove(@Param('id') id: string) {
    return this.threatAssessmentsService.remove(id);
  }

  @Post('submissions/presigned-upload-urls')
  getPresignedUploadUrls(@Body() body: GetPresignedUploadUrlsDto) {
    return this.threatAssessmentsService.getPresignedUploadUrls(body);
  }

  @Post('submissions/:assessmentId/notes')
  addNote(
    @Param('assessmentId') assessmentId: string,
    @Body() createNoteDto: CreateNoteDto,
  ) {
    return this.threatAssessmentsService.addNote(assessmentId, createNoteDto);
  }

  @Get('submissions/:assessmentId/notes')
  getNotes(
    @Param('assessmentId') assessmentId: string,
    @Query() query: BaseQueryDto,
  ) {
    return this.threatAssessmentsService.getNotes(assessmentId, query);
  }

  @Patch('submissions/:assessmentId/notes/:noteId')
  editNote(
    @Param('assessmentId') assessmentId: string,
    @Param('noteId') noteId: string,
    @Body() createNoteDto: CreateNoteDto,
  ) {
    return this.threatAssessmentsService.editNote(
      assessmentId,
      noteId,
      createNoteDto,
    );
  }

  @Delete('submissions/:assessmentId/notes/:noteId')
  removeNote(
    @Param('assessmentId') assessmentId: string,
    @Param('noteId') noteId: string,
  ) {
    return this.threatAssessmentsService.removeNote(assessmentId, noteId);
  }

  @Get('stats')
  getCountStats(@Query() query: GetSubmissionCountsQueryDto) {
    return this.threatAssessmentsService.getSubmissionCounts(
      query,
      Object.values(AssessmentStatus),
    );
  }
}
