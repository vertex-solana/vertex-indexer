import { ApiProperty } from '@nestjs/swagger';
import { AccountResponse } from 'src/account/dtos/response.dto';
import { TriggerType } from 'src/common/enum/common.enum';
import {
  IndexerEntity,
  IndexerTableMetadataEntity,
  IndexerTriggerEntity,
  ISchemaTableDefinition,
  QueryLogEntity,
  TransformerPdaEntity,
} from 'src/database/entities';

export class IndexerTableMetadataResponse {
  @ApiProperty()
  id: number;

  @ApiProperty()
  tableName: string;

  @ApiProperty()
  fullTableName: string;

  @ApiProperty({
    type: [ISchemaTableDefinition],
  })
  schema: ISchemaTableDefinition[];

  @ApiProperty()
  indexerId: number;

  constructor(tableMetadata: IndexerTableMetadataEntity) {
    this.id = tableMetadata.id;
    this.tableName = tableMetadata.tableName;
    this.fullTableName = tableMetadata.fullTableName;
    this.schema = tableMetadata.schema;
    this.indexerId = tableMetadata.indexerId;
  }
}

export class ResultExecuteQueryResponse {
  @ApiProperty()
  query: string;

  @ApiProperty()
  schema: { [key: string]: string };

  @ApiProperty()
  rows: { [key: string]: string }[];
}

export class TransformerResponse {
  @ApiProperty()
  id: number;

  @ApiProperty()
  script: string;

  @ApiProperty()
  indexerId: number;

  constructor(transformer: TransformerPdaEntity) {
    this.script = transformer.script;
    this.indexerId = transformer.indexerId;
    this.id = transformer.id;
  }
}

export class IndexerTriggerAndTransformerResponse {
  @ApiProperty()
  id: number;

  @ApiProperty()
  triggerType: TriggerType;

  @ApiProperty()
  pdaPubkey: string;

  @ApiProperty()
  pdaName: string;

  @ApiProperty()
  transformerPdaId: number;

  @ApiProperty({ type: IndexerTableMetadataResponse })
  transformerPda: TransformerResponse;

  @ApiProperty({ type: IndexerTableMetadataResponse })
  indexerTableId: number;

  @ApiProperty({ type: IndexerTableMetadataResponse })
  indexerId: number;

  constructor(trigger: IndexerTriggerEntity) {
    this.id = trigger.id;
    this.triggerType = trigger.triggerType;
    this.pdaPubkey = trigger.pdaPubkey;
    this.pdaName = trigger.pdaName;
    this.transformerPdaId = trigger.transformerPdaId;
    this.indexerTableId = trigger.indexerTableId;
    this.indexerId = trigger.indexerId;
    this.transformerPda = new TransformerResponse(trigger.transformerPda);
  }
}

export class IndexerResponse {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  programId: string;

  @ApiProperty()
  idlId: number;

  @ApiProperty()
  cluster: string;

  @ApiProperty()
  schemaPath: string;

  @ApiProperty()
  ownerAccountId: number;

  @ApiProperty({ type: AccountResponse })
  owner: AccountResponse;

  constructor(indexer: IndexerEntity) {
    this.id = indexer.id;
    this.name = indexer.name;
    this.description = indexer.description;
    this.slug = indexer.slug;
    this.programId = indexer.programId;
    this.idlId = indexer.idlId;
    this.cluster = indexer.cluster;
    this.schemaPath = indexer.schemaPath;
    this.ownerAccountId = indexer.accountId;
    this.owner = new AccountResponse(indexer.account);
  }
}

export class QueryLogResponse {
  @ApiProperty()
  id: number;

  @ApiProperty()
  description: string;

  @ApiProperty()
  query: string;

  @ApiProperty()
  indexerId: number;

  constructor(queryLog: QueryLogEntity) {
    this.id = queryLog.id;
    this.description = queryLog.description;
    this.query = queryLog.query;
    this.indexerId = queryLog.indexerId;
  }
}
