"use client";

import { PageHeader } from "@calliopelabs/ui";
import { Separator } from "@/ui-app/primitives/separator";

export default function PlaygroundPage() {
  const apiRoot = process.env.NEXT_PUBLIC_API_ROOT ?? "http://localhost:4000";

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <PageHeader
        title="API Playground"
        description="Explore the GraphQL API with an interactive playground."
      />
      <Separator />

      <div className="overflow-hidden rounded-lg border" style={{ height: "calc(100vh - 220px)" }}>
        <iframe
          src={`${apiRoot}/graphql`}
          className="h-full w-full border-0"
          title="GraphQL Playground"
        />
      </div>

      <div className="text-muted-foreground text-xs">
        <p>
          GraphQL endpoint: <code className="font-mono">{apiRoot}/graphql</code>
        </p>
        <p>The playground uses your current session for authentication.</p>
      </div>
    </div>
  );
}
