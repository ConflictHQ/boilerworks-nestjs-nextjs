import { printSchema } from "graphql";
import { writeFileSync } from "fs";
import { schema } from "../src/graphql/schema";

const sdl = printSchema(schema);
writeFileSync("schema.graphql", sdl);
console.log("Schema exported to apps/api/schema.graphql");
console.log(`${sdl.split("\n").length} lines`);
