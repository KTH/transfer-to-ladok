import assert from "node:assert/strict";
import { Request, Response } from "express";
import CanvasClient, { CanvasSection } from "../../externalApis/canvasApi";
import {
  completeKurstillfalle,
  getLadokResults,
  getUniqueAktivitetstillfalleIds,
  getUniqueKurstillfalleIds,
} from "./utils";
import type { GradesDestination, GradeableStudents } from "./types";

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
  const { utbildningsinstans, modules } = await completeKurstillfalle(
    kurstillfalleUID
  );

  if (utbildningsinstans === utbildningsinstansUID) {
    return;
  }

  if (modules.find((m) => m.utbildningsinstans === utbildningsinstansUID)) {
    return;
  }

  throw new Error("404");
}

function assertGradesDestination(q: any): asserts q is GradesDestination {
  if ("aktivitetstillfalle" in q) {
    assert(typeof q.aktivitetstillfalle === "string");
  }

  if ("kurstillfalle" in q && "utbildningsinstans" in q) {
    assert(typeof q.kurstillfalle === "string");
    assert(typeof q.utbildningsinstans === "string");
  }

  throw new Error();
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
  req: Request<{ courseId: string }>,
  res: Response<GradeableStudents>
) {
  const destination = req.query;
  assertGradesDestination(destination);
  await checkDestination(req, destination);

  const sokResultat = await getLadokResults(destination);
  const response = sokResultat.Resultat.map((content) => {
    const result: GradeableStudents[number] = {
      id: content.Student.Uid,
    };

    if (content.ResultatPaUtbildningar) {
      const arbetsunderlag = content.ResultatPaUtbildningar.find(
        (rpu) => rpu.Arbetsunderlag
      )?.Arbetsunderlag;

      if (arbetsunderlag) {
        const grade = arbetsunderlag.Betygsgradobjekt.Kod;
        const examinationDate = arbetsunderlag.Examinationsdatum;

        result.draft = { grade, examinationDate };
      }
    }

    return result;
  });

  res.json(response);
}
