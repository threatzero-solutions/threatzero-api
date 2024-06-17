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
import {
  KEYCLOAK_ADMIN_CLIENT,
  KeycloakAdminClientService,
  keycloakAdminClientFactory,
} from './keycloak-admin-client/keycloak-admin-client.service';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OpaqueToken } from './entities/opaque-token.entity';
import { OpaqueTokenService } from './opaque-token.service';

@Module({
  imports: [
    JwtModule.register({}),
    CaslModule,
    TypeOrmModule.forFeature([OpaqueToken]),
  ],
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
    {
      provide: KEYCLOAK_ADMIN_CLIENT,
      useFactory: (config: ConfigService) => keycloakAdminClientFactory(config),
      inject: [ConfigService],
    },
    UserFactory,
    KeycloakAdminClientService,
    OpaqueTokenService,
  ],
  exports: [KeycloakAdminClientService, OpaqueTokenService],
})
export class AuthModule {}
