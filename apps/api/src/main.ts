import { NestFactory } from "@nestjs/core";
import * as cookieParser from "cookie-parser";
import helmet from "helmet";
import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";
import { LoggingInterceptor } from "./common/interceptors/logging.interceptor";
import { TimeoutInterceptor } from "./common/interceptors/timeout.interceptor";
import { setupBullBoard } from "./jobs/bull-board";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security
  app.use(cookieParser());
  app.use(
    helmet({
      contentSecurityPolicy:
        process.env.NODE_ENV === "production" ? undefined : false,
      crossOriginEmbedderPolicy: false,
    }),
  );
  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(",") ?? ["http://localhost:3000"],
    credentials: true,
  });

  // Global filters + interceptors
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new LoggingInterceptor(), new TimeoutInterceptor());

  // Bull Board — job monitoring UI at /admin/queues
  setupBullBoard(app);

  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  console.log(`API running on http://localhost:${port}`);
  console.log(`GraphQL at http://localhost:${port}/graphql`);
  console.log(`Bull Board at http://localhost:${port}/admin/queues`);
}

bootstrap();
