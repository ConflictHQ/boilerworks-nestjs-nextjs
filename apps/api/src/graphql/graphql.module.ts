import { Module } from "@nestjs/common";
import { GraphqlController } from "./graphql.controller";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule],
  controllers: [GraphqlController],
})
export class GraphqlModule {}
