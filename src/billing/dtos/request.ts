import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';
import { ExecutionLayer } from 'src/common/enum/common.enum';

export class SyncTransactionBillingDto {
  @ApiProperty()
  @IsString()
  txHash: string;

  @ApiProperty({ enum: ExecutionLayer })
  @IsEnum(ExecutionLayer)
  executionLayer: ExecutionLayer;
}
