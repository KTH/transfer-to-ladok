import { Request, Response } from "express";
import {
  getSkaFinnasStudenter,
  SokResultat,
} from "../../externalApis/ladokApi";
import CanvasClient from "../../externalApis/canvasApi";
import {
  completeKurstillfalleInformation,
  getUniqueAktivitetstillfalleIds,
  getUniqueKurstillfalleIds,
  isRapportor,
  searchAllAktStudieresultat,
  searchAllUtbStudieresultat,
} from "./utils";
import type {
  GradesDestination,
  GradeableStudents,
  PostLadokGradesInput,
} from "./types";

interface LadokResult {
  studentUID: string;
  studieresultatUID: string;
  resultatUID: string | null;
  utbildningsinstansUID: string;
  hasPermission: boolean;
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

async function checkDestination(
  canvasClient: CanvasClient,
  courseId: string,
  destination: GradesDestination
) {
  const sections = await canvasClient.getSections(courseId);

  // Check if destination is an aktiivitetstillfalle
  if ("aktivitetstillfalleUID" in destination) {
    if (
      getUniqueAktivitetstillfalleIds(sections).includes(
        destination.aktivitetstillfalleUID
      )
    ) {
      return;
    } else {
      // TODO: 4xx error handling
      throw new Error("");
    }
  }

  // Check if destination is a kurstillfalle+utbildningsinstans
  const kurstillfalleUID = getUniqueKurstillfalleIds(sections).find(
    (id) => id === destination.kurstillfalleUID
  );

  if (!kurstillfalleUID) {
    throw new Error("4xx");
  }

  const kurstillfalle = await completeKurstillfalleInformation(
    kurstillfalleUID
  );

  // Destination is "final grade"
  if (
    kurstillfalle.utbildningsinstansUID === destination.utbildningsinstansUID
  ) {
    return;
  }

  // Destination is a module
  if (
    kurstillfalle.modules.find(
      (m) => m.utbildningsinstansUID === destination.utbildningsinstansUID
    )
  ) {
    return;
  }

  throw new Error("4xx");
}

export async function getGradesHandler(
  req: Request<{ courseId: string }, unknown, unknown, GradesDestination>,
  res: Response<GradeableStudents>
) {
  // check if the courseId matches with GradeDestination
  const canvasClient = new CanvasClient(req);
  await checkDestination(canvasClient, req.params.courseId, req.query);

  // TODO: get user LadokUID from session

  const ladokResults = await getLadokResults(req.query, "");
  // res.send(ladokResults);
}

export async function postGradesHandler(
  req: Request<{ courseId: string }, unknown, PostLadokGradesInput>,
  res: Response<{}>
) {
  const { destination, results } = req.body;
  const ladokResults = await getLadokResults(destination, "");
  // const response: ResponseBody["results"] = [];

  // for (const result of results) {
  //   const ladokResult = ladokResults.find(
  //     (r) => r.studentUID === result.studentUID
  //   );
  //   if (!ladokResult) {
  //     response.push({
  //       studentUID: result.studentUID,
  //       status: "error",
  //       error: {
  //         code: "non_existing_grade",
  //       },
  //     });
  //     continue;
  //   }

  //   if (!ladokResult.hasPermission) {
  //     response.push({
  //       studentUID: result.studentUID,
  //       status: "error",
  //       error: {
  //         code: "unauthorized",
  //       },
  //     });
  //     continue;
  //   }

  //   if (ladokResult.resultatUID) {
  //     await updateResult(ladokResult.resultatUID, {
  //       // TODO: Convert "grade" into correct ID
  //       Betygsgrad: 0,
  //       BetygsskalaID: 0,
  //       Examinationsdatum: "",
  //     }).catch((err) => {
  //       // TODO
  //     });

  //     // TODO
  //   } else {
  //     await createResult(
  //       ladokResult.studieresultatUID,
  //       ladokResult.utbildningsinstansUID,
  //       {
  //         Betygsgrad: 0,
  //         BetygsskalaID: 0,
  //         Examinationsdatum: "",
  //       }
  //     );
  //   }
  // }
}
