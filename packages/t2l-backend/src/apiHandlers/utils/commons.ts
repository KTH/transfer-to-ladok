import {
  getSkaFinnasStudenter,
  Studieresultat,
  RapporteringsMojlighetOutput,
  getBetyg,
  searchRapporteringsMojlighet,
  searchStudieresultat,
} from "../../externalApis/ladokApi";
import type { GradeableStudents, GradesDestination } from "./types";
import { CanvasSection } from "../../externalApis/canvasApi";

async function searchAllStudieresultat(
  type: "utbildningsinstans" | "aktivitetstillfalle",
  UID: string,
  KurstillfallenUID: string[]
) {
  let page = 1;
  const allResults: Studieresultat[] = [];
  const result = await searchStudieresultat(type, UID, KurstillfallenUID, page);
  allResults.push(...result.Resultat);

  while (result.TotaltAntalPoster > allResults.length) {
    page++;
    const result = await searchStudieresultat(
      type,
      UID,
      KurstillfallenUID,
      page
    );
    allResults.push(...result.Resultat);
  }

  return allResults;
}

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

/**
 * Given a destination ({@link GradesDestination}), get a list of all
 * {@link Studieresultat} in that destination
 */
export async function getAllStudieresultat(
  destination: GradesDestination
): Promise<Studieresultat[]> {
  if ("aktivitetstillfalle" in destination) {
    // We use this function only to get all Kurstillfälle that are linked with a given aktivitetstillfälle.
    const kurstillfalleUID = await getSkaFinnasStudenter(
      destination.aktivitetstillfalle
    ).then((s) => s.Utbildningstillfalle.map((u) => u.Uid));

    return searchAllStudieresultat(
      "aktivitetstillfalle",
      destination.aktivitetstillfalle,
      kurstillfalleUID
    );
  } else {
    return searchAllStudieresultat(
      "utbildningsinstans",
      destination.utbildningsinstans,
      [destination.kurstillfalle]
    );
  }
}

/** Get an existing draft in a "Studieresultat" */
export function getExistingDraft(studieResultat: Studieresultat) {
  return studieResultat.ResultatPaUtbildningar?.find(
    (rpu) => rpu.Arbetsunderlag?.ProcessStatus === 1
  )?.Arbetsunderlag;
}

/** Get an existing "klarmarkerade" result in a Studieresultat */
export function getExistingReady(studieResultat: Studieresultat) {
  return studieResultat.ResultatPaUtbildningar?.find(
    (rpu) => rpu.Arbetsunderlag?.ProcessStatus === 2
  )?.Arbetsunderlag;
}

/** Get an existing "senaste attesterade" result if any */
export function getLatestCertified(studieResultat: Studieresultat) {
  return studieResultat.ResultatPaUtbildningar?.find(
    (rpu) =>
      // For some strange reason, the API returns results from other completely
      // unrelated modules (¯\_(ツ)_/¯)
      // We need to filter out things to prevent bugs
      rpu.SenastAttesteradeResultat?.UtbildningsinstansUID ===
      studieResultat.Rapporteringskontext.UtbildningsinstansUID
  )?.SenastAttesteradeResultat;
}

/**
 * Given a list of {@link Studieresultat}, get a list of which ones the user
 * has permissions to send grades to.
 */
export async function getAllPermissions(
  allStudieresultat: Studieresultat[],
  email: string
) {
  return searchRapporteringsMojlighet(
    email,
    allStudieresultat.map((s) => ({
      StudieresultatUID: s.Uid,
      UtbildningsinstansAttRapporteraPaUID:
        s.Rapporteringskontext.UtbildningsinstansUID,
    }))
  );
}

/** Checks if the Studieresultat is part of the "RapporteringsMojlighetOutput" list */
export function containsPermission(
  studieresultat: Studieresultat,
  allPermissions: RapporteringsMojlighetOutput
) {
  return allPermissions.KontrolleraRapporteringsrattighetlista.some(
    (r) =>
      r.StudieresultatUID === studieresultat.Uid &&
      r.UtbildningsinstansAttRapporteraPaUID ===
        studieresultat.Rapporteringskontext.UtbildningsinstansUID &&
      r.HarRattighet
  );
}

/**
 * Merges a list of {@link Studieresultat} and the object {@link RapporteringsMojlighetOutput}
 * into a single human-readable list
 */
export function normalizeStudieresultat(
  allStudieresultat: Studieresultat[],
  allPermissions: RapporteringsMojlighetOutput
): GradeableStudents {
  return allStudieresultat.map(
    (oneStudieresultat): GradeableStudents[number] => {
      const scale = getBetyg(
        oneStudieresultat.Rapporteringskontext.BetygsskalaID
      ).map((b) => b.Kod);

      const hasPermission = containsPermission(
        oneStudieresultat,
        allPermissions
      );

      const draft = getExistingDraft(oneStudieresultat);
      const certified = getLatestCertified(oneStudieresultat);
      const ready = getExistingReady(oneStudieresultat);

      return {
        student: {
          id: oneStudieresultat.Student.Uid,
          sortableName: `${oneStudieresultat.Student.Efternamn}, ${oneStudieresultat.Student.Fornamn}`,
        },
        scale,
        hasPermission,
        requiresTitle:
          oneStudieresultat.Rapporteringskontext.KravPaProjekttitel,
        draft:
          draft && hasPermission
            ? {
                grade: draft.Betygsgradsobjekt?.Kod,
                examinationDate: draft.Examinationsdatum,
                projectTitle: draft.Projekttitel && {
                  title: draft.Projekttitel.Titel,
                  alternativeTitle: draft.Projekttitel.AlternativTitel,
                },
              }
            : undefined,
        markedAsReady:
          ready && hasPermission
            ? {
                grade: ready.Betygsgradsobjekt.Kod,
                examinationDate: ready.Examinationsdatum,
              }
            : undefined,
        certified:
          certified && hasPermission
            ? {
                grade: certified.Betygsgradsobjekt.Kod,
                examinationDate: certified.Examinationsdatum,
              }
            : undefined,
      };
    }
  );
}
