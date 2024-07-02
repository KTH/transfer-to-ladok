import { CanvasSection } from "../../externalApis/canvasApi";
import { getBehorighetsprofil } from "../../externalApis/ladokApi";
import assert from "node:assert/strict";
import { ForbiddenError } from "../error";

/**
 * Given a list of {@link CanvasSection}, identifies which ones are linked to
 * a Ladok kurstillfälle and which ones to a Ladok aktivitetstillfälle.
 *
 * @returns an object with two lists `aktivitetstillfalleIds` and
 * `kurstillfalleIds`, which are lists of Ladok IDs found in the sections.
 *
 * Note: this function does not make calls to Ladok and it does not guarantee
 * that the returned list are actual Ladok IDs
 */
export function splitSections(sections: CanvasSection[]) {
  const AKTIVITETSTILLFALLE_REGEX =
    /^AKT\.(\w{8}-\w{4}-\w{4}-\w{4}-\w{12})(\.\w+)?$/;
  const KURSTILLFALLE_REGEX = /^\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$/;

  const aktIds = sections
    .map((s) => AKTIVITETSTILLFALLE_REGEX.exec(s.sis_section_id ?? "")?.[1])
    .filter((id): id is string => id !== undefined);

  const kurIds = sections
    .filter((s) => KURSTILLFALLE_REGEX.test(s.sis_section_id ?? ""))
    .map((s) => s.sis_section_id)
    .filter((id): id is string => typeof id === "string");

  // This function should return each ID once.
  // Examrooms have multiple sections including same ID but with different
  // suffixes.
  return {
    aktivitetstillfalleIds: Array.from(new Set(aktIds)),
    kurstillfalleIds: Array.from(new Set(kurIds)),
  };
}

/** Check if a person has the right profile in Ladok to send grades */
export async function checkPermissionProfile(email: string) {
  const hasProfile = await getBehorighetsprofil().then(
    (profile) =>
      profile.Anvandare.filter((a) => a.Anvandarnamn === email).length > 0
  );

  assert(
    hasProfile,
    new ForbiddenError(
      `You don't have the profile "KTH - Resultatrapportör lärare" in Ladok`
    )
  );
}

/**
 * Returns a predicate for {@link Array.filter}.
 *
 * The predicate returns true only if the element is the first appearance in
 * the array.
 *
 * @param equalFn Function that compares if two elements are the same.
 */
export function unique<T>(
  equalFn: (a: T, b: T) => boolean = (a, b) => a === b
) {
  return (value: T, index: number, array: T[]) =>
    array.findIndex((v2) => equalFn(value, v2)) === index;
}
