"use client";

import { useQuery } from "@apollo/client/react";
import { gql } from "@apollo/client";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

const GET_ORGANIZATIONS = gql`
  query GetOrganizations {
    organizations {
      id
      name
      slug
      memberCount
      createdAt
      members {
        id
        role
        user {
          id
          name
          email
        }
      }
    }
  }
`;

type OrgMember = {
  id: string;
  role: string;
  user: { id: string; name: string; email: string };
};

type Organization = {
  id: string;
  name: string;
  slug: string;
  memberCount: number;
  createdAt: string;
  members: OrgMember[];
};

export default function OrganizationPage() {
  const { data, loading, error } = useQuery<{ organizations: Organization[] }>(GET_ORGANIZATIONS, {
    fetchPolicy: "cache-and-network",
  });

  const orgs = data?.organizations ?? [];

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-xl font-semibold">Organizations</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Manage organizations and team membership.
        </p>
      </div>
      <Separator />

      {loading && !data && <p className="text-muted-foreground text-sm">Loading...</p>}
      {error && <p className="text-sm text-red-500">Error: {error.message}</p>}

      {orgs.map((org) => (
        <div key={org.id} className="rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold">{org.name}</h2>
              <p className="text-muted-foreground text-sm">{org.slug}</p>
            </div>
            <Badge variant="outline">{org.memberCount} members</Badge>
          </div>
          <Separator className="my-3" />
          <div className="space-y-2">
            {org.members.map((m) => (
              <div key={m.id} className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium">{m.user.name}</span>
                  <span className="text-muted-foreground ml-2">{m.user.email}</span>
                </div>
                <Badge variant="secondary">{m.role}</Badge>
              </div>
            ))}
          </div>
        </div>
      ))}

      {orgs.length === 0 && !loading && (
        <p className="text-muted-foreground py-12 text-center text-sm">
          No organizations yet. Create one to get started.
        </p>
      )}
    </div>
  );
}
