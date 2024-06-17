import { Body, Controller, HttpCode, Post, Query, Req } from '@nestjs/common';
import { MediaService } from './media.service';
import { CreateVideoEventDto } from './dto/create-video-event.dto';
import { Request } from 'express';
import { Public } from 'src/auth/auth.guard';

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('video/events')
  @Public()
  @HttpCode(202)
  async receiveVideoEvent(
    @Body() event: CreateVideoEventDto,
    @Req() request: Request,
    @Query('watch_id') watchId?: string,
  ) {
    await this.mediaService.receiveVideoEvent(event, request, watchId);
  }
}
