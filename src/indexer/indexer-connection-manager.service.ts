import { Injectable, NotFoundException, OnModuleDestroy } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  CREDENTIAL_SECRET_KEY,
  INDEXER_CONNECTION_TTL,
} from 'src/app.environment';
import { decrypt } from 'src/common/utils';
import {
  getIndexerRole,
  IndexerSchemaCredentialEntity,
} from 'src/database/entities/indexer-schema-credential.entity';
import { DataSource, Repository } from 'typeorm';

interface CachedConnection {
  ds: DataSource;
  lastUsed: number;
}

@Injectable()
export class IndexerConnectionManagerService implements OnModuleDestroy {
  private cache = new Map<number, CachedConnection>();
  private ttl = INDEXER_CONNECTION_TTL;

  constructor(
    @InjectRepository(IndexerSchemaCredentialEntity)
    private readonly indexerSchemaCredentialRepository: Repository<IndexerSchemaCredentialEntity>,
  ) {}

  async getConnection(indexerId: number): Promise<DataSource> {
    const now = Date.now();

    if (this.cache.has(indexerId)) {
      const cached = this.cache.get(indexerId);
      cached.lastUsed = now;
      return cached.ds;
    }

    const roleUser = getIndexerRole(indexerId, 'owner');
    const password = await this.getIndexerRolePassword(indexerId);

    const newDS = new DataSource({
      type: 'postgres',
      name: `indexer_${indexerId}`,
      host: process.env.DATABASE_HOST,
      port: Number(process.env.DATABASE_PORT),
      username: roleUser,
      password,
      logging: (process.env.TYPEORM_LOGGING?.split(',') as any[]) ?? false,
    });

    await newDS.initialize();

    // Store in cache
    this.cache.set(indexerId, { ds: newDS, lastUsed: now });

    return newDS;
  }

  cleanup() {
    const now = Date.now();
    for (const [indexerId, cached] of this.cache.entries()) {
      if (now - cached.lastUsed > this.ttl) {
        cached.ds.destroy();
        this.cache.delete(indexerId);
      }
    }
  }

  async getIndexerRolePassword(indexerId: number): Promise<string> {
    const indexerCredential =
      await this.indexerSchemaCredentialRepository.findOne({
        where: { indexerId },
      });

    if (!indexerCredential) {
      throw new NotFoundException('Indexer credential not found');
    }

    return decrypt(indexerCredential.passwordEncrypted, CREDENTIAL_SECRET_KEY);
  }

  async onModuleDestroy() {
    for (const cached of this.cache.values()) {
      await cached.ds.destroy();
    }
  }
}
