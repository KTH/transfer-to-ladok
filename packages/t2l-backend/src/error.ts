import { Request, Response, NextFunction } from "express";
import log from "skog";

export type ErrorCode = "not_authorized";

/**
 * Errors that must be handled by the client.
 */
export class EndpointError extends Error {
  code: ErrorCode;

  constructor(message: string, code: ErrorCode) {
    super(message);
    this.code = code;
  }

  toObject() {
    return {
      code: this.code,
      message: this.message,
    };
  }
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (err instanceof EndpointError) {
    res.status(401).json(err.toObject());
    return;
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
