import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ThreatAssessmentsService } from './threat-assessments.service';
import { CreateThreatAssessmentDto } from './dto/create-threat-assessment.dto';
import { UpdateThreatAssessmentDto } from './dto/update-threat-assessment.dto';
import { CreateNoteDto } from 'src/users/dto/create-note.dto';
import { EntityAbilityChecker } from 'src/common/entity-ability-checker';
import { ThreatAssessment } from './entities/threat-assessment.entity';
import { CheckPolicies } from 'src/auth/casl/policies.guard';
import { ThreatAssessmentQueryDto } from './dto/threat-assessment-query.dto';

@Controller('threat-assessments')
@CheckPolicies(new EntityAbilityChecker(ThreatAssessment))
export class ThreatAssessmentsController {
  constructor(
    private readonly threatAssessmentsService: ThreatAssessmentsService,
  ) {}

  @Post()
  create(@Body() createThreatAssessmentDto: CreateThreatAssessmentDto) {
    return this.threatAssessmentsService.create(createThreatAssessmentDto);
  }

  @Get()
  findAll(@Query() query: ThreatAssessmentQueryDto) {
    return this.threatAssessmentsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.threatAssessmentsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateThreatAssessmentDto: UpdateThreatAssessmentDto,
  ) {
    return this.threatAssessmentsService.update(id, updateThreatAssessmentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.threatAssessmentsService.remove(id);
  }

  @Post('notes')
  addNote(
    @Param('assessmentId') assessmentId: string,
    @Body() createNoteDto: CreateNoteDto,
  ) {
    return this.threatAssessmentsService.addNote(assessmentId, createNoteDto);
  }

  @Get('notes')
  getNotes(@Param('assessmentId') assessmentId: string) {
    return this.threatAssessmentsService.getNotes(assessmentId);
  }

  @Patch('notes/:noteId')
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

  @Delete('notes/:noteId')
  removeNote(
    @Param('assessmentId') assessmentId: string,
    @Param('noteId') noteId: string,
  ) {
    return this.threatAssessmentsService.removeNote(assessmentId, noteId);
  }
}
