import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRepresentation } from './entities/user-representation.entity';
import { StatelessUser } from 'src/auth/user.factory';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserRepresentation)
    private usersRepository: Repository<UserRepresentation>,
  ) {}

  async updateRepresentation(user: StatelessUser) {
    const userRepresentation = this.usersRepository.create({
      externalId: user.id,
      email: user.email,
      name: user.name,
      givenName: user.firstName,
      familyName: user.lastName,
      picture: user.picture,
      organizationSlug: user.organizationSlug,
      unitSlug: user.unitSlug,
    });
    return this.usersRepository.upsert(userRepresentation, ['externalId']);
  }
}
