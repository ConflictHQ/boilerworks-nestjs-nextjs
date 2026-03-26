import { Body, Controller, Get, Post, Query, Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";
import { randomBytes } from "crypto";
import { AuthService } from "./auth.service";
import { PrismaService } from "../prisma/prisma.service";

const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN || "your-tenant.us.auth0.com";
const AUTH0_CLIENT_ID = process.env.AUTH0_CLIENT_ID || "";
const AUTH0_CLIENT_SECRET = process.env.AUTH0_CLIENT_SECRET || "";
const AUTH0_SCOPES = process.env.AUTH0_CLIENT_SCOPES || "openid profile email";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  // --- Auth0 OAuth2 flow ---

  @Get("login")
  async loginRedirect(@Query("next") next: string, @Res() res: Response) {
    if (!AUTH0_CLIENT_ID) {
      // Auth0 not configured — show message
      return res.status(503).json({
        error:
          "Auth0 not configured. Set AUTH0_CLIENT_ID and AUTH0_CLIENT_SECRET env vars.",
      });
    }

    const state = randomBytes(16).toString("hex");
    const callbackUrl = `${process.env.CORS_ORIGINS?.split(",")[0] || "http://localhost:3000"}/auth/callback`;

    // Store the "next" URL and state in a short-lived cookie
    res.cookie(
      "auth_state",
      JSON.stringify({ state, next: next || "/dashboard" }),
      {
        httpOnly: true,
        maxAge: 5 * 60 * 1000, // 5 minutes
        sameSite: "lax",
        path: "/",
      },
    );

    const auth0Url = new URL(`https://${AUTH0_DOMAIN}/authorize`);
    auth0Url.searchParams.set("response_type", "code");
    auth0Url.searchParams.set("client_id", AUTH0_CLIENT_ID);
    auth0Url.searchParams.set("redirect_uri", callbackUrl);
    auth0Url.searchParams.set("scope", AUTH0_SCOPES);
    auth0Url.searchParams.set("state", state);

    return res.redirect(auth0Url.toString());
  }

  @Get("callback")
  async auth0Callback(
    @Query("code") code: string,
    @Query("state") state: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    if (!code) {
      return res.status(400).json({ error: "Missing authorization code" });
    }

    // Validate state to prevent CSRF
    try {
      const authState = JSON.parse(req.cookies?.auth_state || "{}");
      if (!state || !authState.state || state !== authState.state) {
        return res
          .status(403)
          .json({ error: "Invalid state parameter — possible CSRF attack" });
      }
    } catch {
      return res.status(403).json({ error: "Invalid auth state" });
    }

    const callbackUrl = `${process.env.CORS_ORIGINS?.split(",")[0] || "http://localhost:3000"}/auth/callback`;

    // Exchange code for tokens
    const tokenResponse = await fetch(`https://${AUTH0_DOMAIN}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "authorization_code",
        client_id: AUTH0_CLIENT_ID,
        client_secret: AUTH0_CLIENT_SECRET,
        code,
        redirect_uri: callbackUrl,
      }),
    });

    if (!tokenResponse.ok) {
      const err = await tokenResponse.text();
      return res
        .status(401)
        .json({ error: "Auth0 token exchange failed", details: err });
    }

    const tokens = await tokenResponse.json();

    // Get user info from Auth0
    const userInfoResponse = await fetch(`https://${AUTH0_DOMAIN}/userinfo`, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userInfoResponse.ok) {
      return res.status(401).json({ error: "Failed to fetch user info" });
    }

    const userInfo = await userInfoResponse.json();

    // Find or create user
    let user = await this.prisma.user.findUnique({
      where: { email: userInfo.email },
    });

    if (!user) {
      // Auto-assign new users to the Viewer group by default
      const defaultGroup = await this.prisma.group.findUnique({
        where: { name: "Viewer" },
      });

      user = await this.prisma.user.create({
        data: {
          email: userInfo.email,
          name: userInfo.name || userInfo.nickname || userInfo.email,
          ...(defaultGroup
            ? { groups: { create: { groupId: defaultGroup.id } } }
            : {}),
        },
      });
    }

    // Create session
    const { token } = await this.auth.createSession(user.id);

    // Parse the original "next" URL from auth_state cookie
    let nextUrl = "/dashboard";
    try {
      const authState = JSON.parse(req.cookies?.auth_state || "{}");
      if (authState.next) nextUrl = authState.next;
    } catch {
      // ignore
    }

    // Clear auth_state cookie
    res.clearCookie("auth_state");

    // Return token for the frontend to store
    return res.json({ ok: true, token, next: nextUrl });
  }

  // --- Password-based login (fallback / dev) ---

  @Post("login")
  async passwordLogin(
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
      maxAge: 30 * 24 * 60 * 60 * 1000,
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

    // If Auth0 is configured, redirect to Auth0 logout
    if (AUTH0_CLIENT_ID) {
      const returnTo =
        process.env.CORS_ORIGINS?.split(",")[0] || "http://localhost:3000";
      return res.json({
        ok: true,
        logoutUrl: `https://${AUTH0_DOMAIN}/v2/logout?client_id=${AUTH0_CLIENT_ID}&returnTo=${encodeURIComponent(returnTo + "/auth/login")}`,
      });
    }

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
