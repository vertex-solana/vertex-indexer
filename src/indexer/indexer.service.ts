import * as crypto from 'crypto';
import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PinoLogger } from 'nestjs-pino';
import {
  AccountEntity,
  IdlDappEntity,
  IndexerEntity,
  IndexerTableMetadataEntity,
  IndexerTriggerEntity,
  ISchemaTableDefinition,
  QueryLogEntity,
  TransformerPdaEntity,
} from 'src/database/entities';
import { DataSource, Repository } from 'typeorm';
import {
  CreateIndexerSpaceDto,
  CreateQueryLogDto,
  CreateTableDto,
  GetIndexersRequest,
  RegisterIndexerWithTransformDto,
  UpdateTransformerDto,
} from './dtos/request.dto';
import { Transactional } from 'typeorm-transactional';
import { createSlug, encrypt } from 'src/common/utils';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IndexerEventName } from 'src/common/enum/event.enum';
import { buildOrderBy } from 'src/common/utils/query.util';
import { isEmpty } from 'lodash';
import { SortDirection } from 'src/common/enum/common.enum';
import { IndexerCreateEvent } from 'src/websocket-listener/interfaces/event-module.interface';
import {
  getIndexerRole,
  IndexerSchemaCredentialEntity,
} from 'src/database/entities/indexer-schema-credential.entity';
import { CREDENTIAL_SECRET_KEY } from 'src/app.environment';

@Injectable()
export class IndexerService {
  constructor(
    private readonly eventEmitter: EventEmitter2,
    @InjectRepository(IndexerEntity)
    private readonly indexerRepository: Repository<IndexerEntity>,
    @InjectRepository(IdlDappEntity)
    private readonly idlRepository: Repository<IdlDappEntity>,
    @InjectRepository(IndexerTableMetadataEntity)
    private readonly tableMetadataRepository: Repository<IndexerTableMetadataEntity>,
    @InjectRepository(TransformerPdaEntity)
    private readonly transformerPdaRepository: Repository<TransformerPdaEntity>,
    @InjectRepository(IndexerTriggerEntity)
    private readonly indexerTriggerRepository: Repository<IndexerTriggerEntity>,
    @InjectRepository(QueryLogEntity)
    private readonly queryLogRepository: Repository<QueryLogEntity>,
    @InjectRepository(IndexerSchemaCredentialEntity)
    private readonly indexerSchemaCredentialRepository: Repository<IndexerSchemaCredentialEntity>,
    private readonly dataSource: DataSource,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(IndexerService.name);
  }

