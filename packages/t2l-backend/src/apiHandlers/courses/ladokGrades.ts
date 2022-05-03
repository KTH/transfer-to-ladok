import { Request, Response } from "express";
import {
  getSkaFinnasStudenter,
  SokResultat,
} from "../../externalApis/ladokApi";
import CanvasClient, { CanvasSection } from "../../externalApis/canvasApi";
import {
  completeKurstillfalleInformation,
  getUniqueAktivitetstillfalleIds,
  getUniqueKurstillfalleIds,
  isRapportor,
  searchAllAktStudieresultat,
  searchAllUtbStudieresultat,
} from "./utils";
import type { GradesDestination, GradeableStudents } from "./types";

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

  if ("aktivitetstillfalle" in destination) {
    const kurstillfalleUID = await getSkaFinnasStudenter(
      destination.aktivitetstillfalle
    ).then((sfi) => sfi.Utbildningstillfalle.map((u) => u.Uid));

    sokResultat = await searchAllAktStudieresultat(
      destination.aktivitetstillfalle,
      kurstillfalleUID
    );
  } else {
    sokResultat = await searchAllUtbStudieresultat(
      destination.utbildningsinstans,
      [destination.kurstillfalle]
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

function assertAktivitetstillfalle(
  sections: CanvasSection[],
  aktivitetstillfalleUID: string
) {
  if (
    !getUniqueAktivitetstillfalleIds(sections).includes(aktivitetstillfalleUID)
  ) {
    throw new Error("404");
  }
}

function assertKurstillfalle(
  sections: CanvasSection[],
  kurstillfalleUID: string
) {
  if (!getUniqueKurstillfalleIds(sections).includes(kurstillfalleUID)) {
    throw new Error("404");
  }
}

async function assertUtbildningsinstans(
  kurstillfalleUID: string,
  utbildningsinstansUID: string
) {
  const { utbildningsinstans, modules } =
    await completeKurstillfalleInformation(kurstillfalleUID);

  if (utbildningsinstans === utbildningsinstansUID) {
    return;
  }

  if (modules.find((m) => m.utbildningsinstans === utbildningsinstansUID)) {
    return;
  }

  throw new Error("404");
}

async function checkDestination(
  req: Request<{ courseId: string }>,
  destination: GradesDestination
) {
  const courseId = req.params.courseId;
  const canvasClient = new CanvasClient(req);
  const sections = await canvasClient.getSections(courseId);

  if ("aktivitetstillfalle" in destination) {
    assertAktivitetstillfalle(sections, destination.aktivitetstillfalle);
  } else {
    const { kurstillfalle, utbildningsinstans } = destination;
    assertKurstillfalle(sections, kurstillfalle);

    await assertUtbildningsinstans(kurstillfalle, utbildningsinstans);
  }
}

export async function getGradesHandler(
  req: Request<{ courseId: string }, unknown, unknown, GradesDestination>,
  res: Response<GradeableStudents>
) {
  await checkDestination(req, req.query);

  // TODO: get user LadokUID from session

  const ladokResults = await getLadokResults(req.query, "");
  // res.send(ladokResults);
}
