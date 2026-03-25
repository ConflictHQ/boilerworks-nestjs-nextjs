// Manual types for the user domain.
// Once GraphQL Codegen is configured, replace these with imports from __generated__/graphql.ts

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
  isSuperuser: boolean;
  isStaff: boolean;
};

export type UserListItem = {
  id: string;
  email: string;
  name: string;
  isActive: boolean;
  createdAt: string;
};

export type MeQueryData = {
  me: CurrentUser | null;
};

export type MeQueryVariables = Record<string, never>;

export type UsersQueryData = {
  users: UserListItem[];
};
