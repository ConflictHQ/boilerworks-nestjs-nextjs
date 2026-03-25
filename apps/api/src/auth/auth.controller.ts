import { Body, Controller, Get, Post, Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { PrismaService } from "../prisma/prisma.service";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  @Post("login")
  async login(
    @Body() body: { email: string; password: string },
    @Res() res: Response,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { email: body.email },
    });

    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (!this.auth.verifyPassword(body.password, user.passwordHash)) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: "Account deactivated" });
    }

    const { token } = await this.auth.createSession(user.id);

    res.cookie("backend_jwt", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: "/",
    });

    return res.json({ ok: true, token });
  }

  @Post("logout")
  async logout(@Req() req: Request, @Res() res: Response) {
    const token =
      req.cookies?.backend_jwt ||
      req.headers.authorization?.replace("Bearer ", "");

    if (token) {
      await this.auth.destroySession(token);
    }

    res.clearCookie("backend_jwt");
    return res.json({ ok: true });
  }

  @Get("me")
  async me(@Req() req: Request, @Res() res: Response) {
    const token =
      req.cookies?.backend_jwt ||
      req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const user = await this.auth.validateSession(token);
    if (!user) {
      return res.status(401).json({ error: "Invalid session" });
    }

    return res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      isSuperuser: user.isSuperuser,
      isStaff: user.isStaff,
    });
  }
}
