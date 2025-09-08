import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IndexerService } from './indexer.service';
import {
  CreateIndexerSpaceDto,
  CreateQueryLogDto,
  CreateTableDto,
  DeleteTriggerDto,
  ExecuteQueryDto,
  GetIndexersRequest,
  RegisterIndexerWithTransformDto,
  UpdateTransformerDto,
} from './dtos/request.dto';
import { RequestWithUser } from 'src/common/types/request-with-user';
import { AccessTokenGuard } from 'src/common/guards/auth.guard';
import { UploadIdlFile } from 'src/common/interceptors';
import * as fs from 'fs';
import {
  IndexerResponse,
  IndexerTableMetadataResponse,
  IndexerTriggerAndTransformerResponse,
  QueryLogResponse,
  ResultExecuteQueryResponse,
  TransformerResponse,
} from './dtos/response.dto';
import { IndexerTableService } from './indexer-table.service';
import {
  ApiPaginatedResponse,
  PagingResponse,
} from 'src/common/dtos/common.dto';

@ApiTags('Indexer')
@ApiBearerAuth()
@Controller('indexers')
@UseGuards(AccessTokenGuard)
export class IndexerController {
  constructor(
    private readonly indexerService: IndexerService,
    private readonly indexerTableService: IndexerTableService,
  ) {}

  @Post('/create')
  async createIndexerSpace(
    @Body() input: CreateIndexerSpaceDto,
    @Req() req: RequestWithUser,
  ): Promise<IndexerResponse> {
    const indexer = await this.indexerService.createIndexerSpace(
      input,
      req.user,
    );

    return new IndexerResponse(indexer);
  }

  @ApiPaginatedResponse(IndexerResponse)
  @ApiOperation({ summary: 'Get indexers by accountId' })
  @Get('/owner')
  async getIndexersByAccountId(
    @Req() req: RequestWithUser,
    @Query() params: GetIndexersRequest,
  ): Promise<PagingResponse<IndexerResponse>> {
    const accountId = req.user.id;
    const [indexers, total] = await this.indexerService.getIndexersOwner(
      params,
      accountId,
    );

    return {
      pageData: indexers.map((indexer) => new IndexerResponse(indexer)),
      pageNum: params.pageNum,
      total,
    };
  }

  @ApiPaginatedResponse(IndexerResponse)
  @ApiOperation({ summary: 'Get indexers' })
  @Get('')
  async getAllIndexer(
    @Query() params: GetIndexersRequest,
  ): Promise<PagingResponse<IndexerResponse>> {
    const [indexers, total] = await this.indexerService.getIndexers(params);

    return {
      pageData: indexers.map((indexer) => new IndexerResponse(indexer)),
      pageNum: params.pageNum,
      total,
    };
  }

  @ApiOperation({ summary: 'Get indexer by id' })
  @Get(':indexerId')
  async getIndexer(
    @Param('indexerId') indexerId: string,
  ): Promise<IndexerResponse> {
    const indexer = await this.indexerService.getIndexerById(
      parseInt(indexerId),
    );
    return new IndexerResponse(indexer);
  }

  @ApiOperation({ summary: 'Get all Trigger and Transformer of Table' })
  @Get(':indexerId/tables/:tableId/trigger-transformer')
  async getAllIndexerTriggerAndTransformOfTable(
    @Param('indexerId') indexerId: string,
    @Param('tableId') tableId: string,
    @Req() req: RequestWithUser,
  ): Promise<IndexerTriggerAndTransformerResponse[]> {
    return (
      await this.indexerService.getAllIndexerTriggerAndTransformOfTable({
        indexerId: parseInt(indexerId),
        tableId: parseInt(tableId),
        accountId: req.user.id,
      })
    ).map((c) => new IndexerTriggerAndTransformerResponse(c));
  }

  @Post(':indexerId/tables/create')
  async createTable(
    @Body() input: CreateTableDto,
    @Param('indexerId') indexerId: string,
    @Req() req: RequestWithUser,
  ): Promise<void> {
    input.indexerId = parseInt(indexerId);

    return await this.indexerService.createTable(input, req.user);
  }

