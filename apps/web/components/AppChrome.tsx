"use client";

import { localizeNav } from "@calliopelabs/ui";
import { BadgeCheckIcon, BellIcon, Settings2Icon } from "lucide-react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { AccountDrawer, NotificationsDrawer } from "@/components/UserDrawers";
import { useMe } from "@/graphql/user/user.hooks";
import type { CurrentUser } from "@/graphql/user/user.types";
import { clearToken } from "@/lib/auth/token-store";
import { routeLabels } from "@/lib/routes";
import { setSentryUser } from "@/lib/sentry";
import { AppFrame } from "@/ui-app/shell/AppFrame";
import { NAV } from "@/ui-app/product";

/**
 * The signed-in chrome, connected: the current person (SSR first, then
 * useMe), the translated navigation, sign-out, and the account and
 * notifications drawers. The frame itself is ui-app/shell/AppFrame.
 */
export function AppChrome({
  ssrUser,
  children,
}: {
  ssrUser: CurrentUser | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? "/";
  const t = useTranslations("nav");
  const tUser = useTranslations("user");
  const { user, loading } = useMe();
  const [accountOpen, setAccountOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  useEffect(() => {
    setSentryUser(user ?? null);
  }, [user]);

  const nav = useMemo(
    () => localizeNav(NAV, (_kind, key, fallback) => (t.has(key) ? t(key) : fallback)),
    [t]
  );

  const signOut = async () => {
    setSentryUser(null);
    clearToken();
    const apiRoot = process.env.NEXT_PUBLIC_API_ROOT ?? "http://localhost:4000";
    try {
      await fetch(`${apiRoot}/auth/logout`, { method: "POST", credentials: "include" });
    } catch {
      // Best effort
    }
    window.location.href = "/auth/login";
  };

  const me = user ?? ssrUser;

  return (
    <>
      <AppFrame
        nav={nav}
        pathname={pathname}
        user={{ name: me?.name ?? "User", email: me?.email ?? "" }}
        menu={[
          [
            { label: tUser("account"), icon: BadgeCheckIcon, onSelect: () => setAccountOpen(true) },
            {
              label: tUser("notifications"),
              icon: BellIcon,
              onSelect: () => setNotificationsOpen(true),
            },
          ],
          [{ label: t("settings"), icon: Settings2Icon, href: "/settings" }],
        ]}
        onSignOut={() => void signOut()}
        pageLabel={(segment) => routeLabels[segment] ?? segment}
      >
        {children}
      </AppFrame>
      <AccountDrawer
        open={accountOpen}
        onOpenChange={setAccountOpen}
        ssrUser={ssrUser}
        clientUser={user ?? null}
        loading={loading}
      />
      <NotificationsDrawer open={notificationsOpen} onOpenChange={setNotificationsOpen} />
    </>
  );
}
