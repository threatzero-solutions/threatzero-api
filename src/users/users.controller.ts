import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { UserIdChangesDto } from './dto/user-id-change.dto';
import { UsersService } from './users.service';
import { CheckPolicies } from 'src/auth/casl/policies.guard';
import { EntityAbilityChecker } from 'src/common/entity-ability-checker';
import { UserRepresentation } from './entities/user-representation.entity';

@Controller('users')
@CheckPolicies(new EntityAbilityChecker(UserRepresentation))
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('migrate-ids')
  @HttpCode(HttpStatus.ACCEPTED)
  async migrateIds(@Body() dto: UserIdChangesDto) {
    await this.usersService.updateUserIds(dto);
  }
}
