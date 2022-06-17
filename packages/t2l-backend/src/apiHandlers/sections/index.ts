import { Request, Response } from "express";
import CanvasClient from "../../externalApis/canvasApi";
import {
  getExtraAktInformation,
  getExtraKurInformation,
  splitSections,
} from "../utils/commons";
import type { Sections } from "../utils/types";

/**
 * Get the sections in a given Canvas `courseId`
 *
 * Return information about the sections, separated by type (are they linked
 * with an aktivitetstillfälle or a kurstillfälle?).
 *
 * Sections not linked with any aktivitetstillfälle or kurstillfälle will not
 * be included in the response.
 *
 * @see {@link Sections} to see how the response looks like
 */
export default async function sectionsHandler(
  req: Request<{ courseId: string }>,
  res: Response<Sections>
) {
  const canvasApi = new CanvasClient(req);
  const courseId = req.params.courseId;
  const allSections = await canvasApi.getSections(courseId);
  const { aktivitetstillfalleIds, kurstillfalleIds } =
    splitSections(allSections);

  const aktivitetstillfalle = await Promise.all(
    aktivitetstillfalleIds.map(getExtraAktInformation)
  );

  const kurstillfalle = await Promise.all(
    kurstillfalleIds.map(getExtraKurInformation)
  );

  res.json({
    aktivitetstillfalle,
    kurstillfalle,
  });
}
