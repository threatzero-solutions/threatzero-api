import { BaseEntityService } from 'src/common/base-entity.service';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Location } from './entities/location.entity';
import { ConfigService } from '@nestjs/config';
import { GenerateQrCodeQueryDto } from './dto/generate-qr-code-query.dto';
import QRCode from 'qrcode';
import { BaseQueryDto } from 'src/common/dto/base-query.dto';
import { getOrganizationLevel } from '../common/organizations.utils';
import { CommonClsStore } from 'src/common/types/common-cls-store';
import { LEVEL } from 'src/auth/permissions';
import { ClsService } from 'nestjs-cls';
import { PassThrough } from 'stream';

export class LocationsService extends BaseEntityService<Location> {
  alias = 'location';

  constructor(
    @InjectRepository(Location)
    private locationsRepository: Repository<Location>,
    private readonly cls: ClsService<CommonClsStore>,
    private readonly config: ConfigService,
  ) {
    super();
  }

  getRepository() {
    return this.locationsRepository;
  }

  getQb(query?: BaseQueryDto) {
    const user = this.cls.get('user');
    const qb = super.getQb(query).leftJoinAndSelect('location.unit', 'unit');

    switch (getOrganizationLevel(user)) {
      case LEVEL.ADMIN:
        return qb;
      case LEVEL.ORGANIZATION:
        return qb
          .leftJoinAndSelect('unit.organization', 'organization')
          .andWhere('organization.slug = :organizationSlug', {
            organizationSlug: user?.organizationSlug,
          });
      case LEVEL.UNIT:
        return qb.andWhere('unit.slug = :unitSlug', {
          unitSlug: user?.unitSlug,
        });
      default:
        return qb.where('1 = 0');
    }
  }

  async findUnitLocation(locationId: string) {
    const location = await this.getRepository().findOne({
      where: {
        locationId,
      },
      relations: {
        unit: true,
      },
    });
    return location;
  }

  generateQRCode(locationId: string, query: GenerateQrCodeQueryDto) {
    const tipUrl = `${this.config.get<string>('general.appHost')}/sos/?loc_id=${locationId}`;

    const stream = new PassThrough();

    try {
      QRCode.toFileStream(stream, tipUrl, {
        margin: query.margin,
        color: {
          dark: query.color_dark,
          light: query.color_light,
        },
      });
    } catch (e) {
      stream.emit('error', e);
    }

    return stream;
  }
}
