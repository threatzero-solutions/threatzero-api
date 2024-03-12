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
import { AudiencesService } from './audiences.service';
import { CreateAudienceDto } from './dto/create-audience.dto';
import { UpdateAudienceDto } from './dto/update-audience.dto';
import { CheckPolicies } from 'src/auth/casl/policies.guard';
import { Audience } from './entities/audience.entity';
import { EntityAbilityChecker } from 'src/common/entity-ability-checker';
import { BaseQueryDto } from 'src/common/dto/base-query.dto';

@Controller('training/audiences')
@CheckPolicies(new EntityAbilityChecker(Audience))
export class AudiencesController {
  constructor(private readonly audiencesService: AudiencesService) {}

  @Post()
  create(@Body() createAudienceDto: CreateAudienceDto) {
    return this.audiencesService.create(createAudienceDto);
  }

  @Get()
  findAll(@Query() query: BaseQueryDto) {
    return this.audiencesService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.audiencesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateAudienceDto: UpdateAudienceDto,
  ) {
    return this.audiencesService.update(id, updateAudienceDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.audiencesService.remove(id);
  }
}
