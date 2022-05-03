import { Request, Response } from "express";
import {
  createResult,
  getSkaFinnasStudenter,
  SokResultat,
  updateResult,
} from "../../externalApis/ladokApi";
import {
  isRapportor,
  searchAllAktStudieresultat,
  searchAllUtbStudieresultat,
} from "./utils";

type GradesDestination =
  | {
      utbildningsinstansUID: string;
      kurstillfalleUID: string;
    }
  | {
      aktivitetstillfalleUID: string;
    };

interface LadokResult {
  studentUID: string;
  studieresultatUID: string;
  resultatUID: string | null;
  utbildningsinstansUID: string;
  hasPermission: boolean;
}

interface BodyParams {
  destination: GradesDestination;
  results: {
    studentUID: string;
    grade: string;
    examinationDate: string;
  }[];
}

interface ResponseBody {
  summary: {
    success: number;
    error: number;
  };
  results: {
    studentUID: string;
    status: "success" | "error";
    error?: {
      code:
        | "non_existing_grade"
        | "unauthorized"
        | "incorrect_format"
        | "unknown_error";
    };
  }[];
}

export async function getLadokResults(
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
      utbildningsinstansUID:
        studieResultat.Rapporteringskontext.UtbildningsinstansUID,
      resultatUID:
        studieResultat.ResultatPaUtbildningar?.[0].Arbetsunderlag.Uid || null,
      hasPermission,
    });
  }

  return ladokResults;
}

export async function getGradesHandler(
  req: Request<{ courseId: string }, any, any, GradesDestination>,
  res: Response<LadokResult[]>
) {
  // TODO: check if the courseId matches with GradeDestination
  // TODO: get user LadokUID from session

  const ladokResults = await getLadokResults(req.body.destination, "");
  res.send(ladokResults);
}

export async function postGradesHandler(
  req: Request<{ courseId: string }, any, BodyParams>,
  res: Response<ResponseBody>
) {
  const { destination, results } = req.body;
  const ladokResults = await getLadokResults(destination, "");
  const response: ResponseBody["results"] = [];

  for (const result of results) {
    const ladokResult = ladokResults.find(
      (r) => r.studentUID === result.studentUID
    );
    if (!ladokResult) {
      response.push({
        studentUID: result.studentUID,
        status: "error",
        error: {
          code: "non_existing_grade",
        },
      });
      continue;
    }

    if (!ladokResult.hasPermission) {
      response.push({
        studentUID: result.studentUID,
        status: "error",
        error: {
          code: "unauthorized",
        },
      });
      continue;
    }

    if (ladokResult.resultatUID) {
      await updateResult(ladokResult.resultatUID, {
        // TODO: Convert "grade" into correct ID
        Betygsgrad: 0,
        BetygsskalaID: 0,
        Examinationsdatum: "",
      }).catch((err) => {
        // TODO
      });

      // TODO
    } else {
      await createResult(
        ladokResult.studieresultatUID,
        ladokResult.utbildningsinstansUID,
        {
          Betygsgrad: 0,
          BetygsskalaID: 0,
          Examinationsdatum: "",
        }
      );
    }
  }
}
