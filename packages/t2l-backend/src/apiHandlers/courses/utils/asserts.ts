import assert from "node:assert/strict";
import { LadokApiError } from "../../../externalApis/ladokApi";
import type {
  GradeResult,
  GradesDestination,
  PostLadokGradesInput,
} from "./types";

/**
 * Collection of functions that check if an object is a given type
 *
 * Note: they don't check if the object is semantically valid
 */

/**
 * Throws a `TypeError` if `obj` is not `GradesDestination` type. When used
 * with TypeScript, it guarantees that `obj` has the correct type after calling
 * this function.
 */
export function assertGradesDestination(
  obj: any,
  ErrorClass: new (message: string) => Error = TypeError
): asserts obj is GradesDestination {
  if ("aktivitetstillfalle" in obj) {
    assert(
      typeof obj.aktivitetstillfalle === "string",
      new ErrorClass("aktivitetstillfalle must be a string")
    );

    return;
  }

  if ("kurstillfalle" in obj && "utbildningsinstans" in obj) {
    assert(
      typeof obj.kurstillfalle === "string",
      new ErrorClass("kurstillfalle must be a string")
    );
    assert(
      typeof obj.utbildningsinstans === "string",
      new ErrorClass("utbildningsinstans must be a string")
    );

    return;
  }

  throw new ErrorClass(
    "You must specify either [aktivitetstillfalle] or [kurstillfalle and utbildningsinstans]"
  );
}

export function assertGradeResult(
  obj: any,
  ErrorClass: new (message: string) => Error = TypeError
): asserts obj is GradeResult {
  assert("id" in obj, new ErrorClass("Missing required field [id]"));
  assert("draft" in obj, new ErrorClass("Missing required field [draft]"));

  assert(typeof obj.id === "string", new ErrorClass("id must be a string"));

  assert(
    "grade" in obj.draft,
    new ErrorClass("Missing required field [draft.grade]")
  );

  assert(
    "examinationDate" in obj.draft,
    new ErrorClass("Missing required field [draft.examinationDate]")
  );

  assert(
    typeof obj.draft.grade === "string",
    new ErrorClass("draft.grade must be a string")
  );

  assert(
    typeof obj.draft.examinationDate === "string",
    new ErrorClass("draft.examinationDate must be a string")
  );
}

export function assertPostLadokGradesInput(
  obj: any
): asserts obj is PostLadokGradesInput {
  assert(
    "destination" in obj,
    new TypeError("Missing required field [destination]")
  );
  assert("results" in obj, new TypeError("Missing required field [results]"));
  assertGradesDestination(obj.destination);
  assert(Array.isArray(obj.results), new TypeError("results must be an array"));

  obj.results.forEach((result: any) => assertGradeResult(result, TypeError));
}

export function isLadokApiError(obj: any): obj is LadokApiError {
  return (
    typeof obj?.Detaljkod === "string" &&
    typeof obj?.FelUID === "string" &&
    typeof obj?.Meddelande === "string"
  );
}
