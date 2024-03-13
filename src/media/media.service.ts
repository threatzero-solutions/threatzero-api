import { getSignedUrl } from '@aws-sdk/cloudfront-signer';
import { HttpService } from '@nestjs/axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cache } from 'cache-manager';
import dayjs from 'dayjs';
import path from 'path';
import { firstValueFrom } from 'rxjs';
import { CloudFrontDistributionConfig } from 'src/config/aws.config';
import { VimeoConfig } from 'src/config/vimeo.config';
import {
  GetVimeoThumbnailUrlOptions,
  VimeoThumbnailResponse,
} from './interfaces/vimeo';

const DEFAULT_WIDTH = 640;

@Injectable()
export class MediaService {
  constructor(
    @Inject(CACHE_MANAGER) private cache: Cache,
    private config: ConfigService,
    private readonly http: HttpService,
  ) {}
  getCloudFrontUrlSigner(prefix = '') {
    const options = this.config.getOrThrow<CloudFrontDistributionConfig>(
      'aws.cloudfront.distributions.appfiles',
    );

    return (key: string) => {
      const expires = dayjs().add(
        options.defaultPolicyExpirationSeconds,
        'seconds',
      );

      return getSignedUrl({
        url: path.join(options.domain, prefix, key),
        keyPairId: options.keyPairId,
        privateKey: options.privateKey,
        dateLessThan: expires.toISOString(),
      });
    };
  }

  /**
   * Find a best match thumbnail for a Vimeo video URL
   *
   * @param videoURL The Vimeo video URL
   * @param options options for finding best thumbnail match
   * @returns The thumbnail URL
   */
  async getThumbnailUrlForVimeoUrl(
    url: string,
    options?: GetVimeoThumbnailUrlOptions,
  ) {
    const videoId = new URL(url ?? '').pathname
      .split('/')
      .filter((p) => p.match(/^\d+$/))
      .shift();

    if (!videoId) {
      return null;
    }

    return this.getThumbnailUrlForVimeoVideoId(videoId, options);
  }

  /**
   * Find a best match thumbnail for a Vimeo video ID
   *
   * @param videoId The Vimeo video ID
   * @param options options for finding best thumbnail match
   * @returns The thumbnail URL
   */
  getThumbnailUrlForVimeoVideoId = async (
    videoId: string,
    options: GetVimeoThumbnailUrlOptions = {},
  ): Promise<string | null> => {
    const height = options.width === undefined ? options.height : undefined;
    const width =
      options.width ?? (height === undefined ? DEFAULT_WIDTH : undefined);

    // Try cache first so we don't have to perform this operation over and
    // over again.
    const cacheKey = `vimeo-thumbnail:${videoId}:${height}:${width}`;
    const cachedThumbnailUrl = await this.cache.get(cacheKey);
    if (cachedThumbnailUrl && typeof cachedThumbnailUrl === 'string') {
      return cachedThumbnailUrl;
    }

    const vimeoConfig = this.config.getOrThrow<VimeoConfig>('vimeo');

    // // Request thumbnail data from Vimeo.
    const url = `${vimeoConfig.apiBaseUrl.replace(
      /\/$/,
      '',
    )}/videos/${videoId}/pictures`;

    const res = await firstValueFrom(
      this.http.get<VimeoThumbnailResponse>(url, {
        headers: {
          Authorization: `Bearer ${vimeoConfig.auth.accessToken}`,
        },
      }),
    );

    if (res.status >= 400) {
      return null;
    }

    // Find the best thumbnail match by size.
    let bestUrlBySize: string | null = null;
    // Keep track of which size has the closest match.
    let heightDelta = Number.MAX_SAFE_INTEGER;
    let widthDelta = Number.MAX_SAFE_INTEGER;

    // All thumbnails that are active.
    const activeThumbnailSizes =
      res.data.data.find((picture) => picture.active)?.sizes ?? [];

    // Find the best match.
    for (const size of activeThumbnailSizes) {
      if (heightDelta === 0 || widthDelta === 0) {
        break;
      }

      let thisHeightDelta = Number.MAX_SAFE_INTEGER;
      if (height !== undefined) {
        thisHeightDelta = Math.abs(size.height - height);
      }

      let thisWidthDelta = Number.MAX_SAFE_INTEGER;
      if (width !== undefined) {
        thisWidthDelta = Math.abs(size.width - width);
      }

      if (thisHeightDelta <= heightDelta && thisWidthDelta <= widthDelta) {
        bestUrlBySize = size.link;
        heightDelta = thisHeightDelta;
        widthDelta = thisWidthDelta;
      }
    }

    if (bestUrlBySize === null) {
      return null;
    }

    // Store in cache for 10 minutes.
    this.cache.set(cacheKey, bestUrlBySize, 10 * 60 * 1000); // Cache expires in 10 minutes

    return bestUrlBySize;
  };
}