  @Delete(':indexerId/tables/:tableName')
  async deleteTable(
    @Param('indexerId') indexerId: string,
    @Param('tableName') tableName: string,
    @Req() req: RequestWithUser,
  ): Promise<void> {
    return await this.indexerService.deleteTable({
      accountId: req.user.id,
      indexerId: parseInt(indexerId),
      tableName,
    });
  }

  @Get(':indexerId/tables')
  async getAllTablesInIndexer(
    @Param('indexerId') indexerIdStr: string,
  ): Promise<IndexerTableMetadataResponse[]> {
    const indexerId = parseInt(indexerIdStr);

    const tables = await this.indexerService.getAllTablesInIndexer(indexerId);
    return tables.map((table) => new IndexerTableMetadataResponse(table));
  }

  @ApiOperation({
    summary: 'Register PDA of Program to transform data to index',
  })
  @Post(':indexerId/register')
  @UploadIdlFile('transformer')
  async registerIndexerWithTransform(
    @Body() input: RegisterIndexerWithTransformDto,
    @UploadedFile() file: Express.Multer.File,
    @Param('indexerId') indexerId: string,
    @Req() req: RequestWithUser,
  ): Promise<void> {
    if (!file) {
      throw new BadRequestException('Missing file transform');
    }

    const fileContent = fs.readFileSync(file.path, 'utf-8');
    input.accountId = req.user.id;
    input.indexerId = parseInt(indexerId);

    await this.indexerService.registerIndexerWithTransform(input, fileContent);
  }

  @ApiOperation({
    summary: 'Execute query on indexer table',
  })
  @Post('/query')
  async executeQuery(
    @Body() input: ExecuteQueryDto,
    @Req() req: RequestWithUser,
  ): Promise<ResultExecuteQueryResponse> {
    return await this.indexerTableService.executeQuery(input, req.user);
  }

  @ApiOperation({
    summary: 'Delete trigger of indexer',
  })
  @Delete(':indexerId/triggers')
  async deleteTrigger(
    @Param('indexerId') indexerId: string,
    @Body() input: DeleteTriggerDto,
    @Req() req: RequestWithUser,
  ): Promise<void> {
    input.accountId = req.user.id;
    input.indexerId = parseInt(indexerId);

    return await this.indexerService.deleteTrigger(input);
  }

  @ApiOperation({
    summary: 'Update transformer of indexer',
  })
  @Patch(':indexerId/transformers')
  async updateTransformer(
    @Body() input: UpdateTransformerDto,
    @Req() req: RequestWithUser,
  ): Promise<void> {
    input.accountId = req.user.id;

    return await this.indexerService.updateTransformer(input);
  }

  @ApiOperation({
    summary: 'Get all transformer of indexer',
  })
  @Get(':indexerId/transformers')
  async getAllTransformerOfIndexer(
    @Param('indexerId') indexerId: string,
    @Req() req: RequestWithUser,
  ): Promise<TransformerResponse[]> {
    return (
      await this.indexerService.getAllTransformersOfIndexer(
        parseInt(indexerId),
        req.user.id,
      )
    ).map((transformer) => new TransformerResponse(transformer));
  }

  @ApiOperation({
    summary: 'Get all query logs of indexer',
  })
  @Get(':indexerId/query')
  async getAllQueryLogsInIndexer(
    @Param('indexerId') indexerId: string,
  ): Promise<QueryLogResponse[]> {
    return (
      await this.indexerService.getAllQueryLogsInIndexer(parseInt(indexerId))
    ).map((queryLog) => {
      return new QueryLogResponse(queryLog);
    });
  }

  @Post(':indexerId/query')
  async createQueryLogs(
    @Param('indexerId') indexerId: string,
    @Body() input: CreateQueryLogDto,
    @Req() req: RequestWithUser,
  ): Promise<void> {
    input.accountId = req.user.id;
    input.indexerId = parseInt(indexerId);

    return await this.indexerService.createQueryLogs(input);
  }
}
