import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
  Put,
} from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { CheckPolicies } from 'src/auth/casl/policies.guard';
import { Organization } from './entities/organization.entity';
import { EntityAbilityChecker } from 'src/common/entity-ability-checker';
import { BaseQueryOrganizationsDto } from '../common/dto/base-query-organizations';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { IdpProtocol, IdpProtocols } from 'src/auth/dto/create-idp.dto';
import { CreateOrganizationIdpDto } from './dto/create-organization-idp.dto';

@Controller('organizations/organizations')
@CheckPolicies(new EntityAbilityChecker(Organization))
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  create(@Body() createOrganizationDto: CreateOrganizationDto) {
    return this.organizationsService.create(createOrganizationDto);
  }

  @Get()
  findAll(@Query() query: BaseQueryOrganizationsDto) {
    return this.organizationsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.organizationsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateOrganizationDto: UpdateOrganizationDto,
  ) {
    return this.organizationsService.update(id, updateOrganizationDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.organizationsService.remove(id);
  }

  @Post(':id/idps/load-imported-config/:protocol')
  @UseInterceptors(AnyFilesInterceptor())
  async loadImportedConfig(
    @UploadedFiles() files: Express.Multer.File[] | undefined,
    @Param('protocol') protocol: IdpProtocol,
    @Body() body: Record<string, string>,
  ) {
    if (!IdpProtocols.includes(protocol)) {
      throw new BadRequestException(`Invalid protocol: '${protocol}'`);
    }

    let input: FormData | { fromUrl: string; providerId: IdpProtocol } = {
      fromUrl: body.url,
      providerId: protocol,
    };

    const configFile = files?.find((f) =>
      ['file', 'config'].includes(f.fieldname),
    );

    if (configFile) {
      const fd = new FormData();
      fd.append(
        'file',
        new Blob([configFile.buffer], { type: 'application/octet-stream' }),
      );
      fd.append('providerId', protocol);
      input = fd;
    } else if (!input.fromUrl) {
      throw new BadRequestException('Missing url in request body.');
    }

    // TODO: Handle errors better.
    return await this.organizationsService.importIdpConfig(input);
  }

  @Get(':id/idps/role-groups')
  getRoleGroups(@Param('id') id: string) {
    return this.organizationsService.getRoleGroups(id);
  }

  @Get(':id/idps/:slug')
  getIdp(@Param('id') id: string, @Param('slug') slug: string) {
    return this.organizationsService.getIdp(id, slug);
  }

  @Post(':id/idps')
  createIdp(
    @Param('id') id: string,
    @Body() createOrganizationIdpDto: CreateOrganizationIdpDto,
  ) {
    return this.organizationsService.createIdp(id, createOrganizationIdpDto);
  }

  @Put(':id/idps/:slug')
  updateIdp(
    @Param('id') id: string,
    @Param('slug') slug: string,
    @Body() updateOrganizationIdpDto: CreateOrganizationIdpDto,
  ) {
    return this.organizationsService.updateIdp(
      id,
      slug,
      updateOrganizationIdpDto,
    );
  }

  @Delete(':id/idps/:slug')
  deleteIdp(@Param('id') id: string, @Param('slug') slug: string) {
    return this.organizationsService.deleteIdp(id, slug);
  }
}
