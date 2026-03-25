import { All, Controller, Req, Res } from "@nestjs/common";
import { createYoga } from "graphql-yoga";
import { schema } from "./schema";
import type { Request, Response } from "express";

const yoga = createYoga({
  schema,
  graphqlEndpoint: "/graphql",
  landingPage: true,
});

@Controller("graphql")
export class GraphqlController {
  @All()
  async handler(@Req() req: Request, @Res() res: Response) {
    // Build a Web Request from the Node request
    const url = new URL(req.url || "/", `http://${req.headers.host}`);
    const webReq = new Request(url.toString(), {
      method: req.method,
      headers: req.headers as Record<string, string>,
      body:
        req.method !== "GET" && req.method !== "HEAD"
          ? JSON.stringify(req.body)
          : undefined,
    });

    const webRes = await yoga.fetch(webReq);
    res.status(webRes.status);
    webRes.headers.forEach((value: string, key: string) => {
      res.setHeader(key, value);
    });
    res.send(await webRes.text());
  }
}
