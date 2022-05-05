import { Request, Response } from "express";
import CanvasClient from "../../externalApis/canvasApi";
import {
  getExtraAktInformation,
  getExtraKurInformation,
  splitSections,
} from "./utils/commons";
import type { Sections } from "./utils/types";

/**
 * Return all sections in a canvas course room
 * - If the section is linked with a kurstillfälle in Ladok, this endpoint
 *   will also return all the modules in such kurstillfälle
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
