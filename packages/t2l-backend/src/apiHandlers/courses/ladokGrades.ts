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
} from "./utils/asserts";
import { getBetyg } from "../../externalApis/ladokApi";
import postOneResult from "./utils/postOneResult";

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

/**
 * HTTP request: `GET /courses/:courseId/ladok-grades`
 * Get a list of students that can have grades in a certain destination.
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

  // TODO: use real email
  const email = "carsai@kth.se";
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
