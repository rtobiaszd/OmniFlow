import { Request, Response } from "express";
import { sendSuccess, sendError } from "../utils/response";

export class AuthController {
  async getAuthUrl(req: Request, res: Response) {
    try {
      const oauthUrl = process.env.OAUTH || "https://example.com/oauth/authorize";
      
      // In a real scenario, we would append client_id, redirect_uri, etc.
      const redirectUri = `${process.env.APP_URL || 'http://localhost:3000'}/auth/callback`;
      
      const params = new URLSearchParams({
        client_id: process.env.OAUTH_CLIENT_ID || "client_id",
        redirect_uri: redirectUri,
        response_type: "code",
        scope: "read,write",
      });

      const fullUrl = `${oauthUrl}?${params.toString()}`;
      
      sendSuccess(res, { url: fullUrl });
    } catch (error) {
      sendError(res, "Failed to generate OAuth URL");
    }
  }
}