  @Transactional()
  async createIndexerSpace(
    input: CreateIndexerSpaceDto,
    account: AccountEntity,
  ): Promise<void> {
    const { idlId, name, cluster, description, programId } = input;

    let idl: IdlDappEntity | null = null;
    if (idlId) {
      idl = await this.findIdl(idlId);
    }

    const slug = createSlug(name);
    const exitIndexerName = await this.indexerRepository.findOne({
      where: { slug, accountId: account.id },
    });
    if (exitIndexerName) {
      throw new BadRequestException('Indexer name already exists');
    }
    const indexer = await this.indexerRepository.save({
      name,
      programId,
      idlId: idl?.id,
      accountId: account.id,
      slug,
      cluster,
      description,
    });

    const indexerSchemaPath = `indexer_${indexer.id}`;
    const indexerRoleOwner = getIndexerRole(indexer.id, 'owner');
    const indexerRoleReader = getIndexerRole(indexer.id, 'reader');

    // 1. Create schema
    await this.dataSource.query(
      `CREATE SCHEMA IF NOT EXISTS ${indexerSchemaPath};`,
    );

    // 2. Update indexer record
    await this.indexerRepository.update(
      { id: indexer.id },
      { schemaPath: indexerSchemaPath },
    );

    // 3. Generate password for owner
    const ownerPassword = crypto.randomBytes(12).toString('base64');

    // 4. Create roles
    await this.dataSource.query(`
      CREATE ROLE ${indexerRoleOwner} LOGIN PASSWORD '${ownerPassword}';
      CREATE ROLE ${indexerRoleReader} NOLOGIN;
    `);

    // 5. Grant permissions
    await this.dataSource.query(`
      -- Owner role gets full access
      GRANT USAGE ON SCHEMA ${indexerSchemaPath} TO ${indexerRoleOwner};
      GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA ${indexerSchemaPath} TO ${indexerRoleOwner};
      ALTER DEFAULT PRIVILEGES IN SCHEMA ${indexerSchemaPath}
        GRANT ALL PRIVILEGES ON TABLES TO ${indexerRoleOwner};

      -- Reader role gets read-only access
      GRANT USAGE ON SCHEMA ${indexerSchemaPath} TO ${indexerRoleReader};
      GRANT SELECT ON ALL TABLES IN SCHEMA ${indexerSchemaPath} TO ${indexerRoleReader};
      ALTER DEFAULT PRIVILEGES IN SCHEMA ${indexerSchemaPath}
        GRANT SELECT ON TABLES TO ${indexerRoleReader};

      -- Restrict from public schema
      REVOKE ALL ON SCHEMA public FROM ${indexerRoleOwner};
      REVOKE ALL ON SCHEMA public FROM ${indexerRoleReader};
    `);

    // 6. Store credential
    await this.indexerSchemaCredentialRepository.save({
      userName: indexerRoleOwner,
      passwordEncrypted: encrypt(ownerPassword, CREDENTIAL_SECRET_KEY),
      indexerId: indexer.id,
    });
  }

  async getIndexers(
    params: GetIndexersRequest,
  ): Promise<[IndexerEntity[], number]> {
    const [pageNum, pageSize, sorts] = params.pagination;

    const query = this.indexerRepository
      .createQueryBuilder('indexer')
      .leftJoinAndSelect('indexer.idl', 'idl')
      .leftJoinAndSelect('indexer.account', 'account');

    return await buildOrderBy(
      query,
      isEmpty(sorts)
        ? {
            'indexer.createdAt': SortDirection.DESC,
          }
        : sorts,
    )
      .take(pageSize)
      .skip(pageNum * pageSize)
      .getManyAndCount();
  }

  async getIndexersOwner(
    params: GetIndexersRequest,
    accountId: number,
  ): Promise<[IndexerEntity[], number]> {
    const [pageNum, pageSize, sorts] = params.pagination;

    const query = this.indexerRepository
      .createQueryBuilder('indexer')
      .leftJoinAndSelect('indexer.idl', 'idl')
      .leftJoinAndSelect('indexer.account', 'account')
      .where('indexer.accountId = :accountId', { accountId });

    return await buildOrderBy(
      query,
      isEmpty(sorts)
        ? {
            'indexer.createdAt': SortDirection.DESC,
          }
        : sorts,
    )
      .take(pageSize)
      .skip(pageNum * pageSize)
      .getManyAndCount();
  }

  async getIndexerById(indexerId: number): Promise<IndexerEntity> {
    const indexer = await this.indexerRepository.findOne({
      where: { id: indexerId },
      relations: {
        account: true,
      },
    });
    if (!indexer) {
      throw new NotFoundException(`Indexer not found`);
    }
    return indexer;
  }

  async getAllIndexerTriggerAndTransformOfTable(input: {
    indexerId: number;
    accountId: number;
    tableId: number;
  }): Promise<IndexerTriggerEntity[]> {
    const { indexerId, tableId, accountId } = input;

    await this.findIndexerWithAccountId(indexerId, accountId);

    return await this.indexerTriggerRepository
      .createQueryBuilder('trigger')
      .innerJoin('trigger.indexerTable', 'table')
      .innerJoinAndSelect('trigger.transformerPda', 'transformer')
      .where('trigger.indexerId = :indexerId', { indexerId })
      .andWhere('table.id = :tableId', { tableId })
      .orderBy('trigger.createdAt', 'DESC')
      .getMany();
  }

