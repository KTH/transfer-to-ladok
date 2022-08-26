/**
 * This module contains functions to call Canvas API.
 * Functions do not contain any logic
 */
import assert from "assert";
import CanvasAPI, { minimalErrorHandler } from "@kth/canvas-api";

export default class CanvasAdminClient {
  client: CanvasAPI;

  constructor() {
    const canvasApiUrl = process.env.CANVAS_API_URL;
    const canvasApiToken = process.env.CANVAS_API_ADMIN_TOKEN;
    assert(
      typeof canvasApiUrl === "string",
      "Missing environmental variable [CANVAS_API_URL]"
    );
    assert(
      typeof canvasApiToken === "string",
      "Missing environmental variable [CANVAS_API_ADMIN_TOKEN]"
    );
    this.client = new CanvasAPI(canvasApiUrl, canvasApiToken);
    this.client.errorHandler = minimalErrorHandler;
  }

  getUserLoginId(userId: number): Promise<string> {
    return this.client
      .get<{ login_id?: string }>(`users/${userId}`)
      .then((r) => {
        const loginId = r.body.login_id;

        assert(
          loginId,
          `Unable to get 'login_id' from user [${userId}]. Use an CANVAS_API_ADMIN_TOKEN with permissions to read such field`
        );
        return loginId;
      });
  }
}
