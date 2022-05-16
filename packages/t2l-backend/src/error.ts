import { CanvasApiError } from "@kth/canvas-api";
import { Request, Response, NextFunction } from "express";
import log from "skog";

export class BadRequestError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export class UnprocessableEntityError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response<{
    code: string;
    message: string;
  }>,
  next: NextFunction
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

  if (err instanceof Error) {
    log.error(err, "Unexpected Error");
  } else {
    log.error("Unexpected error. Object thrown is not an instance of Error");
  }

  res.status(500).json({
    code: "internal_error",
    message: "Internal error",
  });
}
