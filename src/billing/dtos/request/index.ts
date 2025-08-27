import { ApiProperty } from '@nestjs/swagger';
import { ExecutionLayer } from 'src/common/enum/common.enum';

export class SyncTransactionBillingDto {
  @ApiProperty()
  txHash: string;

  @ApiProperty({ enum: ExecutionLayer })
  executionLayer: ExecutionLayer;
}
