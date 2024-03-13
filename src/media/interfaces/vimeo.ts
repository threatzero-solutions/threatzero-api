export interface VimeoThumbnailResponse {
  data: Array<{
    active: boolean;
    sizes: Array<{
      width: number;
      height: number;
      link: string;
    }>;
  }>;
}

export interface GetVimeoThumbnailUrlOptions {
  height?: number;
  width?: number;
}
