import { CacheModule } from '@nestjs/cache-manager';
import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClsModule } from 'nestjs-cls';
import { CacheConfigService } from 'src/common/cache-config/cache-config.service';
import { ActiveOrganizationGuard } from 'src/organizations/guards/active-organization/active-organization.guard';
import { AuthGuard } from './auth.guard';
import {
  CASL_ABILITY_FACTORY,
  CaslAbilityFactory,
} from './casl/casl-ability.factory';
import { CaslModule } from './casl/casl.module';
import { PoliciesGuard } from './casl/policies.guard';
import { OpaqueToken } from './entities/opaque-token.entity';
import {
  KEYCLOAK_ADMIN_CLIENT,
  KeycloakAdminClientService,
  keycloakAdminClientFactory,
} from './keycloak-admin-client/keycloak-admin-client.service';
import { OpaqueTokenService } from './opaque-token.service';
import { UserFactory } from './user.factory';

@Global()
@Module({
  imports: [
    JwtModule.register({}),
    CaslModule,
    TypeOrmModule.forFeature([OpaqueToken]),
    ClsModule.forRoot({
      middleware: {
        mount: true,
      },
    }),
    CacheModule.registerAsync({
      useClass: CacheConfigService,
    }),
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
      provide: APP_GUARD,
      useClass: ActiveOrganizationGuard,
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
  exports: [KeycloakAdminClientService, OpaqueTokenService, ClsModule],
})
export class AuthModule {}
