import { Injectable, OnModuleInit } from "@nestjs/common";
import { Client } from "@opensearch-project/opensearch";

const INDEX_PREFIX = "boilerworks";

@Injectable()
export class SearchService implements OnModuleInit {
  private client: Client;

  constructor() {
    this.client = new Client({
      node: process.env.OPENSEARCH_URL || "http://localhost:9200",
      ssl: { rejectUnauthorized: false },
    });
  }

  async onModuleInit() {
    try {
      const { body } = await this.client.cluster.health();
      console.log(`[Search] OpenSearch cluster: ${body.status}`);
    } catch {
      console.warn("[Search] OpenSearch not available — search disabled");
    }
  }

  private indexName(model: string): string {
    return `${INDEX_PREFIX}_${model.toLowerCase()}`;
  }

  async ensureIndex(model: string, mappings: Record<string, unknown>) {
    const index = this.indexName(model);
    const { body: exists } = await this.client.indices.exists({ index });
    if (!exists) {
      await this.client.indices.create({
        index,
        body: { mappings: { properties: mappings } } as any,
      });
      console.log(`[Search] Created index: ${index}`);
    }
  }

  async index(model: string, id: string, document: Record<string, unknown>) {
    await this.client.index({
      index: this.indexName(model),
      id,
      body: document,
      refresh: true,
    });
  }

  async delete(model: string, id: string) {
    try {
      await this.client.delete({
        index: this.indexName(model),
        id,
        refresh: true,
      });
    } catch {
      // Document may not exist in index
    }
  }

  async search(
    model: string,
    query: string,
    options?: {
      from?: number;
      size?: number;
      filters?: Record<string, unknown>;
    },
  ): Promise<{
    hits: Array<{ id: string; score: number; source: Record<string, unknown> }>;
    total: number;
  }> {
    const { from = 0, size = 20, filters } = options ?? {};

    const must: unknown[] = [
      {
        multi_match: {
          query,
          fields: ["*"],
          type: "best_fields",
          fuzziness: "AUTO",
        },
      },
    ];

    if (filters) {
      for (const [field, value] of Object.entries(filters)) {
        must.push({ term: { [field]: value } });
      }
    }

    const { body } = await this.client.search({
      index: this.indexName(model),
      body: {
        from,
        size,
        query: { bool: { must } },
      } as any,
    });

    return {
      total:
        typeof body.hits.total === "number"
          ? body.hits.total
          : ((body.hits.total as any)?.value ?? 0),
      hits: body.hits.hits.map((hit: any) => ({
        id: hit._id,
        score: hit._score,
        source: hit._source,
      })),
    };
  }

  async reindex(
    model: string,
    documents: Array<{ id: string; data: Record<string, unknown> }>,
  ) {
    const index = this.indexName(model);

    // Delete and recreate
    try {
      await this.client.indices.delete({ index });
    } catch {
      // Index may not exist
    }

    if (documents.length === 0) return;

    // Bulk index
    const bulkBody = documents.flatMap((doc) => [
      { index: { _index: index, _id: doc.id } },
      doc.data,
    ]);

    await this.client.bulk({ body: bulkBody, refresh: true });
    console.log(
      `[Search] Reindexed ${documents.length} documents into ${index}`,
    );
  }
}
