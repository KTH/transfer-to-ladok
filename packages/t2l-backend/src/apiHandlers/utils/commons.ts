import { CanvasSection } from "../../externalApis/canvasApi";

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