  @Transactional()
  async createTable(
    input: CreateTableDto,
    account: AccountEntity,
  ): Promise<void> {
    const { indexerId, tableName, schema } = input;

    const indexer = await this.findIndexerWithAccountId(indexerId, account.id);

    const existingTable = await this.tableMetadataRepository.findOne({
      where: { tableName, indexerId },
    });
    if (existingTable) {
      throw new HttpException(
        'Table already exists in this indexer',
        HttpStatus.CONFLICT,
      );
    }

    const tableSchema: ISchemaTableDefinition[] = schema.map((column) => ({
      name: column.name,
      type: column.type,
      nullable: column.nullable ?? false,
    }));
    const originalTableSchema = [...tableSchema];

    tableSchema.push({
      name: 'id',
      type: 'bigint',
      nullable: false,
    });

    const newTableMetadata = this.tableMetadataRepository.create({
      tableName,
      fullTableName: `${account.userName}_${indexer.id}_${tableName}`,
      schema: tableSchema,
      indexerId,
      indexer,
    });
    await this.tableMetadataRepository.save(newTableMetadata);

    const createTableQuery = this.generateCreateTableQuery(
      newTableMetadata.fullTableName,
      originalTableSchema,
    );
    await this.tableMetadataRepository.query(createTableQuery);
  }

  @Transactional()
  async deleteTable(input: {
    indexerId: number;
    tableName: string;
    accountId: number;
  }): Promise<void> {
    const { indexerId, tableName, accountId } = input;

    await this.findIndexerWithAccountId(indexerId, accountId);

    const tableMetadata = await this.tableMetadataRepository.findOne({
      where: { tableName, indexerId },
    });
    if (!tableMetadata) {
      throw new NotFoundException('Table not found');
    }

    await this.tableMetadataRepository.query(`
      DELETE FROM indexer_trigger WHERE indexer_table_id = ${tableMetadata.id};  
    `);

    const dropTableQuery = `DROP TABLE IF EXISTS ${tableMetadata.fullTableName};`;
    await this.tableMetadataRepository.query(dropTableQuery);

    await this.tableMetadataRepository.delete({
      tableName,
      indexerId,
    });
  }

  async getAllTablesInIndexer(
    indexerId: number,
  ): Promise<IndexerTableMetadataEntity[]> {
    const indexer = await this.findIndexer(indexerId);

    return await this.tableMetadataRepository.find({
      where: { indexerId: indexer.id },
      order: { createdAt: 'DESC' },
    });
  }

  @Transactional()
  async registerIndexerWithTransform(
    input: RegisterIndexerWithTransformDto,
    fileContent: string,
  ): Promise<void> {
    const indexer = await this.findIndexerWithAccountId(
      input.indexerId,
      input.accountId,
    );

    const transformId = (
      await this.transformerPdaRepository
        .createQueryBuilder()
        .insert()
        .values({
          indexerId: indexer.id,
          script: fileContent,
        })
        .returning('id')
        .execute()
    ).raw[0].id;

    const tableMetadata = await this.findTableMetadata(
      indexer.id,
      input.tableId,
    );

    await this.indexerTriggerRepository.save({
      indexerId: indexer.id,
      indexerTableId: tableMetadata.id,
      pdaName: input.pdaName,
      pdaPubkey: input.pdaPubkey,
      triggerType: input.triggerType,
      transformerPdaId: transformId,
    });

    this.eventEmitter.emit(IndexerEventName.INDEXER_TRIGGER_CREATED, {
      programId: indexer.programId,
      cluster: indexer.cluster,
      pda: input.pdaPubkey,
    } as IndexerCreateEvent);
  }

  async getAllTransformersOfIndexer(
    indexerId: number,
    accountId: number,
  ): Promise<TransformerPdaEntity[]> {
    const indexer = await this.findIndexerWithAccountId(indexerId, accountId);

    return await this.transformerPdaRepository.find({
      where: { indexerId: indexer.id },
      order: { createdAt: 'DESC' },
    });
  }

