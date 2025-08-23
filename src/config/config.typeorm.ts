import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as dotenv from 'dotenv';
import { PinoLogger } from 'nestjs-pino';
import {
  AbstractLogger,
  DataSource,
  DataSourceOptions,
  LoggerOptions,
  LogLevel,
  LogMessage,
} from 'typeorm';
import {
  addTransactionalDataSource,
  deleteDataSourceByName,
} from 'typeorm-transactional';

dotenv.config({ path: '.env' });

export class PinoTypeOrmLogger extends AbstractLogger {
  constructor(
    private readonly logger: PinoLogger,
    options?: LoggerOptions,
  ) {
    super(options);
    logger.setContext(PinoTypeOrmLogger.name);
  }

  /**
   * Write log to specific output.
   */
  protected writeLog(level: LogLevel, logMessage: LogMessage | LogMessage[]) {
    const messages = this.prepareLogMessages(logMessage, {
      highlightSql: false,
      appendParameterAsComment: process.env.TYPEORM_LOGGING_SHOW_PARAMETERS
        ? JSON.parse(process.env.TYPEORM_LOGGING_SHOW_PARAMETERS)
        : false,
    });

    for (const message of messages) {
      switch (message.type ?? level) {
        case 'log':
        case 'schema-build':
        case 'migration':
          this.logger.info(message.message);
          break;

        case 'info':
        case 'query':
          if (message.prefix) {
            this.logger.info(`${message.prefix} ${message.message}`);
          } else {
            this.logger.info(message.message);
          }
          break;

        case 'warn':
        case 'query-slow':
          if (message.prefix) {
            this.logger.warn(`${message.prefix} ${message.message}`);
          } else {
            this.logger.warn(message.message);
          }
          break;

        case 'error':
        case 'query-error':
          if (message.prefix) {
            this.logger.error(`${message.prefix} ${message.message}`);
          } else {
            this.logger.error(message.message);
          }
          break;
      }
    }
  }
}

export const dataSourceOptions: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: Number(process.env.DATABASE_PORT),
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  autoLoadEntities: true,
  synchronize: process.env.TYPEORM_SYNCHRONIZE
    ? JSON.parse(process.env.TYPEORM_SYNCHRONIZE)
    : false,
  logging: (process.env.TYPEORM_LOGGING?.split(',') as any[]) ?? false,
  entities: [`${__dirname}/../../dist/database/entities/*.entity.{ts,js}`],
  migrations: [`${__dirname}/../../dist/database/migrations/*.{ts,js}`],
  // ssl: {
  //   rejectUnauthorized: false,
  // },
};

export const dbOrmModuleAsync = TypeOrmModule.forRootAsync({
  useFactory: (logger: PinoLogger) => {
    return {
      ...dataSourceOptions,
      logger: new PinoTypeOrmLogger(logger, dataSourceOptions.logging),
    };
  },
  dataSourceFactory: async (options) => {
    deleteDataSourceByName('default');
    return addTransactionalDataSource(new DataSource(options));
  },
  inject: [PinoLogger],
});

export const dataSource = new DataSource(
  dataSourceOptions as DataSourceOptions,
);
