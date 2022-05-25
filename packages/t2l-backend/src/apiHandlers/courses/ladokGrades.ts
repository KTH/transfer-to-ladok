import { Request, Response } from "express";
import assert from "node:assert/strict";
import CanvasClient, { CanvasSection } from "../../externalApis/canvasApi";
import {
  getExtraKurInformation,
  getAllStudieresultat,
  splitSections,
  getAllPermissions,
  normalizeStudieresultat,
} from "./utils/commons";
import type {
  GradesDestination,
  GradeableStudents,
  PostLadokGradesOutput,
  ResultOutput,
} from "./utils/types";
import { BadRequestError, UnprocessableEntityError } from "../../error";
import {
  assertGradesDestination,
  assertPostLadokGradesInput,
} from "./utils/asserts";
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
  const destination = req.query;
  assertGradesDestination(destination, BadRequestError);

  const courseId = req.params.courseId;
  const canvasClient = new CanvasClient(req);
  const sections = await canvasClient.getSections(courseId);
  const { login_id: email } = await canvasClient.getSelf();

  // TODO: send the error type as parameter as in `assertGradesDestination`
  await assertDestinationInSections(destination, sections);

  const allStudieresultat = await getAllStudieresultat(destination);
  const allPermissions = await getAllPermissions(allStudieresultat, email);
  res.json(normalizeStudieresultat(allStudieresultat, allPermissions));
}

/**
 * HTTP request: `POST /courses/:courseId/ladok-grades`
 * Tries to send grades to Ladok to a given destination. Destination and grades
 * are passed as body ({@link PostLadokGradesInput} to see its format)
 *
 * @see {@link PostLadokGradesOutput} to see how the response looks like
 */
export async function postGradesHandler(
  req: Request<{ courseId: string }>,
  res: Response<PostLadokGradesOutput>
) {
  assertPostLadokGradesInput(req.body);

  const courseId = req.params.courseId;
  const canvasClient = new CanvasClient(req);
  const sections = await canvasClient.getSections(courseId);
  await assertDestinationInSections(req.body.destination, sections);

  const { login_id: email } = await canvasClient.getSelf();
  const allStudieresultat = await getAllStudieresultat(req.body.destination);
  const allPermissions = await getAllPermissions(allStudieresultat, email);

  const output: ResultOutput[] = [];

  for (const resultInput of req.body.results) {
    await postOneResult(resultInput, allStudieresultat, allPermissions).then(
      (o) => {
        output.push(o);
      }
    );
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
