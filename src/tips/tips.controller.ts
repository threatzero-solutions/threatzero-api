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
import { Public } from 'src/auth/auth.guard';
import { TipQueryDto } from './dto/tip-query.dto';
import { CheckPolicies } from 'src/auth/casl/policies.guard';
import { EntityAbilityChecker } from 'src/common/entity-ability-checker';
import { Tip, TipStatus } from './entities/tip.entity';
import { GetSubmissionCountsQueryDto } from 'src/forms/forms/dto/get-submission-counts-query.dto';

@Controller('tips')
@CheckPolicies(new EntityAbilityChecker(Tip))
export class TipsController {
  constructor(private readonly tipsService: TipsService) {}

  @Public()
  @Post()
  create(@Body() createTipDto: CreateTipDto) {
    return this.tipsService.create(createTipDto);
  }

  @Get()
  findAll(@Query() query: TipQueryDto) {
    return this.tipsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tipsService.findOne(id);
  }

  @Public()
  @Get('form')
  getForm() {
    return this.tipsService.getForm();
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTipDto: UpdateTipDto) {
    return this.tipsService.update(id, updateTipDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tipsService.remove(id);
  }

  @Get('stats')
  getCountStats(@Query() query: GetSubmissionCountsQueryDto) {
    return this.tipsService.getSubmissionCounts(
      query,
      Object.values(TipStatus),
    );
  }
}
