/** This module contains all the endpoints related to oauth handling */
import { Router } from "express";
import { Issuer, generators } from "openid-client";
import assert from "assert";

declare module "openid-client" {
  interface TokenSet {
    user: {
      id: number;
    };
  }
}

declare module "express-session" {
  interface SessionData {
    tmpState: string;
    tmpCourseId: string;
    accessToken: string;
    refreshToken: string;
    userId: number;
  }
}

// Assuming that this router is going to be in
// https://localdev.kth.se:4443/transfer-to-ladok/auth
const oauthRedirectUrl = new URL(
  "/transfer-to-ladok/auth/callback",
  `https://${process.env.PROXY_HOST}`
).toString();

const issuer = new Issuer({
  issuer: "se.kth",
  authorization_endpoint: new URL(
    "/login/oauth2/auth",
    process.env.CANVAS_API_URL
  ).toString(),
  token_endpoint: new URL(
    "/login/oauth2/token",
    process.env.CANVAS_API_URL
  ).toString(),
});

const client = new issuer.Client({
  client_id: process.env.CANVAS_DEVELOPER_KEY_ID || "",
  client_secret: process.env.CANVAS_DEVELOPER_KEY_SECRET || "",
  redirect_uris: [oauthRedirectUrl],
});

// Two routes:
// - "/" -> Initiates the oauth process. Redirects the user to Canvas
// - "/callback" -> Finishes the oauth process. Exchanges oauth code to token
const router = Router();

router.get("/", (req, res) => {
  const courseId = req.query.courseId;

  // TODO: error handling
  assert(typeof courseId === "string", "!!!");

  const state = generators.state();

  req.session.tmpState = state;
  req.session.tmpCourseId = courseId;

  res.redirect(client.authorizationUrl({ state }));
});
router.get("/callback", async (req, res) => {
  // TODO: error handling
  const tokenSet = await client.oauthCallback(oauthRedirectUrl, req.query, {
    state: req.session.tmpState,
  });
  const courseId = req.session.tmpCourseId || "";

  req.session.tmpCourseId = undefined;
  req.session.tmpState = undefined;
  req.session.accessToken = tokenSet.access_token;
  req.session.refreshToken = tokenSet.refresh_token;
  req.session.userId = tokenSet.user.id;

  res.redirect(`/transfer-to-ladok?courseId=${courseId}`);
});

export default router;
