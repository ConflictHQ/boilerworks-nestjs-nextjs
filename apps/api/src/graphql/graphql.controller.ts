import { All, Controller, Req, Res } from "@nestjs/common";
import { createYoga, YogaServerInstance } from "graphql-yoga";
import { NoSchemaIntrospectionCustomRule } from "graphql";
import { schema } from "./schema";
import { createContextFactory } from "./context";
import { depthLimitRule } from "./depth-limit";
import { PrismaService } from "../prisma/prisma.service";
import { AuthService } from "../auth/auth.service";
import type { Request, Response } from "express";

const isProduction = process.env.NODE_ENV === "production";

@Controller("graphql")
export class GraphqlController {
  private yoga: YogaServerInstance<
    Record<string, unknown>,
    Record<string, unknown>
  >;

  constructor(prisma: PrismaService, authService: AuthService) {
    const createContext = createContextFactory(prisma, authService);
    this.yoga = createYoga({
      schema,
      graphqlEndpoint: "/graphql",
      landingPage: !isProduction,
      graphiql: !isProduction,
      maskedErrors: isProduction,
      plugins: [
        {
          onValidate({
            addValidationRule,
          }: {
            addValidationRule: (rule: unknown) => void;
          }) {
            addValidationRule(depthLimitRule(10));
            if (isProduction) {
              addValidationRule(NoSchemaIntrospectionCustomRule);
            }
          },
        },
      ],
      context: ({ request }) => createContext(request),
    });
  }

  @All()
  async handler(@Req() req: Request, @Res() res: Response) {
    const url = new URL(req.url || "/", `http://${req.headers.host}`);
    const webReq = new globalThis.Request(url.toString(), {
      method: req.method,
      headers: req.headers as Record<string, string>,
      body:
        req.method !== "GET" && req.method !== "HEAD"
          ? JSON.stringify(req.body)
          : undefined,
    });

    const webRes = await this.yoga.fetch(webReq);
    res.status(webRes.status);
    webRes.headers.forEach((value: string, key: string) => {
      res.setHeader(key, value);
    });
    res.send(await webRes.text());
  }
}
