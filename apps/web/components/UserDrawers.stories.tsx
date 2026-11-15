import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { AccountDrawer, NotificationsDrawer } from "./UserDrawers";

const user = {
  id: "ckx1",
  email: "ada@example.com",
  name: "Ada Lovelace",
  isSuperuser: false,
  isStaff: true,
};

/** The drawers the user menu opens. */
const meta = {
  title: "App/Screens/User drawers",
  component: AccountDrawer,
  args: { open: true, onOpenChange: () => {}, ssrUser: user, clientUser: user, loading: false },
} satisfies Meta<typeof AccountDrawer>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Account: Story = {};
export const AccountLoading: Story = { args: { clientUser: null, loading: true } };
export const Notifications: Story = {
  render: () => <NotificationsDrawer open onOpenChange={() => {}} />,
};
