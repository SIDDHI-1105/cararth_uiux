import { Router, Request, Response } from "express";
import crypto from "crypto";
import { db } from "../../db";
import { aetherBingTokens } from "@shared/schema";
import { eq } from "drizzle-orm";

const router = Router();

const BING_OAUTH_CONFIG = {
  authorizeUrl: "https://www.bing.com/webmasters/OAuth/authorize",
  tokenUrl: "https://www.bing.com/webmasters/oauth/token",
  scope: "webmaster.manage",
  clientId: process.env.BING_CLIENT_ID || "",
  clientSecret: process.env.BING_CLIENT_SECRET || "",
  redirectUri: process.env.BING_REDIRECT_URI || "http://localhost:5000/api/aether/bing/auth/callback",
};

interface BingTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  refresh_token: string;
}

router.get("/start", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    if (!BING_OAUTH_CONFIG.clientId || !BING_OAUTH_CONFIG.clientSecret) {
      return res.status(500).json({ 
        error: "Bing OAuth not configured. Please set BING_CLIENT_ID and BING_CLIENT_SECRET environment variables." 
      });
    }

    const state = crypto.randomBytes(32).toString("hex");
    req.session.bingOAuthState = state;
    req.session.bingOAuthUserId = req.user.id;

    const params = new URLSearchParams({
      response_type: "code",
      client_id: BING_OAUTH_CONFIG.clientId,
      redirect_uri: BING_OAUTH_CONFIG.redirectUri,
      scope: BING_OAUTH_CONFIG.scope,
      state,
    });

    const authUrl = `${BING_OAUTH_CONFIG.authorizeUrl}?${params.toString()}`;
    res.json({ authUrl });
  } catch (error) {
    console.error("Bing OAuth start error:", error);
    res.status(500).json({ error: "Failed to initiate OAuth flow" });
  }
});

router.get("/callback", async (req: Request, res: Response) => {
  try {
    const { code, state, error: oauthError } = req.query;

    if (oauthError) {
      console.error("Bing OAuth error:", oauthError);
      return res.redirect(`/admin/aether?bing_error=${encodeURIComponent(oauthError as string)}`);
    }

    if (!code || typeof code !== "string") {
      return res.redirect("/admin/aether?bing_error=missing_code");
    }

    const sessionState = req.session.bingOAuthState;
    const userId = req.session.bingOAuthUserId;

    if (!sessionState || state !== sessionState) {
      return res.redirect("/admin/aether?bing_error=invalid_state");
    }

    if (!userId) {
      return res.redirect("/admin/aether?bing_error=session_expired");
    }

    delete req.session.bingOAuthState;
    delete req.session.bingOAuthUserId;

    const tokenData = new URLSearchParams({
      code,
      client_id: BING_OAUTH_CONFIG.clientId,
      client_secret: BING_OAUTH_CONFIG.clientSecret,
      redirect_uri: BING_OAUTH_CONFIG.redirectUri,
      grant_type: "authorization_code",
    });

    const tokenResponse = await fetch(BING_OAUTH_CONFIG.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: tokenData.toString(),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Bing token exchange failed:", errorText);
      return res.redirect("/admin/aether?bing_error=token_exchange_failed");
    }

    const tokens: BingTokenResponse = await tokenResponse.json();

    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    const existingTokens = await db
      .select()
      .from(aetherBingTokens)
      .where(eq(aetherBingTokens.userId, userId))
      .limit(1);

    if (existingTokens.length > 0) {
      await db
        .update(aetherBingTokens)
        .set({
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt,
          scopes: [BING_OAUTH_CONFIG.scope],
          updatedAt: new Date(),
        })
        .where(eq(aetherBingTokens.userId, userId));
    } else {
      await db.insert(aetherBingTokens).values({
        userId,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt,
        scopes: [BING_OAUTH_CONFIG.scope],
      });
    }

    res.redirect("/admin/aether?bing_connected=true");
  } catch (error) {
    console.error("Bing OAuth callback error:", error);
    res.redirect("/admin/aether?bing_error=callback_failed");
  }
});

router.post("/disconnect", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    await db
      .delete(aetherBingTokens)
      .where(eq(aetherBingTokens.userId, req.user.id));

    res.json({ success: true });
  } catch (error) {
    console.error("Bing disconnect error:", error);
    res.status(500).json({ error: "Failed to disconnect Bing account" });
  }
});

router.post("/refresh", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const tokens = await db
      .select()
      .from(aetherBingTokens)
      .where(eq(aetherBingTokens.userId, req.user.id))
      .limit(1);

    if (tokens.length === 0) {
      return res.status(404).json({ error: "No Bing tokens found" });
    }

    const token = tokens[0];

    const refreshData = new URLSearchParams({
      client_id: BING_OAUTH_CONFIG.clientId,
      client_secret: BING_OAUTH_CONFIG.clientSecret,
      refresh_token: token.refreshToken,
      grant_type: "refresh_token",
    });

    const refreshResponse = await fetch(BING_OAUTH_CONFIG.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: refreshData.toString(),
    });

    if (!refreshResponse.ok) {
      const errorText = await refreshResponse.text();
      console.error("Bing token refresh failed:", errorText);
      return res.status(500).json({ error: "Token refresh failed" });
    }

    const newTokens: BingTokenResponse = await refreshResponse.json();

    const expiresAt = new Date(Date.now() + newTokens.expires_in * 1000);

    await db
      .update(aetherBingTokens)
      .set({
        accessToken: newTokens.access_token,
        refreshToken: newTokens.refresh_token,
        expiresAt,
        updatedAt: new Date(),
      })
      .where(eq(aetherBingTokens.userId, req.user.id));

    res.json({ success: true, expiresAt });
  } catch (error) {
    console.error("Bing token refresh error:", error);
    res.status(500).json({ error: "Failed to refresh token" });
  }
});

export async function getValidBingToken(userId: string): Promise<string | null> {
  try {
    const tokens = await db
      .select()
      .from(aetherBingTokens)
      .where(eq(aetherBingTokens.userId, userId))
      .limit(1);

    if (tokens.length === 0) {
      return null;
    }

    const token = tokens[0];
    const now = new Date();
    const bufferMinutes = 5;
    const expiryWithBuffer = new Date(token.expiresAt.getTime() - bufferMinutes * 60 * 1000);

    if (now >= expiryWithBuffer) {
      const refreshData = new URLSearchParams({
        client_id: BING_OAUTH_CONFIG.clientId,
        client_secret: BING_OAUTH_CONFIG.clientSecret,
        refresh_token: token.refreshToken,
        grant_type: "refresh_token",
      });

      const refreshResponse = await fetch(BING_OAUTH_CONFIG.tokenUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: refreshData.toString(),
      });

      if (!refreshResponse.ok) {
        console.error("Bing token auto-refresh failed");
        return null;
      }

      const newTokens: BingTokenResponse = await refreshResponse.json();
      const newExpiresAt = new Date(Date.now() + newTokens.expires_in * 1000);

      await db
        .update(aetherBingTokens)
        .set({
          accessToken: newTokens.access_token,
          refreshToken: newTokens.refresh_token,
          expiresAt: newExpiresAt,
          updatedAt: new Date(),
        })
        .where(eq(aetherBingTokens.userId, userId));

      return newTokens.access_token;
    }

    return token.accessToken;
  } catch (error) {
    console.error("Error getting valid Bing token:", error);
    return null;
  }
}

export default router;
