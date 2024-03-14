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
import { LocationsService } from './locations.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { CheckPolicies } from 'src/auth/casl/policies.guard';
import { EntityAbilityChecker } from 'src/common/entity-ability-checker';
import { Location } from './entities/location.entity';
import { BaseQueryDto } from 'src/common/dto/base-query.dto';
import { Response } from 'express';
import { GenerateQrCodeQueryDto } from './dto/generate-qr-code-query.dto';

@Controller('organizations/locations')
@CheckPolicies(new EntityAbilityChecker(Location))
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Post()
  create(@Body() createLocationDto: CreateLocationDto) {
    return this.locationsService.create(createLocationDto);
  }

  @Get()
  findAll(@Query() query: BaseQueryDto) {
    return this.locationsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.locationsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateLocationDto: UpdateLocationDto,
  ) {
    return this.locationsService.update(id, updateLocationDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.locationsService.remove(id);
  }

  @Get('/sos/qr-code/:locationId')
  async streamTipSubmissionQRCode(
    @Param('locationId') locationId: string,
    @Query() query: GenerateQrCodeQueryDto,
    @Res() response: Response,
  ) {
    const streamer = this.locationsService.generateQRCode(locationId, query);
    streamer(response);
  }
}
