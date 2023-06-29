/** This module contains all the endpoints related to oauth handling */
import { Router } from "express";
import { Issuer, generators, errors } from "openid-client";
import log from "skog";

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
  process.env.PROXY_HOST
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

  if (typeof courseId !== "string") {
    log.error("No courseId in query string");
    res.redirect("/transfer-to-ladok/");
    return;
  }

  const state = generators.state();

  req.session.tmpState = state;
  req.session.tmpCourseId = courseId;

  res.redirect(client.authorizationUrl({ state }));
});
router.get("/callback", async (req, res) => {
  try {
    const tokenSet = await client.oauthCallback(oauthRedirectUrl, req.query, {
      state: req.session.tmpState,
    });
    const courseId = req.session.tmpCourseId || "";

    req.session.tmpCourseId = undefined;
    req.session.tmpState = undefined;
    req.session.accessToken = tokenSet.access_token;
    req.session.refreshToken = tokenSet.refresh_token;
    req.session.userId = tokenSet.user.id;

    res.redirect(`/transfer-to-ladok/?courseId=${courseId}`);
  } catch (err) {
    if (err instanceof errors.OPError && err.message === "access_denied") {
      // The user has not accepted the oauth request
      log.warn("User has not accepted the oauth request");
      res.redirect("/transfer-to-ladok/?error=access_denied");
      return;
    }
    if (err instanceof Error) {
      log.error(err, "Error in oauth callback");
      res.redirect("/transfer-to-ladok/");
      return;
    }

    log.error(
      "Unknown error in oauth callback. The object thrown is not an Error instance"
    );
    res.redirect("/transfer-to-ladok/");
  }
});

export default router;
