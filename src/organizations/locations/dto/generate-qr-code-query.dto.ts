import { IsHexColor, IsOptional, IsPositive } from 'class-validator';

export class GenerateQrCodeQueryDto {
  @IsOptional()
  @IsPositive()
  margin = 2;

  @IsHexColor()
  @IsOptional()
  color_dark = '#111111';

  @IsHexColor()
  @IsOptional()
  color_light = '#ffffff';
}
