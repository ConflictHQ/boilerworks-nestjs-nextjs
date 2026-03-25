"use client";

import { useQuery, useMutation } from "@apollo/client/react";
import { gql } from "@apollo/client";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { PlusIcon } from "lucide-react";
import Link from "next/link";

const GET_USERS = gql`
  query GetUsers {
    users {
      id
      email
      name
      isActive
      isSuperuser
      isStaff
      createdAt
    }
  }
`;

const DELETE_USER = gql`
  mutation DeleteUser($id: String!) {
    deleteUser(id: $id) {
      ok
      errors { field message }
    }
  }
`;

type User = {
  id: string;
  email: string;
  name: string;
  isActive: boolean;
  isSuperuser: boolean;
  isStaff: boolean;
  createdAt: string;
};

export default function UsersPage() {
  const { data, loading, error, refetch } = useQuery<{ users: User[] }>(GET_USERS, {
    fetchPolicy: "cache-and-network",
  });
  const [deleteUser] = useMutation(DELETE_USER);

  const users = data?.users ?? [];

  const handleDeactivate = async (id: string, name: string) => {
    const { data: result } = await deleteUser({ variables: { id } });
    if (result?.deleteUser?.ok) {
      toast.success(`Deactivated ${name}`);
      refetch();
    } else {
      toast.error("Failed to deactivate user");
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Users</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage user accounts, roles, and permissions.
          </p>
        </div>
        <Link href="/users/invite">
          <Button>
            <PlusIcon className="mr-1 h-4 w-4" /> Invite User
          </Button>
        </Link>
      </div>
      <Separator />

      {loading && !data && <p className="text-muted-foreground text-sm">Loading...</p>}
      {error && <p className="text-sm text-red-500">Error: {error.message}</p>}

      <div className="rounded-lg border">
        <table className="w-full">
          <thead>
            <tr className="border-b text-left text-sm font-medium">
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Role</th>
              <th className="p-3">Status</th>
              <th className="p-3">Joined</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b last:border-0">
                <td className="p-3 font-medium">{user.name}</td>
                <td className="p-3 text-sm">{user.email}</td>
                <td className="p-3">
                  {user.isSuperuser ? (
                    <Badge variant="default">Superuser</Badge>
                  ) : user.isStaff ? (
                    <Badge variant="secondary">Staff</Badge>
                  ) : (
                    <Badge variant="outline">Member</Badge>
                  )}
                </td>
                <td className="p-3">
                  <Badge variant={user.isActive ? "default" : "destructive"}>
                    {user.isActive ? "Active" : "Inactive"}
                  </Badge>
                </td>
                <td className="p-3 text-sm text-muted-foreground">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="p-3">
                  {!user.isSuperuser && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => handleDeactivate(user.id, user.name)}
                    >
                      Deactivate
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && !loading && (
          <p className="p-6 text-center text-sm text-muted-foreground">No users found.</p>
        )}
      </div>
    </div>
  );
}
