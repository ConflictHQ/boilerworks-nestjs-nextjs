import { builder } from "./builder";
// Register shared types
import "./types";
// Register domain types + resolvers
import "../users/users.resolver";
import "../permissions/permissions.resolver";
// Register a simple health query to verify GraphQL is working
builder.queryField("healthCheck", (t) => t.string({
    resolve: () => "GraphQL is running",
}));
// Placeholder mutation — required to satisfy GraphQL spec (at least one field)
builder.mutationField("_ping", (t) => t.boolean({
    resolve: () => true,
}));
export const schema = builder.toSchema();
//# sourceMappingURL=schema.js.map