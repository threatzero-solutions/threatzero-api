import { BadRequestException } from '@nestjs/common';
import { BaseEntityService } from 'src/common/base-entity.service';
import { POCFile } from './entities/poc-file.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { UnitsService } from 'src/organizations/units/units.service';
import { LEVEL } from 'src/auth/permissions';
import { BaseQueryDto } from 'src/common/dto/base-query.dto';
import {
  getOrganizationLevel,
  getUserUnitPredicate,
} from 'src/organizations/common/organizations.utils';
import { ThreatAssessmentsService } from '../threat-assessments/threat-assessments.service';
import { TipsService } from '../tips/tips.service';
import { ClsService } from 'nestjs-cls';
import { CommonClsStore } from 'src/common/types/common-cls-store';

export class POCFilesService extends BaseEntityService<POCFile> {
  constructor(
    @InjectRepository(POCFile) private pocFilesRepository: Repository<POCFile>,
    private readonly cls: ClsService<CommonClsStore>,
    private unitsService: UnitsService,
    private assessmentsService: ThreatAssessmentsService,
    private tipsService: TipsService,
  ) {
    super();
  }

  getRepository() {
    return this.pocFilesRepository;
  }

  getQb(query?: BaseQueryDto) {
    const user = this.cls.get('user');
    const qb = super
      .getQb(query)
      .leftJoinAndSelect(`${super.getQb().alias}.unit`, 'unit')
      .leftJoinAndSelect(`${super.getQb().alias}.peerUnits`, 'peerUnit')
      .leftJoinAndSelect(`${super.getQb().alias}.assessments`, 'assessments')
      .leftJoinAndSelect(`${super.getQb().alias}.tips`, 'tips');

    switch (getOrganizationLevel(user)) {
      case LEVEL.ADMIN:
        return qb;
      case LEVEL.UNIT:
        return qb.andWhere(getUserUnitPredicate(user));
      case LEVEL.ORGANIZATION:
        return qb
          .leftJoinAndSelect(`${qb.alias}.organization`, 'org_organization')
          .andWhere('org_organization.slug = :organizationSlug', {
            organizationSlug: user?.organizationSlug,
          });
      default:
        return qb.where('1 = 0');
    }
  }

  async validateUnit(unitId: string) {
    const valid = await this.unitsService.getQbSingle(unitId).getExists();
    if (!valid) {
      throw new BadRequestException('Invalid unit provided.');
    }
  }

  async create(createPOCFileDto: DeepPartial<POCFile>) {
    if (createPOCFileDto.unit?.id) {
      await this.validateUnit(createPOCFileDto.unit.id);
    } else {
      const userUnit = await this.unitsService.getUserUnit();
      if (userUnit) {
        createPOCFileDto.unit = userUnit;
      }
    }
    return super.create(createPOCFileDto);
  }

  async update(id: string, updateEntityDto: DeepPartial<POCFile>) {
    if (updateEntityDto.unit?.id) {
      await this.validateUnit(updateEntityDto.unit.id);
    }
    return super.update(id, updateEntityDto);
  }

  async addPeerUnit(id: string, peerUnitId: string) {
    await this.validateUnit(peerUnitId);
    if (await this.getQbSingle(id).getExists()) {
      await this.getQbSingle(id)
        .relation(POCFile, 'peerUnits')
        .of(id)
        .add(peerUnitId);
    }
  }

  async removePeerUnit(id: string, peerUnitId: string) {
    await this.validateUnit(peerUnitId);
    if (await this.getQbSingle(id).getExists()) {
      await this.getQbSingle(id)
        .relation(POCFile, 'peerUnits')
        .of(id)
        .remove(peerUnitId);
    }
  }

  async validateAssessmentRelation(id: string, assessmentId: string) {
    return Promise.all([
      this.getQbSingle(id).getExists(),
      this.assessmentsService.getQbSingle(assessmentId).getExists(),
    ]).then((validations) => validations.every((v) => v));
  }

  async addAssessment(id: string, assessmentId: string) {
    if (await this.validateAssessmentRelation(id, assessmentId)) {
      await this.getQbSingle(id)
        .relation(POCFile, 'assessments')
        .of(id)
        .add(assessmentId);
    }
  }

  async removeAssessment(id: string, assessmentId: string) {
    if (await this.validateAssessmentRelation(id, assessmentId)) {
      await this.getQbSingle(id)
        .relation(POCFile, 'assessments')
        .of(id)
        .remove(assessmentId);
    }
  }

  async validateTipRelation(id: string, tipId: string) {
    return Promise.all([
      this.getQbSingle(id).getExists(),
      this.tipsService.getQbSingle(tipId).getExists(),
    ]).then((validations) => validations.every((v) => v));
  }

  async addTip(id: string, tipId: string) {
    if (await this.validateTipRelation(id, tipId)) {
      await this.getQbSingle(id).relation(POCFile, 'tips').of(id).add(tipId);
    }
  }

  async removeTip(id: string, tipId: string) {
    if (await this.validateTipRelation(id, tipId)) {
      await this.getQbSingle(id).relation(POCFile, 'tips').of(id).remove(tipId);
    }
  }
}
