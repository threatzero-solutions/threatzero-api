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
import { FormsService } from './forms.service';
import { CreateFormDto } from './dto/create-form.dto';
import { UpdateFormDto } from './dto/update-form.dto';
import { BaseQueryDto } from 'src/common/dto/base-query.dto';
import { CheckPolicies } from 'src/auth/casl/policies.guard';
import { EntityAbilityChecker } from 'src/common/entity-ability-checker';
import { Form } from './entities/form.entity';
import { Response } from 'express';

@Controller('forms/forms')
@CheckPolicies(new EntityAbilityChecker(Form))
export class FormsController {
  constructor(private readonly formsService: FormsService) {}

  @Post()
  create(@Body() createFormDto: CreateFormDto) {
    return this.formsService.create(createFormDto);
  }

  @Post(':id/new-draft')
  createNewDraft(@Param('id') id: string) {
    return this.formsService.createNewDraft(id);
  }

  @Get()
  findAll(@Query() query: BaseQueryDto) {
    return this.formsService.findAll(query);
  }

  @Get('grouped-by-slug')
  findAllGroupedBySlug() {
    return this.formsService.findAllGroupedBySlug();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.formsService.findOne(id);
  }

  @Get(':id/pdf')
  async generateFormPDF(@Param('id') id: string, @Res() response: Response) {
    const pdf = await this.formsService.generateFormPDF(id);
    response.setHeader('Content-Type', 'application/pdf');
    pdf.pipe(response);
    pdf.end();
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
