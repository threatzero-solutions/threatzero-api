import { Module } from '@nestjs/common';
import { MediaService } from './media.service';
import { HttpModule } from '@nestjs/axios';
import { CacheModule } from '@nestjs/cache-manager';
import { CacheConfigService } from 'src/common/cache-config/cache-config.service';

@Module({
  imports: [
    HttpModule,
    CacheModule.registerAsync({
      useClass: CacheConfigService,
    }),
  ],
  providers: [MediaService],
  exports: [MediaService],
})
export class MediaModule {}
