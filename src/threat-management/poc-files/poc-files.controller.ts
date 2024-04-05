import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Put,
} from '@nestjs/common';
import { POCFilesService } from './poc-files.service';
import { CreatePOCFileDto } from './dto/create-poc-file.dto';
import { UpdatePOCFileDto } from './dto/update-poc-file.dto';
import { POCFile } from './entities/poc-file.entity';
import { CheckPolicies } from 'src/auth/casl/policies.guard';
import { EntityAbilityChecker } from 'src/common/entity-ability-checker';
import { BaseQueryDto } from 'src/common/dto/base-query.dto';

@Controller('threat-management/poc-files')
@CheckPolicies(new EntityAbilityChecker(POCFile))
export class POCFilesController {
  constructor(private readonly pocFilesService: POCFilesService) {}

  @Post()
  create(@Body() createPOCFileDto: CreatePOCFileDto) {
    return this.pocFilesService.create(createPOCFileDto);
  }

  @Get()
  findAll(@Query() query: BaseQueryDto) {
    return this.pocFilesService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pocFilesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePOCFileDto: UpdatePOCFileDto) {
    return this.pocFilesService.update(id, updatePOCFileDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.pocFilesService.remove(id);
  }

  @Put(':id/peer-units/:peerUnitId')
  addPeerUnit(
    @Param('id') id: string,
    @Param('peerUnitId') peerUnitId: string,
  ) {
    return this.pocFilesService.addPeerUnit(id, peerUnitId);
  }

  @Delete(':id/peer-units/:peerUnitId')
  removePeerUnit(
    @Param('id') id: string,
    @Param('peerUnitId') peerUnitId: string,
  ) {
    return this.pocFilesService.removePeerUnit(id, peerUnitId);
  }

  @Put(':id/tips/:tipId')
  addTip(@Param('id') id: string, @Param('tipId') tipId: string) {
    return this.pocFilesService.addTip(id, tipId);
  }

  @Delete(':id/tips/:tipId')
  removeTip(@Param('id') id: string, @Param('tipId') tipId: string) {
    return this.pocFilesService.removeTip(id, tipId);
  }

  @Put(':id/assessments/:assessmentId')
  addAssessment(
    @Param('id') id: string,
    @Param('assessmentId') assessmentId: string,
  ) {
    return this.pocFilesService.addAssessment(id, assessmentId);
  }

  @Delete(':id/assessments/:assessmentId')
  removeAssessment(
    @Param('id') id: string,
    @Param('assessmentId') assessmentId: string,
  ) {
    return this.pocFilesService.removeAssessment(id, assessmentId);
  }
}
