import { CanvasApiError } from "@kth/canvas-api";
import { Request, Response, NextFunction } from "express";
import log from "skog";

interface ApiError {
  code: string;
  message: string;
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response<ApiError>,
  next: NextFunction
) {
  if (err instanceof CanvasApiError) {
    if (err.code === 401) {
      return res.status(401).json({
        code: "invalid_access_token",
        message: "Invalid access token",
      });
    } else if (err.code === 404) {
      return res.status(404).json({
        code: "not_found",
        message: "Not found",
      });
    }
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
