"use client";

import { Separator } from "@/components/ui/separator";

export default function PlaygroundPage() {
  const apiRoot = process.env.NEXT_PUBLIC_API_ROOT ?? "http://localhost:4000";

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-xl font-semibold">API Playground</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Explore the GraphQL API with an interactive playground.
        </p>
      </div>
      <Separator />

      <div className="rounded-lg border overflow-hidden" style={{ height: "calc(100vh - 220px)" }}>
        <iframe
          src={`${apiRoot}/graphql`}
          className="w-full h-full border-0"
          title="GraphQL Playground"
        />
      </div>

      <div className="text-muted-foreground text-xs">
        <p>GraphQL endpoint: <code className="font-mono">{apiRoot}/graphql</code></p>
        <p>The playground uses your current session for authentication.</p>
      </div>
    </div>
  );
}
