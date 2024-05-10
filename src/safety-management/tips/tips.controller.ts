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
import { TipsService } from './tips.service';
import { CreateTipDto } from './dto/create-tip.dto';
import { UpdateTipDto } from './dto/update-tip.dto';
import { Public } from 'src/auth/auth.guard';
import { TipQueryDto } from './dto/tip-query.dto';
import { CheckPolicies } from 'src/auth/casl/policies.guard';
import { EntityAbilityChecker } from 'src/common/entity-ability-checker';
import { Tip, TipStatus } from './entities/tip.entity';
import { GetSubmissionCountsQueryDto } from 'src/forms/forms/dto/get-submission-counts-query.dto';
import { CreateNoteDto } from 'src/users/dto/create-note.dto';
import { Response } from 'express';
import { GetPresignedUploadUrlsDto } from 'src/forms/forms/dto/get-presigned-upload-urls.dto';
import { Throttle } from '@nestjs/throttler';
import { BaseQueryDto } from 'src/common/dto/base-query.dto';

@Controller('tips')
@CheckPolicies(new EntityAbilityChecker(Tip))
export class TipsController {
  constructor(private readonly tipsService: TipsService) {}

  @Throttle({ default: { limit: 3, ttl: 3 * 60 * 1000 } })
  @Public()
  @Post('submit')
  async create(
    @Body() createTipDto: CreateTipDto,
    @Query('locationId') locationId?: string,
  ) {
    // Don't return the created tip.
    await this.tipsService.create(createTipDto, locationId);
  }

  @Get('submissions')
  findAll(@Query() query: TipQueryDto) {
    return this.tipsService.findAll(query);
  }

  @Get('submissions/:id')
  findOne(@Param('id') id: string) {
    return this.tipsService.findOne(id);
  }

  @Public()
  @Get('form')
  getForm(@Query('language_code') languageCode?: string) {
    return this.tipsService.getForm(languageCode);
  }

  @Get('forms')
  getForms() {
    return this.tipsService.getForms();
  }

  @Get('submissions/:id/pdf')
  async generateFormPDF(@Param('id') id: string, @Res() response: Response) {
    const pdf = await this.tipsService.generateSubmissionPDF(id);
    response.setHeader('Content-Type', 'application/pdf');
    pdf.pipe(response);
    pdf.end();
  }

  @Patch('submissions/:id')
  update(@Param('id') id: string, @Body() updateTipDto: UpdateTipDto) {
    return this.tipsService.update(id, updateTipDto);
  }

  @Delete('submissions/:id')
  remove(@Param('id') id: string) {
    return this.tipsService.remove(id);
  }

  @Throttle({ default: { limit: 10, ttl: 30 * 1000 } })
  @Public()
  @Post('submissions/presigned-upload-urls')
  getPresignedUploadUrls(
    @Query('locationId') locationId: string,
    @Body() body: GetPresignedUploadUrlsDto,
  ) {
    return this.tipsService.getPresignedUploadUrls(body, locationId);
  }

  @Post('submissions/:tipId/notes')
  addNote(@Param('tipId') tipId: string, @Body() createNoteDto: CreateNoteDto) {
    return this.tipsService.addNote(tipId, createNoteDto);
  }

  @Get('submissions/:tipId/notes')
  getNotes(@Param('tipId') tipId: string, @Query() query: BaseQueryDto) {
    return this.tipsService.getNotes(tipId, query);
  }

  @Patch('submissions/:tipId/notes/:noteId')
  editNote(
    @Param('tipId') tipId: string,
    @Param('noteId') noteId: string,
    @Body() createNoteDto: CreateNoteDto,
  ) {
    return this.tipsService.editNote(tipId, noteId, createNoteDto);
  }

  @Delete('submissions/:tipId/notes/:tipId')
  removeNote(@Param('tipId') tipId: string, @Param('noteId') noteId: string) {
    return this.tipsService.removeNote(tipId, noteId);
  }

  @Get('stats')
  getCountStats(@Query() query: GetSubmissionCountsQueryDto) {
    return this.tipsService.getSubmissionCounts(
      query,
      Object.values(TipStatus),
    );
  }
}
