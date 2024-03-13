import { ClassSerializerInterceptor, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TrainingModule } from './training/training.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import generalConfig from './config/general.config';
import databaseConfig from './config/database.config';
import { validate } from './config/env.validation';
import awsConfig from './config/aws.config';
import notificationsConfig from './config/notifications.config';
import redisConfig, { RedisConfig } from './config/redis.config';
import keycloakConfig from './config/keycloak.config';
import vimeoConfig from './config/vimeo.config';
import mediaConfig from './config/media.config';
import authConfig from './config/auth.config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { OrganizationsModule } from './organizations/organizations.module';
import { AuthModule } from './auth/auth.module';
import { ThreatAssessmentsModule } from './threat-assessments/threat-assessments.module';
import { FormsModule } from './forms/forms.module';
import { MediaModule } from './media/media.module';
import { TipsModule } from './tips/tips.module';
import { UsersModule } from './users/users.module';
import { AwsModule } from './aws/aws.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import Redis from 'ioredis';
import { BullModule } from '@nestjs/bullmq';
import { ConnectionOptions as BullMQConnectionOptions } from 'bullmq';
import { NotificationsModule } from './notifications/notifications.module';
import { ResourcesModule } from './resources/resources.module';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [
        authConfig,
        generalConfig,
        databaseConfig,
        awsConfig,
        notificationsConfig,
        redisConfig,
        keycloakConfig,
        vimeoConfig,
        mediaConfig,
      ],
      validate,
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
    AuthModule,
    ResourcesModule,
    MediaModule,
    TrainingModule,
    OrganizationsModule,
    ThreatAssessmentsModule,
    FormsModule,
    TipsModule,
    UsersModule,
    AwsModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ClassSerializerInterceptor,
    },
  ],
})
export class AppModule {}
