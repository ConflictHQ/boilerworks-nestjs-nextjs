import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { softDeleteExtension } from "./extensions/soft-delete";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({
      log:
        process.env.NODE_ENV === "development"
          ? ["warn", "error"]
          : ["warn", "error"],
    });

    // Apply the soft-delete extension and return a proxy that delegates
    // model access to the extended client while keeping PrismaService typing.
    const extended = this.$extends(softDeleteExtension);
    return new Proxy(this, {
      get(target, prop, receiver) {
        // Lifecycle methods stay on the original PrismaService instance
        if (prop === "onModuleInit" || prop === "onModuleDestroy") {
          return Reflect.get(target, prop, receiver);
        }
        // Everything else (model accessors, $queryRaw, etc.) goes to extended
        if (prop in extended) {
          return (extended as any)[prop];
        }
        return Reflect.get(target, prop, receiver);
      },
    }) as this;
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
