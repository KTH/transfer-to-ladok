import { Request, Response } from "express";
import {
  getSkaFinnasStudenter,
  searchAllAktStudieresultat,
  searchAktivitetstillfalleStudieresultat,
  SokResultat,
  searchAllUtbStudieresultat,
} from "../externalApis/ladokApi";

interface PathParams {
  courseId: string;
}

type QueryParams =
  | {
      utbildningsinstans: string;
      kurstillfalle: string;
    }
  | {
      aktivitetstillfalle: string;
    };

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

function normalizeStudieresultat(
  s: SokResultat["Resultat"][number]
): LadokStudent {
  return {
    studieResultatUID: s.Uid,
    resultatUID: s.ResultatPaUtbildningar?.[0].Arbetsunderlag.Uid || null,
    student: {
      ladokUID: s.Student.Uid,
      firstName: s.Student.Fornamn,
      lastName: s.Student.Efternamn,
      interruptionDate: s.Avbrott?.Avbrottsdatum || null,
    },
  };
}

export default async function ladokStudentsHandler(
  req: Request<PathParams, any, any, QueryParams>,
  res: Response<LadokStudent[]>
) {
  // const { courseId } = req.params;

  if ("aktivitetstillfalle" in req.query) {
    const aktUID = req.body.aktivitetstillfalle;
    const ktfUID = await getSkaFinnasStudenter(aktUID).then((s) =>
      s.Utbildningstillfalle.map((u) => u.Uid)
    );
    const result = await searchAllAktStudieresultat(aktUID, ktfUID);

    res.send(result.Resultat.map(normalizeStudieresultat));
  } else {
    const ktfUID = [req.body.kurstillfalle];
    const utbUID = req.body.utbildningsinstans;

    const result = await searchAllUtbStudieresultat(utbUID, ktfUID);

    res.send(result.Resultat.map(normalizeStudieresultat));
  }
}
