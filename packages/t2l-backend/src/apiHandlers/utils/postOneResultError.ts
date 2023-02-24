/**
 * This file includes a collection of errors that may happen when posting a
 * result to Ladok
 */

import type { ApiError } from "./types";
import { HTTPError } from "got";
import { LadokApiError } from "../../externalApis/ladokApi";
import log from "skog";

type LadokApiErrorCodes =
  | "input_error"
  | "ladok_error"
  | "unprocessed_ladok_error"
  | "unknown_ladok_error"
  | "unknown_error";

/** Errors detected by us */
export class PostResultError extends Error {
  message: string;

  constructor(message: string) {
    super(message);
    this.message = message;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isLadokApiError(obj: any): obj is LadokApiError {
  return (
    typeof obj?.Detaljkod === "string" &&
    typeof obj?.FelUID === "string" &&
    typeof obj?.Meddelande === "string"
  );
}

export function handleError(err: unknown): ApiError<LadokApiErrorCodes> {
  if (err instanceof PostResultError) {
    return {
      code: "input_error",
      message: err.message,
    };
  }

  if (err instanceof HTTPError) {
    const body = err.response.body;

    if (isLadokApiError(body)) {
      return {
        code: "ladok_error",
        message: body.Meddelande,
      };
    }

    if (typeof err.response.body === "string") {
      log.error(err);
      return {
        code: "unknown_ladok_error",
        message: `Unknown problem in Ladok (please contact IT-support): ${err.response.body}`,
      };
    }

    log.error(err);

    return {
      code: "unknown_ladok_error",
      message: `Unknown Ladok error (please, contact IT-support): ${err.message}`,
    };
  }

  if (err instanceof Error) {
    log.error(err, "Unknown Error from Ladok API");
    return {
      code: "unknown_error",
      message: `Unknown Error: ${err.message}. Please contact IT-support`,
    };
  }

  log.error(
    "Unknown problem in Ladok. Even worse: `err` is not an instance of Error"
  );

  return {
    code: "unknown_error",
    message: "Unknown problem. Please contact IT-support",
  };
}
