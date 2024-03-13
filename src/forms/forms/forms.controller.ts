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
import { FormsService } from './forms.service';
import { CreateFormDto } from './dto/create-form.dto';
import { UpdateFormDto } from './dto/update-form.dto';
import { BaseQueryDto } from 'src/common/dto/base-query.dto';
import { CheckPolicies } from 'src/auth/casl/policies.guard';
import { EntityAbilityChecker } from 'src/common/entity-ability-checker';
import { Form } from './entities/form.entity';

@Controller('forms/forms')
@CheckPolicies(new EntityAbilityChecker(Form))
export class FormsController {
  constructor(private readonly formsService: FormsService) {}

  @Post()
  create(@Body() createFormDto: CreateFormDto) {
    return this.formsService.create(createFormDto);
  }

  @Get()
  findAll(@Query() query: BaseQueryDto) {
    return this.formsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.formsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateFormDto: UpdateFormDto) {
    return this.formsService.update(id, updateFormDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.formsService.remove(id);
  }
}
