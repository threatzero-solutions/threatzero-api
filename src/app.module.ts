import { ClassSerializerInterceptor, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TrainingModule } from './training/training.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import generalConfig from './config/general.config';
import databaseConfig from './config/database.config';
import awsConfig from './config/aws.config';
import notificationsConfig from './config/notifications.config';
import redisConfig, { RedisConfig } from './config/redis.config';
import keycloakConfig from './config/keycloak.config';
import vimeoConfig from './config/vimeo.config';
import authConfig from './config/auth.config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { OrganizationsModule } from './organizations/organizations.module';
import { AuthModule } from './auth/auth.module';
import { FormsModule } from './forms/forms.module';
import { MediaModule } from './media/media.module';
import { UsersModule } from './users/users.module';
import { AwsModule } from './aws/aws.module';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import Redis from 'ioredis';
import { BullModule } from '@nestjs/bullmq';
import { ConnectionOptions as BullMQConnectionOptions } from 'bullmq';
import { NotificationsModule } from './notifications/notifications.module';
import { ResourcesModule } from './resources/resources.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { HealthModule } from './health/health.module';
import { SafetyManagementModule } from './safety-management/safety-management.module';
import { LanguagesModule } from './languages/languages.module';
import helmetConfig from './config/helmet.config';
import corsConfig from './config/cors.config';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      expandVariables: true,
      load: [
        authConfig,
        generalConfig,
        databaseConfig,
        awsConfig,
        notificationsConfig,
        redisConfig,
        keycloakConfig,
        vimeoConfig,
        helmetConfig,
        corsConfig,
      ],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => {
        return {
          ...config.getOrThrow<PostgresConnectionOptions>('database'),
          autoLoadEntities: true,
        };
      },
      inject: [ConfigService],
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => {
        const redisConfig = config.getOrThrow<RedisConfig>('redis');

        let connection: BullMQConnectionOptions = {
          ...redisConfig.connectionOptions,
          ...redisConfig.redisOptions,
        };

        if (redisConfig.clusterMode) {
          connection = new Redis.Cluster(
            [redisConfig.connectionOptions],
            redisConfig.clusterOptions,
          );
        }

        return {
          connection,
        };
      },
      inject: [ConfigService],
    }),
    EventEmitterModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        ttl: 5 * 60 * 1000, // 5 minutes
        limit: 1000,
      },
    ]),
    AuthModule,
    ResourcesModule,
    MediaModule,
    TrainingModule,
    OrganizationsModule,
    FormsModule,
    UsersModule,
    AwsModule,
    NotificationsModule,
    HealthModule,
    SafetyManagementModule,
    LanguagesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ClassSerializerInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
