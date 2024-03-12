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
import { FieldGroupsService } from './field-groups.service';
import { CreateFieldGroupDto } from './dto/create-field-group.dto';
import { UpdateFieldGroupDto } from './dto/update-field-group.dto';
import { BaseQueryDto } from 'src/common/dto/base-query.dto';
import { BaseEntityService } from 'src/common/base-entity.service';
import { FieldGroup } from './entities/field-group.entity';

@Controller('field-groups')
export class FieldGroupsController {
  constructor(private readonly fieldGroupsService: FieldGroupsService) {}

  @Post()
  create(@Body() createFieldGroupDto: CreateFieldGroupDto) {
    return this.fieldGroupsService.create(createFieldGroupDto);
  }

  @Get()
  findAll(@Query() query: BaseQueryDto) {
    return this.fieldGroupsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.fieldGroupsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateFieldGroupDto: UpdateFieldGroupDto,
  ) {
    return this.fieldGroupsService.update(id, updateFieldGroupDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.fieldGroupsService.remove(id);
  }
}
