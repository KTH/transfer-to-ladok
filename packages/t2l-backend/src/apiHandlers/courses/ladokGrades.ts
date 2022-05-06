import { Request, Response } from "express";
import assert from "node:assert/strict";
import CanvasClient, { CanvasSection } from "../../externalApis/canvasApi";
import {
  getExtraKurInformation,
  getAllStudieresultat,
  splitSections,
} from "./utils/commons";
import type {
  GradesDestination,
  GradeableStudents,
  ResultOutput,
  GradeResult,
  PostLadokGradesOutput,
} from "./utils/types";
import { BadRequestError, UnprocessableEntityError } from "../../error";
import {
  assertGradesDestination,
  assertPostLadokGradesInput,
  isLadokError,
} from "./utils/asserts";
import {
  createResult,
  getBetyg,
  Studieresultat,
  updateResult,
  Resultat,
} from "../../externalApis/ladokApi";
import log from "skog";
import { HTTPError } from "got/dist/source";

/** Checks if the given `utbildningsinstans` belongs to the given `kurstillfalle` */
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
        const grade = arbetsunderlag.Betygsgradsobjekt.Kod;
        const examinationDate = arbetsunderlag.Examinationsdatum;

        result.draft = { grade, examinationDate };
      }
    }

    return result;
  });

  res.json(response);
}

/** Given a list of `studieResultat`, get the one that belongs to a given `student` */
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

/** Returns the Ladok scale ID and grade ID of a given letter grade in a Studieresultat */
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

/** Gets the draft in a Studieresultat */
function getExistingDraft(studentResultat: Studieresultat) {
  const arbetsunderlag = studentResultat.ResultatPaUtbildningar?.find(
    (rpu) => rpu.Arbetsunderlag
  )?.Arbetsunderlag;

  return arbetsunderlag;
}

function errorHandler(
  err: unknown,
  context: GradeResult
): ResultOutput["error"] {
  if (err instanceof HTTPError) {
    const body = err.response.body;

    if (isLadokError(body)) {
      switch (body.Meddelande) {
        default:
          log.error(
            { err: body },
            `Error from Ladok [${body.Meddelande}] when trying to set grade [${context.draft.grade}] to student [${context.id}]`
          );

          return {
            code: "unprocessed_ladok_error",
            message: body.Meddelande,
          };
      }
    }

    log.error(
      err,
      `Error from Ladok [${err.message}] when trying to set grade [${context.draft.grade}] to student [${context.id}]`
    );

    return {
      code: "unknown_ladok_error",
      message: "Unknown problem in Ladok. Please try again later",
    };
  }

  log.fatal(
    `Error from Ladok when trying to set grade [${context.draft.grade}] to student [${context.id}]. The function did not throw an error object`
  );

  // Unknown error
  return {
    code: "unknown_error",
    message: "Unknown error. Please try again later",
  };
}

export async function postGradesHandler(
  req: Request<{ courseId: string }>,
  res: Response<PostLadokGradesOutput>
) {
  assertPostLadokGradesInput(req.body);

  const courseId = req.params.courseId;
  const canvasClient = new CanvasClient(req);
  const sections = await canvasClient.getSections(courseId);
  await checkDestinationInSections(req.body.destination, sections);

  const allStudieresultat = await getAllStudieresultat(req.body.destination);
  const resultOutput: ResultOutput[] = [];

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
        resultOutput.push({
          id: resultInput.id,
          draft: resultInput.draft,
          status: "success",
        });
        log.info(
          {
            student: resultInput.id,
            studieresultat: oneStudieResultat.Uid,
            grade: resultInput.draft.grade,
            examinationDate: resultInput.draft.examinationDate,
          },
          "Updated grade!"
        );
      } else {
        await createResult(
          oneStudieResultat.Uid,
          oneStudieResultat.Rapporteringskontext.UtbildningsinstansUID,
          {
            Betygsgrad: gradeId,
            BetygsskalaID: scaleId,
            Examinationsdatum: resultInput.draft.examinationDate,
          }
        );

        resultOutput.push({
          id: resultInput.id,
          draft: resultInput.draft,
          status: "success",
        });
        log.info(
          {
            student: resultInput.id,
            studieresultat: oneStudieResultat.Uid,
            grade: resultInput.draft.grade,
            examinationDate: resultInput.draft.examinationDate,
          },
          "Created grade!"
        );
      }
    } catch (err) {
      resultOutput.push({
        id: resultInput.id,
        draft: resultInput.draft,
        status: "error",
        error: errorHandler(err, resultInput),
      });
    }
  }

  const summary = {
    success: resultOutput.filter((r) => r.status === "success").length,
    error: resultOutput.filter((r) => r.status === "error").length,
  };

  res.send({
    summary,
    results: resultOutput,
  });
}
