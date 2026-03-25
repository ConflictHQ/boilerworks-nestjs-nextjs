"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { gql } from "@apollo/client";
import { useRouter } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const GET_GROUPS = gql`
  query GetGroups { groups { id name } }
`;

const INVITE_USER = gql`
  mutation InviteUser($email: String!, $groupIds: [String!]!) {
    inviteUser(email: $email, groupIds: $groupIds) {
      ok
      errors { field message }
    }
  }
`;

export default function InviteUserPage() {
  const router = useRouter();
  const { data: groupsData } = useQuery<{ groups: { id: string; name: string }[] }>(GET_GROUPS, {
    fetchPolicy: "cache-first",
  });
  const [inviteUser] = useMutation(INVITE_USER);

  const [email, setEmail] = useState("");
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const { data } = await inviteUser({
      variables: { email, groupIds: selectedGroups },
    });

    if (data?.inviteUser?.ok) {
      toast.success(`Invitation sent to ${email}`);
      router.push("/users");
    } else {
      const err = data?.inviteUser?.errors?.[0];
      toast.error(err?.message || "Failed to send invitation");
    }
    setSubmitting(false);
  };

  const groups = groupsData?.groups ?? [];

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-xl font-semibold">Invite User</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Send an invitation email with pre-assigned group membership.
        </p>
      </div>
      <Separator />

      <form onSubmit={handleSubmit} className="max-w-md space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
            placeholder="user@example.com"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Groups</label>
          <div className="space-y-2">
            {groups.map((group) => (
              <label key={group.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded"
                  checked={selectedGroups.includes(group.id)}
                  onChange={(e) => {
                    setSelectedGroups((prev) =>
                      e.target.checked
                        ? [...prev, group.id]
                        : prev.filter((id) => id !== group.id),
                    );
                  }}
                />
                <span className="text-sm">{group.name}</span>
              </label>
            ))}
          </div>
        </div>

        <Button type="submit" disabled={submitting || !email || selectedGroups.length === 0}>
          {submitting ? "Sending..." : "Send Invitation"}
        </Button>
      </form>
    </div>
  );
}
