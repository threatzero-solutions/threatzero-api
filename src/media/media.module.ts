import { Module } from '@nestjs/common';
import { MediaService } from './media.service';
import { HttpModule } from '@nestjs/axios';
import { CacheModule } from '@nestjs/cache-manager';
import { CacheConfigService } from 'src/common/cache-config/cache-config.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VideoEvent } from './entities/video-event.entity';
import { MediaController } from './media.controller';

@Module({
  imports: [
    HttpModule,
    CacheModule.registerAsync({
      useClass: CacheConfigService,
    }),
    TypeOrmModule.forFeature([VideoEvent]),
  ],
  providers: [MediaService],
  exports: [MediaService],
  controllers: [MediaController],
})
export class MediaModule {}
