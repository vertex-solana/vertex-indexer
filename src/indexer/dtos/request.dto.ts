import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { TypeColumn } from 'src/common/constant';
import { PagingRequest } from 'src/common/dtos/common.dto';
import { TriggerType } from 'src/common/enum/common.enum';
import { ColumnType } from 'src/common/types/column-type';
import { Cluster } from 'src/database/entities/rpc.entity';

export class CreateIndexerSpaceDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim())
  name: string;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  idlId?: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsEnum(Cluster)
  cluster: Cluster;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => value.trim())
  description: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => value.trim())
  programId: string;
}

export class GetIndexersRequest extends PagingRequest {}

export class TableSchemaDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim())
  name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsIn(TypeColumn, {
    message: `type must be one of the predefined column types ${TypeColumn.map((t) => `"${t}"`).join(', ')}`,
  })
  type: ColumnType;

  @ApiPropertyOptional()
  @IsOptional()
  nullable: boolean;
}

export class CreateTableDto {
  indexerId: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim())
  tableName: string;

  @ApiProperty({ type: [TableSchemaDto] })
  @ValidateNested({ each: true })
  @Type(() => TableSchemaDto)
  schema: TableSchemaDto[];
}

export class RegisterIndexerWithTransformDto {
  @ApiProperty()
  @IsNotEmpty()
  @Transform(({ value }) => parseInt(value))
  tableId: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsEnum(TriggerType)
  triggerType: TriggerType;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => value.trim())
  pdaPubkey: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => value.trim())
  pdaName: string;

  indexerId: number;

  accountId: number;
}

export class ExecuteQueryDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim())
  query: string;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  indexerId: number;
}

export class UpdateTransformerDto {
  @ApiProperty()
  @IsNotEmpty()
  @Transform(({ value }) => parseInt(value))
  transformerId: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => value.trim())
  script: string;

  indexerId: number;

  accountId: number;
}

export class DeleteTriggerDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  triggerId: number;

  indexerId: number;

  accountId: number;
}

export class CreateQueryLogDto {
  @ApiProperty()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim())
  query: string;

  @ApiProperty()
  description: string;

  accountId: number;

  indexerId: number;
}
