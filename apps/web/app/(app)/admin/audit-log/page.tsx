"use client";

import { useQuery } from "@apollo/client/react";
import { gql } from "@apollo/client";
import { Separator } from "@/components/ui/separator";

const GET_AUDIT_LOGS = gql`
  query GetAuditLogs($limit: Int) {
    auditLogs(limit: $limit) {
      id
      action
      targetType
      targetId
      payload
      ip
      timestamp
      user { id name email }
    }
  }
`;

type AuditLog = {
  id: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  payload: unknown;
  ip: string | null;
  timestamp: string;
  user: { id: string; name: string; email: string } | null;
};

export default function AuditLogPage() {
  const { data, loading, error } = useQuery<{ auditLogs: AuditLog[] }>(GET_AUDIT_LOGS, {
    variables: { limit: 100 },
    fetchPolicy: "cache-and-network",
  });

  const logs = data?.auditLogs ?? [];

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-xl font-semibold">Audit Log</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          View all system actions and mutations.
        </p>
      </div>
      <Separator />

      {loading && !data && <p className="text-muted-foreground text-sm">Loading...</p>}
      {error && <p className="text-sm text-red-500">Error: {error.message}</p>}

      <div className="rounded-lg border">
        <table className="w-full">
          <thead>
            <tr className="border-b text-left text-sm font-medium">
              <th className="p-3">Timestamp</th>
              <th className="p-3">User</th>
              <th className="p-3">Action</th>
              <th className="p-3">Target</th>
              <th className="p-3">IP</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b last:border-0 text-sm">
                <td className="p-3 text-muted-foreground">
                  {new Date(log.timestamp).toLocaleString()}
                </td>
                <td className="p-3">{log.user?.name ?? "System"}</td>
                <td className="p-3 font-mono text-xs">{log.action}</td>
                <td className="p-3 font-mono text-xs">
                  {log.targetType && `${log.targetType}:${log.targetId}`}
                </td>
                <td className="p-3 text-muted-foreground">{log.ip ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs.length === 0 && !loading && (
          <p className="p-6 text-center text-sm text-muted-foreground">No audit logs yet.</p>
        )}
      </div>
    </div>
  );
}