  async updateTransformer(input: UpdateTransformerDto): Promise<void> {
    await this.findIndexerWithAccountId(input.indexerId, input.accountId);

    const transformer = await this.transformerPdaRepository.findOneBy({
      indexerId: input.indexerId,
      id: input.transformerId,
    });

    if (!transformer) {
      throw new NotFoundException('Transformer not found');
    }
    await this.transformerPdaRepository.update(
      { id: transformer.id },
      { script: input.script },
    );
  }

  async deleteTrigger(input: {
    indexerId: number;
    triggerId: number;
    accountId: number;
  }): Promise<void> {
    const { indexerId, triggerId, accountId } = input;

    await this.findIndexerWithAccountId(indexerId, accountId);

    const trigger = await this.indexerTriggerRepository.findOne({
      where: { id: triggerId, indexerId },
    });
    if (!trigger) {
      throw new NotFoundException('Trigger not found');
    }

    await this.indexerTriggerRepository.delete({ id: trigger.id });
  }

  async getAllQueryLogsInIndexer(indexerId: number): Promise<QueryLogEntity[]> {
    const indexer = await this.findIndexer(indexerId);

    return await this.queryLogRepository.find({
      where: { indexerId: indexer.id },
      order: { createdAt: 'DESC' },
    });
  }

  async createQueryLogs(input: CreateQueryLogDto): Promise<void> {
    await this.findIndexerWithAccountId(input.indexerId, input.accountId);

    const queryLog = this.queryLogRepository.create({
      indexerId: input.indexerId,
      query: input.query,
      description: input.description,
    });
    await this.queryLogRepository.save(queryLog);
  }

  private generateCreateTableQuery(
    tableName: string,
    schema: ISchemaTableDefinition[],
  ): string {
    let columnsDefinition = schema
      .map(
        (col) =>
          `${col.name} ${this.mapColumnType(col.type)} ${col.nullable ? 'NULL' : 'NOT NULL'}`,
      )
      .join(', ');

    columnsDefinition += `, id BIGSERIAL NOT NULL PRIMARY KEY`;

    return `CREATE TABLE IF NOT EXISTS ${tableName} (${columnsDefinition});`;
  }

  private mapColumnType(type: string): string {
    const typeMap = {
      varbinary: 'VARBINARY(255)',
      varchar: 'VARCHAR(255)',
      uint256: 'BIGINT UNSIGNED',
      int256: 'BIGINT',
      integer: 'INT',
      double: 'DOUBLE',
      boolean: 'BOOLEAN',
      timestamp: 'TIMESTAMP',
      date: 'DATE',
      bigint: 'BIGINT',
    };

    return typeMap[type] || 'TEXT';
  }

  private async findIdl(idlId: number): Promise<IdlDappEntity> {
    const idl = await this.idlRepository.findOne({ where: { id: idlId } });
    if (!idl) {
      throw new NotFoundException(`Idl not found`);
    }
    return idl;
  }

  private async findIndexerWithAccountId(
    indexerId: number,
    accountId: number,
  ): Promise<IndexerEntity> {
    const indexer = await this.indexerRepository.findOne({
      where: { id: indexerId, accountId },
    });
    if (!indexer) {
      throw new NotFoundException(`Indexer not found`);
    }
    return indexer;
  }

  private async findIndexer(indexerId: number): Promise<IndexerEntity> {
    const indexer = await this.indexerRepository.findOne({
      where: { id: indexerId },
    });
    if (!indexer) {
      throw new NotFoundException(`Indexer not found`);
    }
    return indexer;
  }

  private async findTableMetadata(
    indexerId: number,
    tableId: number,
  ): Promise<IndexerTableMetadataEntity> {
    const tableMetadata = await this.tableMetadataRepository.findOne({
      where: { id: tableId, indexerId },
    });
    if (!tableMetadata) {
      throw new NotFoundException(`Table not found`);
    }
    return tableMetadata;
  }
}
