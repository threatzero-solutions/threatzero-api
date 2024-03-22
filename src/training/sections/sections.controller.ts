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
import { SectionsService } from './sections.service';
import { CreateSectionDto } from './dto/create-section.dto';
import { UpdateSectionDto } from './dto/update-section.dto';
import { CheckPolicies } from 'src/auth/casl/policies.guard';
import { TrainingSection } from './entities/section.entity';
import { EntityAbilityChecker } from 'src/common/entity-ability-checker';
import { BaseQueryTrainingDto } from '../common/dto/base-query-training.dto';

@Controller('training/sections')
@CheckPolicies(new EntityAbilityChecker(TrainingSection))
export class SectionsController {
  constructor(private readonly sectionsService: SectionsService) {}

  @Post()
  create(@Body() createSectionDto: CreateSectionDto) {
    return this.sectionsService.create(createSectionDto);
  }

  @Get()
  findAll(@Query() query: BaseQueryTrainingDto) {
    return this.sectionsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.sectionsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSectionDto: UpdateSectionDto) {
    return this.sectionsService.update(id, updateSectionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.sectionsService.remove(id);
  }
}
