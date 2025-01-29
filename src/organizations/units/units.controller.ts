import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Action } from 'src/auth/casl/constants';
import { CheckPolicies } from 'src/auth/casl/policies.guard';
import { EntityAbilityChecker } from 'src/common/entity-ability-checker';
import { GetPresignedUploadUrlsDto } from 'src/media/dto/get-presigned-upload-urls.dto';
import { CreateUnitDto } from './dto/create-unit.dto';
import { QueryUnitsDto } from './dto/query-units.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';
import { Unit } from './entities/unit.entity';
import { UnitsService } from './units.service';

@Controller('organizations/units')
@CheckPolicies(new EntityAbilityChecker(Unit))
export class UnitsController {
  constructor(private readonly unitsService: UnitsService) {}

  @Post()
  create(@Body() createUnitDto: CreateUnitDto) {
    return this.unitsService.create(createUnitDto);
  }

  @Get()
  findAll(@Query() query: QueryUnitsDto) {
    return this.unitsService.findAll(query);
  }

  @Get('slug-unique')
  async slugUnique(
    @Query('organizationId') organizationId: string,
    @Query('slug') slug: string,
  ) {
    return this.unitsService
      .isUniqueSlug(organizationId, slug)
      .then((isUnique) => ({ isUnique }));
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.unitsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUnitDto: UpdateUnitDto) {
    return this.unitsService.update(id, updateUnitDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.unitsService.remove(id);
  }

  @Post(':id/generate-policy-upload-urls')
  @CheckPolicies((ability) => ability.can(Action.Update, Unit))
  getPresignedUploadUrls(
    @Param('id') id: string,
    @Body() body: GetPresignedUploadUrlsDto,
  ) {
    return this.unitsService.generatePolicyUploadUrls(id, body);
  }
}
