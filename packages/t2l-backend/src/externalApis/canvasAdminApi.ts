/**
 * This module contains functions to call Canvas API.
 * Functions do not contain any logic
 */
import assert from "assert";
import CanvasAPI from "@kth/canvas-api";
import { Method, Headers, HTTPError } from "got";

export class CanvasAdminError extends Error {
  options?: {
    headers: Headers;
    url: string;
    method: Method;
  };
  response?: {
    body: unknown;
    headers: Headers;
    ip?: string;
    retryCount: number;
    statusCode: number;
    statusMessage?: string;
  };
  code: number;

  constructor(gotError: HTTPError) {
    super(gotError.message);
    this.code = gotError.response.statusCode;
    this.name = "CanvasApiAdminError";
    this.options = {
      headers: gotError.options.headers,
      url: gotError.options.url.toString(),
      method: gotError.options.method,
    };
    this.response = {
      body: gotError.response.body,
      headers: gotError.response.headers,
      ip: gotError.response.ip,
      retryCount: gotError.response.retryCount,
      statusCode: gotError.response.statusCode,
      statusMessage: gotError.response.statusMessage,
    };

    this.options.headers.authorization = "[HIDDEN]";
  }
}

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
    this.client.errorHandler = function (err: unknown): never {
      if (err instanceof HTTPError) {
        throw new CanvasAdminError(err);
      } else {
        throw err;
      }
    };
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
