import { Request, Response } from "express";
import assert from "node:assert/strict";
import CanvasClient, { CanvasSection } from "../externalApis/canvasApi";
import CanvasAdminClient from "../externalApis/canvasAdminApi";
import { checkPermissionProfile, splitSections } from "./utils/commons";
import type {
  GradesDestination,
  GradeableStudents,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  PostLadokGradesInput,
  PostLadokGradesOutput,
  ResultOutput,
  Transference,
} from "./utils/types";
import { UnprocessableEntityError } from "./error";
import {
  assertGradesDestination,
  assertPostLadokGradesInput,
} from "./utils/asserts";
import postOneResult from "./utils/postOneResult";
import { getKurstillfalleStructure } from "../externalApis/ladokApi";
import { insertTransference } from "../externalApis/mongo";
import log from "skog";
import { getGradingInformation } from "./utils/GradingInformation";

/** Checks if the given `utbildningsinstans` belongs to the given `kurstillfalle` */
async function checkUtbildningsinstansInKurstillfalle(
  utbildningsinstansUID: string,
  kurstillfalleUID: string
) {
  const ladokKurstillfalle = await getKurstillfalleStructure(kurstillfalleUID);
  assert(
    ladokKurstillfalle,
    new UnprocessableEntityError(
      `Kurstillfalle don't exist in Ladok: [${kurstillfalleUID}]`
    )
  );

  const isFinalGrade =
    ladokKurstillfalle.UtbildningsinstansUID === utbildningsinstansUID;
  const isModule = ladokKurstillfalle.IngaendeMoment.some(
    (m) => m.UtbildningsinstansUID === utbildningsinstansUID
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
  assertGradesDestination(destination);

  const courseId = req.params.courseId;
  const canvasAdminClient = new CanvasAdminClient();
  const canvasClient = new CanvasClient(req);
  const sections = await canvasClient.getSections(courseId);
  await checkDestinationInSections(destination, sections);

  const { id: userId } = await canvasClient.getSelf();
  const email = await canvasAdminClient.getUserLoginId(userId);
  await checkPermissionProfile(email);

  const gradingInformation = await getGradingInformation(destination, email, {
    readFromCache: false,
  });

  // We do a small runtime control to check that the data is correct
  const uniqueStudents = new Set(
    gradingInformation.map((g) => g.toObject().student.id)
  );

  if (uniqueStudents.size !== gradingInformation.length) {
    log.error(
      `Ladok returned duplicated students. [courseId=${courseId}] [total length: ${gradingInformation.length}] [unique students: ${uniqueStudents.size}]`
    );
  }

  res.json(gradingInformation.map((g) => g.toObject()));
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
  log.info(
    `Transferring ${req.body?.results?.length} grades from canvas course ${req?.params?.courseId}`
  );

  const courseId = req.params.courseId;
  const canvasClient = new CanvasClient(req);
  const canvasAdminClient = new CanvasAdminClient();
  const sections = await canvasClient.getSections(courseId);
  await checkDestinationInSections(req.body.destination, sections);

  const { id: userId } = await canvasClient.getSelf();
  const email = await canvasAdminClient.getUserLoginId(userId);
  await checkPermissionProfile(email);
  const gradingInformation = await getGradingInformation(
    req.body.destination,
    email,
    {
      readFromCache: true,
    }
  );

  const output: ResultOutput[] = [];
  const randomHash = () => Math.round(Math.random() * 100000);
  const transference: Transference = {
    parameters: {
      courseId,
      destination: req.body.destination,
    },
    user: {
      canvasId: userId,
      email,
    },
    results: [],
    summary: {
      success: 0,
      error: 0,
    },
    createdAt: new Date(),
    _id: `${new Date().toISOString()}_courseId:${courseId}_${randomHash()}`,
  };

  for (const resultInput of req.body.results) {
    await postOneResult(resultInput, gradingInformation).then((o) => {
      transference.results.push(o);
      output.push(o);
    });
  }

  const summary = {
    success: output.filter((r) => r.status === "success").length,
    error: output.filter((r) => r.status === "error").length,
  };

  transference.summary = summary;
  await insertTransference(transference);

  res.send({
    summary,
    results: output,
  });
}
