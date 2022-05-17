import { Request, Response } from "express";
import assert from "node:assert/strict";
import CanvasClient, { CanvasSection } from "../../externalApis/canvasApi";
import {
  getExtraKurInformation,
  getAllStudieresultat,
  splitSections,
  getExistingDraft,
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
} from "./utils/asserts";
import { getBetyg } from "../../externalApis/ladokApi";
import postOneResult from "./utils/postOneResult";

/** Checks if the given `utbildningsinstans` belongs to the given `kurstillfalle` */
async function checkUtbildningsinstansInKurstillfalle(
  utbildningsinstansUID: string,
  kurstillfalleUID: string
) {
  const ladokKurstillfalle = await getExtraKurInformation(kurstillfalleUID);

  const isFinalGrade =
    ladokKurstillfalle.utbildningsinstans === utbildningsinstansUID;
  const isModule = ladokKurstillfalle.modules.some(
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
async function assertDestinationInSections(
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

/**
 * HTTP request: `GET /courses/:courseId/ladok-grades`
 * Get a list of students that can have grades in a certain Ladok destination.
 * Such destination is defined in the request query
 * ({@link GradesDestination} to see its format)
 *
 * @see {@link GradeableStudents} to see how the response looks like
 */
export async function getGradesHandler(
  req: Request<{ courseId: string }>,
  res: Response<GradeableStudents>
) {
  assertGradesDestination(req.query, BadRequestError);

  const courseId = req.params.courseId;
  const canvasClient = new CanvasClient(req);
  const sections = await canvasClient.getSections(courseId);

  // TODO: send the error type as parameter as in `assertGradesDestination`
  await assertDestinationInSections(req.query, sections);

  const allStudieresultat = await getAllStudieresultat(req.query);
  const response = allStudieresultat.map((oneStudieresultat) => {
    const result: GradeableStudents[number] = {
      id: oneStudieresultat.Student.Uid,
      scale: getBetyg(oneStudieresultat.Rapporteringskontext.BetygsskalaID).map(
        (b) => b.Kod
      ),
    };

    const draft = getExistingDraft(oneStudieresultat);

    if (draft) {
      const grade = draft.Betygsgradsobjekt.Kod;
      const examinationDate = draft.Examinationsdatum;

      result.draft = { grade, examinationDate };
    }

    return result;
  });

  res.json(response);
}

export async function postGradesHandler(
  req: Request<{ courseId: string }>,
  res: Response<PostLadokGradesOutput>
) {
  assertPostLadokGradesInput(req.body);

  const courseId = req.params.courseId;
  const canvasClient = new CanvasClient(req);
  const sections = await canvasClient.getSections(courseId);
  await assertDestinationInSections(req.body.destination, sections);

  const allStudieresultat = await getAllStudieresultat(req.body.destination);
  const { email } = await canvasClient.getSelf();

  const output: ResultOutput[] = [];

  for (const resultInput of req.body.results) {
    await postOneResult(resultInput, email, allStudieresultat).then((o) => {
      output.push(o);
    });
  }

  const summary = {
    success: output.filter((r) => r.status === "success").length,
    error: output.filter((r) => r.status === "error").length,
  };

  res.send({
    summary,
    results: output,
  });
}
