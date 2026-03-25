"use client";

import { useQuery, useMutation } from "@apollo/client/react";
import { gql } from "@apollo/client";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckIcon, CheckCheckIcon } from "lucide-react";

const GET_NOTIFICATIONS = gql`
  query GetNotifications {
    notifications { id subject message isRead createdAt }
    unreadNotificationCount
  }
`;

const MARK_READ = gql`
  mutation MarkRead($id: String!) {
    markNotificationRead(id: $id) { ok }
  }
`;

const MARK_ALL_READ = gql`
  mutation MarkAllRead {
    markAllNotificationsRead { ok }
  }
`;

type Notification = {
  id: string;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

export default function NotificationsPage() {
  const { data, loading, refetch } = useQuery<{
    notifications: Notification[];
    unreadNotificationCount: number;
  }>(GET_NOTIFICATIONS, { fetchPolicy: "cache-and-network" });

  const [markRead] = useMutation(MARK_READ);
  const [markAllRead] = useMutation(MARK_ALL_READ);

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unreadNotificationCount ?? 0;

  const handleMarkRead = async (id: string) => {
    await markRead({ variables: { id } });
    refetch();
  };

  const handleMarkAllRead = async () => {
    await markAllRead();
    toast.success("All notifications marked as read");
    refetch();
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Notifications</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
            <CheckCheckIcon className="mr-1 h-4 w-4" /> Mark all read
          </Button>
        )}
      </div>
      <Separator />

      {loading && !data && <p className="text-muted-foreground text-sm">Loading...</p>}

      <div className="space-y-2">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`flex items-start gap-3 rounded-lg border p-4 ${!n.isRead ? "bg-accent/30" : ""}`}
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className={`text-sm ${!n.isRead ? "font-semibold" : "font-medium"}`}>
                  {n.subject}
                </span>
                {!n.isRead && <Badge variant="default" className="text-[10px]">New</Badge>}
              </div>
              <p className="text-muted-foreground mt-1 text-sm">{n.message}</p>
              <p className="text-muted-foreground mt-1 text-xs">
                {new Date(n.createdAt).toLocaleString()}
              </p>
            </div>
            {!n.isRead && (
              <Button variant="ghost" size="sm" onClick={() => handleMarkRead(n.id)}>
                <CheckIcon className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
        {notifications.length === 0 && !loading && (
          <p className="py-12 text-center text-sm text-muted-foreground">No notifications yet.</p>
        )}
      </div>
    </div>
  );
}
