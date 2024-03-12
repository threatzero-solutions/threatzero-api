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
import { BaseQueryDto } from 'src/common/dto/base-query.dto';

@Controller('threat-assessments')
export class ThreatAssessmentsController {
  constructor(
    private readonly threatAssessmentsService: ThreatAssessmentsService,
  ) {}

  @Post()
  create(@Body() createThreatAssessmentDto: CreateThreatAssessmentDto) {
    return this.threatAssessmentsService.create(createThreatAssessmentDto);
  }

  @Get()
  findAll(@Query() query: BaseQueryDto) {
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
}
