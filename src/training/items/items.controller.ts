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

@Controller('training/items')
@CheckPolicies(new EntityAbilityChecker(TrainingItem))
export class ItemsController {
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
  getItemCompletions(@Query() query: ItemCompletionQueryDto) {
    return this.itemsService.getItemCompletions(query);
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
  lmsWatch(@Param('id') id: string, @Query('lms_id') lmsId: string) {
    return this.itemsService.lmsWatch(id, lmsId);
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
