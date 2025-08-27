import { Body, Controller, Post } from '@nestjs/common';
import { BillingService } from './billing.service';
import { SyncTransactionBillingDto } from './dtos/request';
import { ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Billing')
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post('sync-transaction')
  async syncTransaction(
    @Body() payload: SyncTransactionBillingDto,
  ): Promise<void> {
    await this.billingService.syncTransaction(payload);
  }
}
