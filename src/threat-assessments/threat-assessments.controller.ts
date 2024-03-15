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
} from '@nestjs/common';
import { ThreatAssessmentsService } from './threat-assessments.service';
import { CreateThreatAssessmentDto } from './dto/create-threat-assessment.dto';
import { UpdateThreatAssessmentDto } from './dto/update-threat-assessment.dto';
import { CreateNoteDto } from 'src/users/dto/create-note.dto';
import { EntityAbilityChecker } from 'src/common/entity-ability-checker';
import {
  AssessmentStatus,
  ThreatAssessment,
} from './entities/threat-assessment.entity';
import { CheckPolicies } from 'src/auth/casl/policies.guard';
import { ThreatAssessmentQueryDto } from './dto/threat-assessment-query.dto';
import { GetSubmissionCountsQueryDto } from 'src/forms/forms/dto/get-submission-counts-query.dto';
import { Response } from 'express';
import { GetPresignedUploadUrlsDto } from 'src/forms/forms/dto/get-presigned-upload-urls.dto';
import { BaseQueryDto } from 'src/common/dto/base-query.dto';

@Controller('assessments')
@CheckPolicies(new EntityAbilityChecker(ThreatAssessment))
export class ThreatAssessmentsController {
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
  getForm() {
    return this.threatAssessmentsService.getForm();
  }

  @Get('submissions/:id/pdf')
  async generateFormPDF(@Param('id') id: string, @Res() response: Response) {
    const pdf = await this.threatAssessmentsService.generateSubmissionPDF(id);
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
