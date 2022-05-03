import { CanvasSection } from "../../externalApis/canvasApi";
import {
  SokResultat,
  searchAktivitetstillfalleStudieresultat,
  searchUtbildningsinstansStudieresultat,
  getRapportor,
  getKurstillfalleStructure,
} from "../../externalApis/ladokApi";

// Transform a "sok" function into a function where it does all searches automatically
export function searchAll(
  sokFn: (arg1: string, arg2: string[], page: number) => Promise<SokResultat>
): (arg1: string, arg2: string[]) => Promise<SokResultat> {
  return async (arg1: string, arg2: string[]): Promise<SokResultat> => {
    let page = 1;
    const allResults: SokResultat["Resultat"] = [];
    const result = await sokFn(arg1, arg2, page);
    allResults.push(...result.Resultat);

    while (result.TotalAntalPoster > allResults.length) {
      page++;
      const result = await sokFn(arg1, arg2, page);
      allResults.push(...result.Resultat);
    }

    return {
      TotalAntalPoster: allResults.length,
      Resultat: allResults,
    };
  };
}

export const searchAllAktStudieresultat = searchAll(
  searchAktivitetstillfalleStudieresultat
);
export const searchAllUtbStudieresultat = searchAll(
  searchUtbildningsinstansStudieresultat
);

// Check if a person is a rapportor
export async function isRapportor(
  personUID: string,
  utbildningsinstansUID: string
) {
  const rapportorer = await getRapportor(utbildningsinstansUID);
  return rapportorer.Anvandare.some((rapportor) => rapportor.Uid === personUID);
}

/**
 * Given a list of CanvasSection, return a list of unique UIDs when the
 * section refers to a aktivitetstillfalle.
 */
export function getUniqueAktivitetstillfalleIds(
  sections: CanvasSection[]
): string[] {
  // Regex: AKT.<<UID>>.<optional suffix>
  const AKTIVITETSTILLFALLE_REGEX = /^AKT\.([a-z0-9-]+)(\.\w+)?$/;

  const ids = sections
    .map((s) => AKTIVITETSTILLFALLE_REGEX.exec(s.sis_section_id)?.[1])
    .filter((id): id is string => id !== undefined);

  return Array.from(new Set(ids));
}

/**
 * Given a list of CanvasSection, returns a list of unique UIDs when the
 * section refers to a kurstillfalle
 */
export function getUniqueKurstillfalleIds(sections: CanvasSection[]): string[] {
  // Regex: AA0000VT211
  const KURSTILLFALLE_REGEX = /^\w{6,7}(HT|VT)\d{3}$/;

  const ids = sections
    .filter((s) => KURSTILLFALLE_REGEX.test(s.sis_section_id))
    .map((s) => s.integration_id);

  return Array.from(new Set(ids));
}

/** Given an Kurstillfälle UID, get extra information from Ladok */
export async function completeKurstillfalleInformation(uid: string) {
  const ladokKur = await getKurstillfalleStructure(uid);

  return {
    id: uid,
    utbildningsinstansUID: ladokKur.UtbildningsinstansUID,
    name: ladokKur.Kurstillfalleskod,
    modules: ladokKur.IngaendeMoment.map((m) => ({
      utbildningsinstansUID: m.UtbildningsinstansUID,
      examCode: m.Utbildningskod,
      name: m.Benamning.sv,
    })),
  };
}
