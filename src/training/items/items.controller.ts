import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpStatus,
  HttpCode,
  Res,
  Req,
  Logger,
} from '@nestjs/common';
import { ItemsService } from './items.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { CheckPolicies } from 'src/auth/casl/policies.guard';
import { TrainingItem } from './entities/item.entity';
import { EntityAbilityChecker } from 'src/common/entity-ability-checker';
import { BaseQueryTrainingDto } from '../common/dto/base-query-training.dto';
import { Public } from 'src/auth/auth.guard';
import { ItemCompletion } from './entities/item-completion.entity';
import { UpdateItemCompletionDto } from './dto/update-item-completion.dto';
import { ItemCompletionQueryDto } from './dto/item-completion-query.dto';
import { CreateItemCompletionDto } from './dto/create-item-completion.dto';
import { Request, Response } from 'express';

@Controller('training/items')
@CheckPolicies(new EntityAbilityChecker(TrainingItem))
export class ItemsController {
  private readonly logger = new Logger(ItemsController.name);

  constructor(private readonly itemsService: ItemsService) {}

  @Public()
  @Post('my-completions')
  createMyItemCompletion(
    @Body() createItemCompletionDto: CreateItemCompletionDto,
    @Query('watch_id') watchId?: string,
  ) {
    return this.itemsService.createMyItemCompletion(
      createItemCompletionDto,
      watchId,
    );
  }

  @Public()
  @Get('my-completions')
  getMyItemCompletions(
    @Query() query: ItemCompletionQueryDto,
    @Query('watch_id') watchId?: string,
  ) {
    return this.itemsService.getMyItemCompletions(query, watchId);
  }

  @Public()
  @Patch('my-completions/:id')
  @HttpCode(HttpStatus.ACCEPTED)
  updateMyItemCompletion(
    @Param('id') id: string,
    @Body() updateItemCompletionDto: UpdateItemCompletionDto,
    @Query('watch_id') watchId?: string,
  ) {
    this.itemsService.updateMyItemCompletion(
      id,
      updateItemCompletionDto,
      watchId,
    );
  }

  @CheckPolicies(new EntityAbilityChecker(ItemCompletion))
  @Get('completions')
  findItemCompletions(@Query() query: ItemCompletionQueryDto) {
    return this.itemsService.findItemCompletions(query);
  }

  @CheckPolicies(new EntityAbilityChecker(ItemCompletion))
  @Get('completions/csv')
  async findItemCompletionsCsv(
    @Query() query: ItemCompletionQueryDto,
    @Res() res: Response,
  ) {
    // Make sure to get entire results.
    query.offset = 0;
    query.limit = Number.MAX_SAFE_INTEGER;

    const stream = await this.itemsService.findItemCompletionsCsv(query);
    stream.on('error', (e) => {
      this.logger.error(
        'An error occurred while streaming completions csv data.',
        e.stack,
      );
      res.status(500).send('An error occurred while downloading data.');
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="item-completions.csv"',
    );

    stream.pipe(res);
  }

  @Post()
  create(@Body() createItemDto: CreateItemDto) {
    return this.itemsService.create(createItemDto);
  }

  @Get()
  findAll(@Query() query: BaseQueryTrainingDto) {
    return this.itemsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.itemsService.findOne(id);
  }

  @Public()
  @Get('watch/:id')
  watch(@Param('id') id: string, @Query('watch_id') watchId: string) {
    return this.itemsService.watch(id, watchId);
  }

  @Public()
  @Get('lms-watch/:id')
  async lmsWatch(
    @Param('id') id: string,
    @Query('lms_id') lmsId: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const { item, allowedOrigins } = await this.itemsService.lmsWatch(
      id,
      lmsId,
    );

    if (
      allowedOrigins.some(
        (origin) => origin.value === '*' || origin.value === req.headers.origin,
      )
    ) {
      res.setHeader('Access-Control-Allow-Origin', req.headers.origin ?? '*');
    }

    res.json(item);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateItemDto: UpdateItemDto) {
    return this.itemsService.update(id, updateItemDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.itemsService.remove(id);
  }
}
