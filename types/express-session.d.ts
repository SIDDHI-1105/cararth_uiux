import "express-session";

declare module "express-session" {
  interface SessionData {
    bingOAuthState?: string;
    bingOAuthUserId?: string;
  }
}

export {};
