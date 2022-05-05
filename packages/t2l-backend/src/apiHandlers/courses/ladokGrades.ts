import { Request, Response } from "express";
import assert from "node:assert/strict";
import CanvasClient, { CanvasSection } from "../../externalApis/canvasApi";
import {
  getExtraKurInformation,
  getLadokResults,
  splitSections,
} from "./utils/commons";
import type {
  GradesDestination,
  GradeableStudents,
  GradeResult,
} from "./utils/types";
import { BadRequestError, UnprocessableEntityError } from "../../error";
import {
  assertGradesDestination,
  assertPostLadokGradesInput,
} from "./utils/asserts";
import {
  createResult,
  getBetyg,
  SokResultat,
  updateResult,
} from "../../externalApis/ladokApi";

async function validateUtbildningsinstans(
  kurstillfalleUID: string,
  utbildningsinstansUID: string
) {
  const { utbildningsinstans, modules } = await getExtraKurInformation(
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

/** Checks if the destination exists in a given list of sections */
async function checkDestinationInSections(
  destination: GradesDestination,
  sections: CanvasSection[]
) {
  const { aktivitetstillfalleIds, kurstillfalleIds } = splitSections(sections);

  if ("aktivitetstillfalle" in destination) {
    assert(
      aktivitetstillfalleIds.includes(destination.aktivitetstillfalle),
      new UnprocessableEntityError(
        "Provided [aktivitetstillfalle] doesn't exist in examroom"
      )
    );
  } else {
    const { kurstillfalle, utbildningsinstans } = destination;
    assert(
      kurstillfalleIds.includes(kurstillfalle),
      new UnprocessableEntityError(
        "Provided [kurstillfalle] doesn't exist in courseroom"
      )
    );

    await validateUtbildningsinstans(kurstillfalle, utbildningsinstans);
  }
}

export async function getGradesHandler(
  req: Request<{ courseId: string }>,
  res: Response<GradeableStudents>
) {
  assertGradesDestination(req.query, BadRequestError);

  const courseId = req.params.courseId;
  const canvasClient = new CanvasClient(req);
  const sections = await canvasClient.getSections(courseId);

  await checkDestinationInSections(req.query, sections);

  const sokResultat = await getLadokResults(req.query);
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

async function postOneResult(
  sokResultat: SokResultat,
  req: Request<unknown>,
  newGrade: GradeResult
) {
  const student = sokResultat.Resultat.find(
    (r) => r.Student.Uid === newGrade.id
  );

  if (!student) {
    throw new UnprocessableEntityError(
      `Student with id ${newGrade.id} doesn't exist in destination`
    );
  }

  // TODO: check that you have permissions

  const scale = student.Rapporteringskontext.BetygsskalaID;
  const gradeID = getBetyg(scale).find(
    (b) => b.Kod === newGrade.draft.grade
  )?.ID;

  if (!gradeID) {
    throw new UnprocessableEntityError(
      `You cannot set grade ${newGrade.draft.grade} for student ${newGrade.id}`
    );
  }

  const arbetsunderlag = student.ResultatPaUtbildningar?.find(
    (rpu) => rpu.Arbetsunderlag
  )?.Arbetsunderlag;

  if (arbetsunderlag) {
    // Update result
    await updateResult(arbetsunderlag.Uid, {
      BetygsskalaID: scale,
      Betygsgrad: gradeID,
      Examinationsdatum: newGrade.draft.examinationDate,
    });
  } else {
    // Create result
    await createResult(
      student.Uid,
      student.Rapporteringskontext.UtbildningsinstansUID,
      {
        BetygsskalaID: scale,
        Betygsgrad: gradeID,
        Examinationsdatum: newGrade.draft.examinationDate,
      }
    );
  }
}

export async function postGradesHandler(
  req: Request<{ courseId: string }>,
  res: Response<{}>
) {
  assertPostLadokGradesInput(req.body);

  const courseId = req.params.courseId;
  const canvasClient = new CanvasClient(req);
  const sections = await canvasClient.getSections(courseId);
  await checkDestinationInSections(req.body.destination, sections);

  const sokResultat = await getLadokResults(req.body.destination);

  const response = [];
  for (const result of req.body.results) {
    response.push(await postOneResult(sokResultat, req, result));
  }

  res.send(response);
}
