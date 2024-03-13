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
import { FieldsService } from './fields.service';
import { CreateFieldDto } from './dto/create-field.dto';
import { UpdateFieldDto } from './dto/update-field.dto';
import { BaseQueryDto } from 'src/common/dto/base-query.dto';
import Field from './entities/field.entity';
import { CheckPolicies } from 'src/auth/casl/policies.guard';
import { EntityAbilityChecker } from 'src/common/entity-ability-checker';

@Controller('forms/fields')
@CheckPolicies(new EntityAbilityChecker(Field))
export class FieldsController {
  constructor(private readonly fieldsService: FieldsService) {}

  @Post()
  create(@Body() createFieldDto: CreateFieldDto) {
    return this.fieldsService.create(createFieldDto);
  }

  @Get()
  findAll(@Query() query: BaseQueryDto) {
    return this.fieldsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.fieldsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateFieldDto: UpdateFieldDto) {
    return this.fieldsService.update(id, updateFieldDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.fieldsService.remove(id);
  }
}
