import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Patch,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Response } from 'express';
import { Public } from 'src/auth/auth.guard';
import { CheckPolicies } from 'src/auth/casl/policies.guard';
import { BaseQueryDto } from 'src/common/dto/base-query.dto';
import { EntityAbilityChecker } from 'src/common/entity-ability-checker';
import { GetSubmissionCountsQueryDto } from 'src/forms/forms/dto/get-submission-counts-query.dto';
import { GetPresignedUploadUrlsDto } from 'src/media/dto/get-presigned-upload-urls.dto';
import { CreateNoteDto } from 'src/users/dto/create-note.dto';
import { CreateTipDto } from './dto/create-tip.dto';
import { TipQueryDto } from './dto/tip-query.dto';
import { UpdateTipDto } from './dto/update-tip.dto';
import { Tip, TipStatus } from './entities/tip.entity';
import { TipsService } from './tips.service';

@Controller('tips')
@CheckPolicies(new EntityAbilityChecker(Tip))
export class TipsController {
  private readonly logger = new Logger(TipsController.name);

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
  getForm(
    @Query('id') id?: string,
    @Query('language_code') languageCode?: string,
  ) {
    return this.tipsService.getForm(id, languageCode);
  }

  @Public()
  @Get('forms')
  getForms() {
    return this.tipsService.getForms();
  }

  @Get('submissions/:id/pdf')
  async generateFormPDF(@Param('id') id: string, @Res() response: Response) {
    const pdf = await this.tipsService.generateSubmissionPDF(id);

    pdf.on('error', (e) => {
      this.logger.error('An error occurred while generating PDF.', e.stack);
      response.status(500).send('An error occurred while generating PDF.');
    });

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
