import assert from "node:assert/strict";
import type { GradesDestination } from "./types";

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
  }

  throw new ErrorClass(
    "You must specify either [aktivitetstillfalle] or [kurstillfalle and utbildningsinstans]"
  );
}
