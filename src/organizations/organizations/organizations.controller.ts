import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  NotFoundException,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Res,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { Public } from 'src/auth/auth.guard';
import {
  Action,
  LmsScormPackageSubject,
  LmsTokenSubject,
} from 'src/auth/casl/constants';
import { CheckPolicies } from 'src/auth/casl/policies.guard';
import { IdpProtocol, IdpProtocols } from 'src/auth/dto/create-idp.dto';
import { EntityAbilityChecker } from 'src/common/entity-ability-checker';
import { ParseDatePipe } from 'src/common/pipes/parse-date/parse-date.pipe';
import {
  ScormVersion,
  ScormVersionPipe,
} from 'src/common/pipes/scorm-version/scorm-version.pipe';
import { GetPresignedUploadUrlsDto } from 'src/media/dto/get-presigned-upload-urls.dto';
import { BaseQueryOrganizationsDto } from '../common/dto/base-query-organizations';
import { CreateOrganizationIdpDto } from './dto/create-organization-idp.dto';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { LmsViewershipTokenQueryDto } from './dto/lms-viership-token-query.dto';
import { LmsViewershipTokenValueDto } from './dto/lms-viewership-token-value.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { Organization } from './entities/organization.entity';
import { OrganizationsService } from './organizations.service';

@Controller('organizations/organizations')
@CheckPolicies(new EntityAbilityChecker(Organization))
export class OrganizationsController {
  private readonly logger = new Logger(OrganizationsController.name);

  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  create(@Body() createOrganizationDto: CreateOrganizationDto) {
    return this.organizationsService.create(createOrganizationDto);
  }

  @Get()
  findAll(@Query() query: BaseQueryOrganizationsDto) {
    return this.organizationsService.findAll(query);
  }

  @Get('slug-unique')
  async slugUnique(@Query('slug') slug: string) {
    return this.organizationsService
      .isUniqueSlug(slug)
      .then((isUnique) => ({ isUnique }));
  }

  @Get('idp-slug-unique')
  async idpSlugUnique(@Query('slug') slug: string) {
    return this.organizationsService
      .isUniqueIdpAlias(slug)
      .then((isUnique) => ({ isUnique }));
  }

  @Get('slug/:slug')
  findOneBySlug(@Param('slug') slug: string) {
    return this.organizationsService.findOneBySlug(slug);
  }

  @Public()
  @Get('mine')
  findMyOrganization() {
    const org = this.organizationsService.findMyOrganization();
    if (org) return org;
    throw new NotFoundException();
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

  @Post(':id/lms-tokens')
  @CheckPolicies((ability) => ability.can(Action.Create, LmsTokenSubject))
  createLmsToken(
    @Param('id') id: string,
    @Body() lmsViewershipTokenValueDto: LmsViewershipTokenValueDto,
    @Query('expiresOn', new ParseDatePipe({ optional: true })) expiresOn?: Date,
  ) {
    return this.organizationsService.createLmsToken(
      id,
      lmsViewershipTokenValueDto,
      expiresOn,
    );
  }

  @Get(':id/lms-tokens')
  @CheckPolicies((ability) => ability.can(Action.Read, LmsTokenSubject))
  getLmsTokens(
    @Param('id') id: string,
    @Query() lmsViewershipTokenQueryDto: LmsViewershipTokenQueryDto,
  ) {
    return this.organizationsService.findLmsTokens(
      id,
      lmsViewershipTokenQueryDto,
    );
  }

  @Patch(':id/lms-tokens/expiration')
  @HttpCode(HttpStatus.NO_CONTENT)
  @CheckPolicies((ability) => ability.can(Action.Update, LmsTokenSubject))
  setLmsTokenExpiration(
    @Param('id') id: string,
    @Query() lmsViewershipTokenQueryDto: LmsViewershipTokenQueryDto,
    @Body('expiration', new ParseDatePipe({ optional: true }))
    expiration: Date | null,
  ) {
    return this.organizationsService.setLmsTokenExpiration(
      id,
      lmsViewershipTokenQueryDto,
      expiration,
    );
  }

  @Get(':id/lms-tokens/scorm')
  @CheckPolicies((ability) => ability.can(Action.Read, LmsScormPackageSubject))
  async downloadScormPackage(
    @Param('id') id: string,
    @Query('key') tokenKey: string,
    @Res() res: Response,
    @Query('version', new ScormVersionPipe({ optional: true }))
    version?: ScormVersion,
  ) {
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="threatzero-training-scorm.zip"',
    );
    const stream = await this.organizationsService.downloadScormPackage(
      id,
      tokenKey,
      version,
    );

    stream.on('error', (e) => {
      const msg = `An error occurred while generating SCORM package.`;
      this.logger.error(msg, e.stack);
      res.status(500).send(msg);
    });

    stream.pipe(res);
  }

  @Post(':id/idps/load-imported-config/:protocol')
  @UseInterceptors(AnyFilesInterceptor())
  @CheckPolicies(
    (ability) =>
      ability.can(Action.Create, CreateOrganizationIdpDto) ||
      ability.can(Action.Update, CreateOrganizationIdpDto),
  )
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
  @CheckPolicies((ability) =>
    ability.can(Action.Read, CreateOrganizationIdpDto),
  )
  getIdp(@Param('id') id: string, @Param('slug') slug: string) {
    return this.organizationsService.getIdp(id, slug);
  }

  @Post(':id/idps')
  @CheckPolicies((ability) =>
    ability.can(Action.Create, CreateOrganizationIdpDto),
  )
  createIdp(
    @Param('id') id: string,
    @Body() createOrganizationIdpDto: CreateOrganizationIdpDto,
  ) {
    return this.organizationsService.createIdp(id, createOrganizationIdpDto);
  }

  @Put(':id/idps/:slug')
  @CheckPolicies((ability) =>
    ability.can(Action.Update, CreateOrganizationIdpDto),
  )
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
  @CheckPolicies((ability) =>
    ability.can(Action.Delete, CreateOrganizationIdpDto),
  )
  deleteIdp(@Param('id') id: string, @Param('slug') slug: string) {
    return this.organizationsService.deleteIdp(id, slug);
  }

  @Post(':id/generate-policy-upload-urls')
  @CheckPolicies((ability) => ability.can(Action.Update, Organization))
  getPresignedUploadUrls(
    @Param('id') id: string,
    @Body() body: GetPresignedUploadUrlsDto,
  ) {
    return this.organizationsService.generatePolicyUploadUrls(id, body);
  }
}
