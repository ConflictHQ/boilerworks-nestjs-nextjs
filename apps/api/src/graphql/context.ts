import { PrismaClient, User } from "@prisma/client";
import { AuthService } from "../auth/auth.service";

const prisma = new PrismaClient();
const authService = new AuthService(prisma as any);

export type GraphQLContext = {
  user:
    | (User & {
        groups: Array<{
          group: {
            permissions: Array<{ permission: { slug: string } }>;
          };
        }>;
      })
    | null;
  permissions: Set<string>;
  prisma: PrismaClient;
  req: Request;
};

export async function createContext(req: Request): Promise<GraphQLContext> {
  let token: string | null = null;

  // Try cookie first, then Authorization header
  const cookieHeader = req.headers.get("cookie");
  if (cookieHeader) {
    const match = cookieHeader.match(/backend_jwt=([^;]+)/);
    if (match) token = match[1];
  }

  const authHeader = req.headers.get("authorization");
  if (!token && authHeader) {
    token = authHeader.replace("Bearer ", "");
  }

  let user: GraphQLContext["user"] = null;
  let permissions = new Set<string>();

  if (token) {
    user = await authService.validateSession(token);
    if (user) {
      permissions = authService.getEffectivePermissions(user);
    }
  }

  return { user, permissions, prisma, req };
}
