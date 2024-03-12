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
import { TipsService } from './tips.service';
import { CreateTipDto } from './dto/create-tip.dto';
import { UpdateTipDto } from './dto/update-tip.dto';
import { BaseQueryDto } from 'src/common/dto/base-query.dto';

@Controller('tips')
export class TipsController {
  constructor(private readonly tipsService: TipsService) {}

  @Post()
  create(@Body() createTipDto: CreateTipDto) {
    return this.tipsService.create(createTipDto);
  }

  @Get()
  findAll(@Query() query: BaseQueryDto) {
    return this.tipsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tipsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTipDto: UpdateTipDto) {
    return this.tipsService.update(id, updateTipDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tipsService.remove(id);
  }
}
