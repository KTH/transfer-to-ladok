import { Request, Response } from "express";
import CanvasClient from "../../externalApis/canvasApi";
import {
  getExtraAktInformation,
  getExtraKurInformation,
  getUniqueAktIds,
  getUniqueKurIds,
} from "./utils/commons";
import type { Sections } from "./utils/types";

/** Given an Aktivitetstillfalle UID, get extra information from Ladok */

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

  const aktivitetstillfalle = await Promise.all(
    getUniqueAktIds(allSections).map(getExtraAktInformation)
  );

  const kurstillfalle = await Promise.all(
    getUniqueKurIds(allSections).map(getExtraKurInformation)
  );

  res.json({
    aktivitetstillfalle,
    kurstillfalle,
  });
}
