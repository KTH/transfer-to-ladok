/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Collection of functions that check if an object is a given type
 *
 * Note: they don't check if the object is semantically valid
 */
import assert from "node:assert/strict";
import type {
  ResultInput,
  GradesDestination,
  PostLadokGradesInput,
} from "./types";
import { BadRequestError } from "../error";

export function assertGradesDestination(
  obj: any
): asserts obj is GradesDestination {
  if ("aktivitetstillfalle" in obj) {
    assert(
      typeof obj.aktivitetstillfalle === "string",
      new BadRequestError("aktivitetstillfalle must be a string")
    );

    return;
  }

  if ("kurstillfalle" in obj && "utbildningsinstans" in obj) {
    assert(
      typeof obj.kurstillfalle === "string",
      new BadRequestError("kurstillfalle must be a string")
    );
    assert(
      typeof obj.utbildningsinstans === "string",
      new BadRequestError("utbildningsinstans must be a string")
    );

    return;
  }

  throw new BadRequestError(
    "You must specify either [aktivitetstillfalle] or [kurstillfalle and utbildningsinstans]"
  );
}

export function assertGradeResult(obj: any): asserts obj is ResultInput {
  assert("id" in obj, new BadRequestError("Missing required field [id]"));
  assert("draft" in obj, new BadRequestError("Missing required field [draft]"));

  assert(
    typeof obj.id === "string",
    new BadRequestError("id must be a string")
  );

  assert(
    "grade" in obj.draft,
    new BadRequestError("Missing required field [draft.grade]")
  );

  assert(
    "examinationDate" in obj.draft,
    new BadRequestError("Missing required field [draft.examinationDate]")
  );

  assert(
    typeof obj.draft.grade === "string",
    new BadRequestError("draft.grade must be a string")
  );

  assert(
    typeof obj.draft.examinationDate === "string",
    new BadRequestError("draft.examinationDate must be a string")
  );
}

export function assertPostLadokGradesInput(
  obj: any
): asserts obj is PostLadokGradesInput {
  assert(
    "destination" in obj,
    new BadRequestError("Missing required field [destination]")
  );
  assert(
    "results" in obj,
    new BadRequestError("Missing required field [results]")
  );
  assertGradesDestination(obj.destination);
  assert(
    Array.isArray(obj.results),
    new BadRequestError("results must be an array")
  );

  obj.results.forEach((result: any) => assertGradeResult(result));
}
