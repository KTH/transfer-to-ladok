import { CanvasSection } from "../../../externalApis/canvasApi";
import {
  SokResultat,
  searchAktivitetstillfalleStudieresultat,
  searchUtbildningsinstansStudieresultat,
  getKurstillfalleStructure,
  getSkaFinnasStudenter,
  getAktivitetstillfalle,
  Studieresultat,
  RapporteringsMojlighetOutput,
  getBetyg,
  searchRapporteringsMojlighet,
} from "../../../externalApis/ladokApi";
import type {
  AktSection,
  GradeableStudents,
  GradesDestination,
  KurSection,
} from "./types";

/**
 * Given a "sok" function and its arguments, go through all pages and returns
 * a list of StudieResultat
 */
async function searchAll(
  sokFn: (arg1: string, arg2: string[], page: number) => Promise<SokResultat>,
  arg1: string,
  arg2: string[]
): Promise<Studieresultat[]> {
  let page = 1;
  const allResults: Studieresultat[] = [];
  const result = await sokFn(arg1, arg2, page);
  allResults.push(...result.Resultat);

  while (result.TotaltAntalPoster > allResults.length) {
    page++;
    const result = await sokFn(arg1, arg2, page);
    allResults.push(...result.Resultat);
  }

  return allResults;
}

/**
 * @private Get all {@link Studieresultat} in an Aktivitetstillfälle.
 *
 * This function is used internally by {@link getAllStudieresultat}
 */
function searchAllAktivitetstillfalleStudieresultat(
  aktivitetstillfalleUID: string,
  kurstillfallenUID: string[]
) {
  return searchAll(
    searchAktivitetstillfalleStudieresultat,
    aktivitetstillfalleUID,
    kurstillfallenUID
  );
}

/**
 * @private Get all {@link Studieresultat} in an Utbildningsinstans.
 *
 * This function is used internally by {@link getAllStudieresultat}
 */
function searchAllUtbildningsinstansStudieresultat(
  utbildningsinstansUID: string,
  kurstillfallenUID: string[]
) {
  return searchAll(
    searchUtbildningsinstansStudieresultat,
    utbildningsinstansUID,
    kurstillfallenUID
  );
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
  const AKTIVITETSTILLFALLE_REGEX = /^AKT\.([a-z0-9-]+)(\.\w+)?$/;
  const KURSTILLFALLE_REGEX = /^\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$/;
  const OLD_KURSTILLFALLE_REGEX = /^\w{6,7}(HT|VT)\d{3}$/;

  const aktIds = sections
    .map((s) => AKTIVITETSTILLFALLE_REGEX.exec(s.sis_section_id ?? "")?.[1])
    .filter((id): id is string => id !== undefined);

  const kurIds = sections
    .filter((s) => KURSTILLFALLE_REGEX.test(s.sis_section_id ?? ""))
    .map((s) => s.sis_section_id)
    .filter((id): id is string => typeof id === "string");

  const OLD__kurIds = sections
    .filter((s) => OLD_KURSTILLFALLE_REGEX.test(s.sis_section_id ?? ""))
    .map((s) => s.integration_id)
    .filter((id): id is string => typeof id === "string");

  // This function should return each ID once.
  // Examrooms have multiple sections including same ID but with different
  // suffixes.
  return {
    aktivitetstillfalleIds: Array.from(new Set(aktIds)),
    kurstillfalleIds: Array.from(new Set([...kurIds, ...OLD__kurIds])),
  };
}

/**
 * Given an Kurstillfälle UID, returns information about the kurstillfälle in Ladok
 */
export async function getExtraKurInformation(uid: string): Promise<KurSection> {
  const ladokKur = await getKurstillfalleStructure(uid);

  return {
    id: uid,
    utbildningsinstans: ladokKur.UtbildningsinstansUID,
    courseCode: ladokKur.Utbildningskod,
    roundCode: ladokKur.Kurstillfalleskod,
    modules: ladokKur.IngaendeMoment.map((m) => ({
      utbildningsinstans: m.UtbildningsinstansUID,
      code: m.Utbildningskod,
      name: m.Benamning.sv,
    })),
  };
}

/** Given an Aktivitetstillfälle UID, returns Ladok information about it */
export async function getExtraAktInformation(uid: string): Promise<AktSection> {
  const ladokAkt = await getAktivitetstillfalle(uid);
  const codes = ladokAkt.Aktiviteter.map(
    (a) =>
      `${a.Kursinstans.Utbildningskod} ${a.Utbildningsinstans.Utbildningskod}`
  );
  const date = ladokAkt.Datumperiod.Startdatum;
  const name = codes.join(" & ") + " - " + date;

  return {
    id: uid,
    name,
    date,
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

    return searchAllAktivitetstillfalleStudieresultat(
      destination.aktivitetstillfalle,
      kurstillfalleUID
    );
  } else {
    return searchAllUtbildningsinstansStudieresultat(
      destination.utbildningsinstans,
      [destination.kurstillfalle]
    );
  }
}

/** Get an existing draft in a "Studieresultat" */
export function getExistingDraft(studentResultat: Studieresultat) {
  const arbetsunderlag = studentResultat.ResultatPaUtbildningar?.find(
    (rpu) => rpu.Arbetsunderlag
  )?.Arbetsunderlag;

  return arbetsunderlag;
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

      return {
        student: {
          id: oneStudieresultat.Student.Uid,
          sortableName: `${oneStudieresultat.Student.Efternamn}, ${oneStudieresultat.Student.Fornamn}`,
        },
        scale,
        hasPermission,
        draft:
          draft && hasPermission
            ? {
                grade: draft.Betygsgradsobjekt.Kod,
                examinationDate: draft.Examinationsdatum,
              }
            : undefined,
      };
    }
  );
}
