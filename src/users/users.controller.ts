import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { UserIdChangesDto } from './dto/user-id-change.dto';
import { UsersService } from './users.service';
import { CheckPolicies } from 'src/auth/casl/policies.guard';
import { EntityAbilityChecker } from 'src/common/entity-ability-checker';
import { UserRepresentation } from './entities/user-representation.entity';
import { TrainingParticipantRepresentationDto } from 'src/training/items/dto/training-participant-representation.dto';
import { TrainingTokenQueryDto } from './dto/training-token-query.dto';

@Controller('users')
@CheckPolicies(new EntityAbilityChecker(UserRepresentation))
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('migrate-ids')
  @HttpCode(HttpStatus.ACCEPTED)
  async migrateIds(@Body() dto: UserIdChangesDto) {
    await this.usersService.updateUserIds(dto);
  }

  @Get('training-token/:token')
  async getTrainingToken(@Param('token') token: string) {
    return await this.usersService.getTrainingToken(token);
  }

  @Get('training-token')
  async findTrainingTokens(@Query() query: TrainingTokenQueryDto) {
    return await this.usersService.findTrainingTokens(query);
  }

  @Post('training-token')
  async createTrainingToken(
    @Body()
    trainingParticipantRepresentationDto:
      | TrainingParticipantRepresentationDto
      | TrainingParticipantRepresentationDto[],
  ) {
    return await this.usersService.createTrainingToken(
      trainingParticipantRepresentationDto,
    );
  }

  @Delete('training-token/:token')
  async validateTrainingToken(@Param('token') token: string) {
    return await this.usersService.deleteTrainingToken(token);
  }
}
