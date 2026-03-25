import { PrismaClient } from "@prisma/client";
import { AuthService } from "../auth/auth.service";
const prisma = new PrismaClient();
const authService = new AuthService(prisma);
export async function createContext(req) {
    let token = null;
    // Try cookie first, then Authorization header
    const cookieHeader = req.headers.get("cookie");
    if (cookieHeader) {
        const match = cookieHeader.match(/backend_jwt=([^;]+)/);
        if (match)
            token = match[1];
    }
    const authHeader = req.headers.get("authorization");
    if (!token && authHeader) {
        token = authHeader.replace("Bearer ", "");
    }
    let user = null;
    let permissions = new Set();
    if (token) {
        user = await authService.validateSession(token);
        if (user) {
            permissions = authService.getEffectivePermissions(user);
        }
    }
    return { user, permissions, prisma, req };
}
//# sourceMappingURL=context.js.map