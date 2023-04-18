import { CanvasApiError } from "@kth/canvas-api";
import { Request, Response, NextFunction } from "express";
import { Headers, HTTPError, Method } from "got";
import log from "skog";
import { ApiError } from "../types";

/** Thrown when the request contains syntax errors */
export class BadRequestError extends Error {
  constructor(message: string) {
    super(message);
  }
}

/** Thrown when the request contains semantic errors */
export class UnprocessableEntityError extends Error {
  constructor(message: string) {
    super(message);
  }
}

/** Thrown when the user is not logged in */
export class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message);
  }
}

/**
 * Thrown when the user is logged in but does not have enough permissions to
 * perform the requested action
 */
export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message);
  }
}

/** Converts a HTTPError from Got to something readable */
export class UnhandledApiError extends Error {
  public options?: {
    headers: Headers;
    url: string;
    method: Method;
    body: unknown;
  };

  public response?: {
    body: unknown;
    headers: Headers;
    ip?: string;
    retryCount: number;
    statusCode: number;
    statusMessage?: string;
  };

  public code: number;

  constructor(gotError: HTTPError) {
    super(gotError.message);
    this.code = gotError.response.statusCode;
    this.name = "UnhandledApiError";
    this.options = {
      headers: gotError.options.headers,
      url: gotError.options.url.toString(),
      method: gotError.options.method,
      body: JSON.stringify(gotError.options.json || {}),
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

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response<ApiError>,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) {
  if (err instanceof CanvasApiError) {
    if (err.code === 401) {
      return res.status(401).json({
        code: "unauthorized",
        message: "Invalid access token",
      });
    } else if (err.code === 404) {
      return res.status(404).json({
        code: "not_found",
        message: "Not found",
      });
    }
  }

  if (err instanceof ForbiddenError) {
    return res.status(403).json({
      code: "forbidden",
      message: err.message,
    });
  }

  if (err instanceof UnauthorizedError) {
    return res.status(401).json({
      code: "unauthorized",
      message: err.message,
    });
  }

  if (err instanceof BadRequestError) {
    return res.status(400).json({
      code: "bad_request",
      message: err.message,
    });
  }

  if (err instanceof UnprocessableEntityError) {
    return res.status(422).json({
      code: "unprocessable_entity",
      message: err.message,
    });
  }

  if (err instanceof HTTPError) {
    log.error(new UnhandledApiError(err), "Unexpected HTTP Error");
  } else if (err instanceof Error) {
    log.error(err, "Unexpected Error");
  } else {
    log.error("Unexpected error. Object thrown is not an instance of Error");
  }

  res.status(500).json({
    code: "internal_error",
    message: "Internal error",
  });
}
