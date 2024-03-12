import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { AuthGuard } from './auth.guard';
import { CaslModule } from './casl/casl.module';
import { PoliciesGuard } from './casl/policies.guard';
import {
  CASL_ABILITY_FACTORY,
  CaslAbilityFactory,
} from './casl/casl-ability.factory';
import { UserFactory } from './user.factory';

@Module({
  imports: [JwtModule.register({}), CaslModule],
  providers: [
    {
      provide: CASL_ABILITY_FACTORY,
      useClass: CaslAbilityFactory,
    },
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PoliciesGuard,
    },
    UserFactory,
  ],
})
export class AuthModule {}
