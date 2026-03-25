import { Module } from "@nestjs/common";
import { InvoicesService } from "./invoices.service";

@Module({
  providers: [InvoicesService],
  exports: [InvoicesService],
})
export class InvoicesModule {}
