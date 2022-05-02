import {
  SokResultat,
  searchAktivitetstillfalleStudieresultat,
  searchUtbildningsinstansStudieresultat,
  getRapportor,
  getSkaFinnasStudenter,
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

export type GradesDestination =
  | {
      utbildningsinstansUID: string;
      kurstillfalleUID: string;
    }
  | {
      aktivitetstillfalleUID: string;
    };

export interface LadokResult {
  studentUID: string;
  studieresultatUID: string;
  resultatUID: string | null;
  hasPermission: boolean;
}

export default async function getLadokResults(
  destination: GradesDestination,
  personUID: string
): Promise<LadokResult[]> {
  let sokResultat: SokResultat;

  if ("aktivitetstillfalleUID" in destination) {
    const kurstillfalleUID = await getSkaFinnasStudenter(
      destination.aktivitetstillfalleUID
    ).then((sfi) => sfi.Utbildningstillfalle.map((u) => u.Uid));

    sokResultat = await searchAllAktStudieresultat(
      destination.aktivitetstillfalleUID,
      kurstillfalleUID
    );
  } else {
    sokResultat = await searchAllUtbStudieresultat(
      destination.utbildningsinstansUID,
      [destination.kurstillfalleUID]
    );
  }

  // Normalize results
  const ladokResults: LadokResult[] = [];

  for (const studieResultat of sokResultat.Resultat) {
    const hasPermission = await isRapportor(
      personUID,
      studieResultat.Rapporteringskontext.UtbildningsinstansUID
    );

    ladokResults.push({
      studentUID: studieResultat.Student.Uid,
      studieresultatUID: studieResultat.Uid,
      resultatUID:
        studieResultat.ResultatPaUtbildningar?.[0].Arbetsunderlag.Uid || null,
      hasPermission,
    });
  }

  return ladokResults;
}
