import { Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, ValidateNested } from 'class-validator';
import { SaveByIdDto } from 'src/common/dto.utils';
import { CreateOrganizationBaseDto } from 'src/organizations/common/dto/create-organization-base.dto';
import { Organization } from 'src/organizations/organizations/entities/organization.entity';
import { Unit } from '../entities/unit.entity';

export class CreateUnitDto extends CreateOrganizationBaseDto {
  @ValidateNested()
  @Type(() => SaveByIdDto<Organization>)
  @IsNotEmpty()
  organization: SaveByIdDto<Organization>;

  @IsOptional()
  @ValidateNested()
  @Type(() => SaveByIdDto<Unit>)
  parentUnit?: SaveByIdDto<Unit>;
}
