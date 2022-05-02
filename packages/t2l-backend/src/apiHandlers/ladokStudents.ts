import { Request, Response } from "express";
import {
  getSkaFinnasStudenter,
  searchExaminationsStudieresultat,
  searchModulesStudieresultat,
  SokResultat,
} from "../externalApis/ladokApi";

interface AktPathParams {
  courseId: string;
  aktUID: string;
}

interface UtbPathParams {
  courseId: string;
  utbUID: string;
}

interface LadokStudent {
  studieResultatUID: string;
  resultatUID: string | null;

  student: {
    ladokUID: String;
    firstName: string;
    lastName: string;
    interruptionDate: string | null;
  };
}

// Transform a "sok" function into a function where it does all searches automatically
function fetchAll(
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

const fetchAllStudentsInAktivitetstillfalle = fetchAll(
  searchExaminationsStudieresultat
);
const fetchAllStudentsInUtbildningsinstans = fetchAll(
  searchModulesStudieresultat
);

export async function studentsInAktivitetstillfalle(
  req: Request<AktPathParams>,
  res: Response<LadokStudent[]>
) {
  // TODO: check that the courseId matches with the aktUID
  // TODO: check that user has permissions in the courseId

  const aktUID = req.params.aktUID;
  const kurstillfalle = await getSkaFinnasStudenter(aktUID).then((s) =>
    s.Utbildningstillfalle.map((u) => u.Uid)
  );
  const studieResultat = await searchExaminationsStudieresultat(
    aktUID,
    kurstillfalle
  );
}

export function studentsInUtbildningsinstans(
  req: Request<UtbPathParams>,
  res: Response<LadokStudent[]>
) {}
