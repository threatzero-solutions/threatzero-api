import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { UsersService } from '../users.service';

@Injectable()
export class UserSyncTask {
  constructor(private readonly usersService: UsersService) {}

  @Cron('0 0 * * *')
  async syncMissingLocalUsersFromOpaqueTokens() {
    await this.usersService.syncMissingLocalUsersFromOpaqueTokens();
  }
}
