import { builder } from "../graphql/builder";

builder.prismaObject("Upload", {
  fields: (t) => ({
    id: t.exposeID("id"),
    filename: t.exposeString("filename"),
    contentType: t.exposeString("contentType"),
    size: t.exposeInt("size"),
    s3Key: t.exposeString("s3Key"),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
  }),
});
