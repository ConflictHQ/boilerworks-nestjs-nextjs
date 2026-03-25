import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { GraphqlModule } from "./graphql/graphql.module";
import { AuthModule } from "./auth/auth.module";
import { HealthController } from "./health.controller";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    GraphqlModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
