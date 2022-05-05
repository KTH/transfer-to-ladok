import { Request, Response } from "express";
import assert from "node:assert/strict";
import CanvasClient, { CanvasSection } from "../../externalApis/canvasApi";
import {
  getExtraKurInformation,
  getAllStudieresultat,
  splitSections,
} from "./utils/commons";
import type { GradesDestination, GradeableStudents } from "./utils/types";
import { BadRequestError, UnprocessableEntityError } from "../../error";
import {
  assertGradesDestination,
  assertPostLadokGradesInput,
} from "./utils/asserts";
import {
  createResult,
  getBetyg,
  Studieresultat,
  updateResult,
  Resultat,
} from "../../externalApis/ladokApi";

async function checkUtbildningsinstansInKurstillfalle(
  utbildningsinstansUID: string,
  kurstillfalleUID: string
) {
  const { utbildningsinstans, modules } = await getExtraKurInformation(
    kurstillfalleUID
  );

  const isFinalGrade = utbildningsinstans === utbildningsinstansUID;
  const isModule = modules.some(
    (m) => m.utbildningsinstans === utbildningsinstansUID
  );

  assert(
    isFinalGrade || isModule,
    new UnprocessableEntityError(
      `Provided utbildningsinstans [${utbildningsinstansUID}] doesn't refer to a module or the final grade of the kurstillfälle [${kurstillfalleUID}]`
    )
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
        `Provided aktivitetstillfalle [${destination.aktivitetstillfalle}] doesn't exist in examroom`
      )
    );
  } else {
    const { kurstillfalle, utbildningsinstans } = destination;
    assert(
      kurstillfalleIds.includes(kurstillfalle),
      new UnprocessableEntityError(
        `Provided kurstillfalle [${destination.kurstillfalle}] doesn't exist in courseroom`
      )
    );

    await checkUtbildningsinstansInKurstillfalle(
      utbildningsinstans,
      kurstillfalle
    );
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

  const studieResultat = await getAllStudieresultat(req.query);
  const response = studieResultat.map((content) => {
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

function getStudentsStudieresultat(
  studentId: string,
  sokResultat: Studieresultat[]
) {
  const r = sokResultat.find((r) => r.Student.Uid === studentId);

  if (!r) {
    throw new Error(`Student [${studentId}] cannot have results`);
  }

  return r;
}

function getLadokGradeIds(
  letterGrade: string,
  studentResultat: Studieresultat
) {
  const scaleId = studentResultat.Rapporteringskontext.BetygsskalaID;
  const gradeId = getBetyg(scaleId).find((b) => b.Kod === letterGrade)?.ID;

  if (!gradeId) {
    throw new Error(
      `You cannot set grade [${letterGrade}] for student ${studentResultat.Student.Uid}`
    );
  }

  return { scaleId, gradeId };
}

function getExistingDraft(studentResultat: Studieresultat) {
  const arbetsunderlag = studentResultat.ResultatPaUtbildningar?.find(
    (rpu) => rpu.Arbetsunderlag
  )?.Arbetsunderlag;

  return arbetsunderlag;
}

async function createLadokResult(
  oneStudieResultat: Studieresultat,
  newValue: Resultat
) {
  return createResult(
    oneStudieResultat.Uid,
    oneStudieResultat.Rapporteringskontext.UtbildningsinstansUID,
    newValue
  );
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

  const allStudieresultat = await getAllStudieresultat(req.body.destination);

  // const response = [];
  for (const resultInput of req.body.results) {
    try {
      const oneStudieResultat = getStudentsStudieresultat(
        resultInput.id,
        allStudieresultat
      );
      const { gradeId, scaleId } = getLadokGradeIds(
        resultInput.draft.grade,
        oneStudieResultat
      );

      const draft = getExistingDraft(oneStudieResultat);
      if (draft) {
        await updateResult(draft.Uid, {
          Betygsgrad: gradeId,
          BetygsskalaID: scaleId,
          Examinationsdatum: resultInput.draft.examinationDate,
        });
      } else {
        await createLadokResult(oneStudieResultat, {
          Betygsgrad: gradeId,
          BetygsskalaID: scaleId,
          Examinationsdatum: resultInput.draft.examinationDate,
        });
      }
    } catch (err) {}
    // response.push(await postOneResult(sokResultat, result));
  }

  // res.send(response);
}
