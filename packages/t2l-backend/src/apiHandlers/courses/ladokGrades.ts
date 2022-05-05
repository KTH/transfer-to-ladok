import { Request, Response } from "express";
import CanvasClient, { CanvasSection } from "../../externalApis/canvasApi";
import {
  completeKurstillfalle,
  getLadokResults,
  getUniqueAktivitetstillfalleIds,
  getUniqueKurstillfalleIds,
} from "./utils";
import type { GradesDestination, GradeableStudents } from "./types";
import { BadRequestError, UnprocessableEntityError } from "../../error";
import { assertGradesDestination } from "./asserts";

function validateAktivitetstillfalle(
  sections: CanvasSection[],
  aktivitetstillfalleUID: string
) {
  if (
    !getUniqueAktivitetstillfalleIds(sections).includes(aktivitetstillfalleUID)
  ) {
    throw new UnprocessableEntityError(
      "Provided [aktivitetstillfalle] doesn't exist in examroom"
    );
  }
}

function validateKurstillfalle(
  sections: CanvasSection[],
  kurstillfalleUID: string
) {
  if (!getUniqueKurstillfalleIds(sections).includes(kurstillfalleUID)) {
    throw new UnprocessableEntityError(
      "Provided [kurstillfalle] doesn't exist in courseroom"
    );
  }
}

async function validateUtbildningsinstans(
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

  throw new UnprocessableEntityError(
    `Provided [utbildningsinstans] doesn't exist in [kurstillfalle]`
  );
}

async function validateGradesDestination(
  req: Request<{ courseId: string }>,
  destination: GradesDestination
) {
  const courseId = req.params.courseId;
  const canvasClient = new CanvasClient(req);
  const sections = await canvasClient.getSections(courseId);

  if ("aktivitetstillfalle" in destination) {
    validateAktivitetstillfalle(sections, destination.aktivitetstillfalle);
  } else {
    const { kurstillfalle, utbildningsinstans } = destination;
    validateKurstillfalle(sections, kurstillfalle);

    await validateUtbildningsinstans(kurstillfalle, utbildningsinstans);
  }
}

export async function getGradesHandler(
  req: Request<{ courseId: string }>,
  res: Response<GradeableStudents>
) {
  const destination = req.query;
  try {
    assertGradesDestination(destination);
  } catch (err) {
    if (err instanceof TypeError) {
      throw new BadRequestError(err.message);
    }
    throw err;
  }

  await validateGradesDestination(req, destination);

  const sokResultat = await getLadokResults(destination);
  const response = sokResultat.Resultat.map((content) => {
    const result: GradeableStudents[number] = {
      id: content.Student.Uid,
      scale: getBetyg(content.Rapporteringskontext.BetygsskalaID).map(
        (b) => b.Kod
      ),
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

export async function postGradesHandler(
  req: Request<{ courseId: string }>,
  res: Response<{}>
) {
  req.body;
}
