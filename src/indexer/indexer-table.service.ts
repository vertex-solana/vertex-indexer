import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { DataSource } from 'typeorm';
import { ResultExecuteQueryResponse } from './dtos/response.dto';
import { ExecuteQueryDto } from './dtos/request.dto';
import { getIndexerRole } from 'src/database/entities/indexer-schema-credential.entity';

@Injectable()
export class IndexerTableService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(IndexerTableService.name);
  }

  async executeQuery({
    indexerId,
    query,
  }: ExecuteQueryDto): Promise<ResultExecuteQueryResponse> {
    const readRole = getIndexerRole(indexerId, 'reader');
    await this.dataSource.query(`SET ROLE ${readRole}`);

    try {
      const result = await this.dataSource.query(query);
      const schema =
        result.length === 0
          ? {}
          : Object.keys(result[0]).reduce((acc, key) => {
              acc[key] = typeof result[0][key];
              return acc;
            }, {});
      const rows =
        result.length === 0
          ? []
          : result.map((row) => {
              const newRow = {};
              Object.keys(row).forEach((key) => {
                newRow[key] = row[key];
              });
              return newRow;
            });

      return {
        query,
        schema,
        rows,
      };
    } finally {
      await this.dataSource.query(`RESET ROLE`);
    }
  }
}
