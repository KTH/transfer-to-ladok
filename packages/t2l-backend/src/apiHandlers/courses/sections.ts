import { Request, Response } from "express";
import CanvasClient from "../../externalApis/canvasApi";
import { getAktivitetstillfalle } from "../../externalApis/ladokApi";
import {
  completeKurstillfalle,
  getUniqueAktivitetstillfalleIds,
  getUniqueKurstillfalleIds,
} from "./utils/commons";
import type { AktSection, Sections } from "./utils/types";

/** Given an Aktivitetstillfalle UID, get extra information from Ladok */
async function completeAktivitetstillfalle(uid: string): Promise<AktSection> {
  const ladokAkt = await getAktivitetstillfalle(uid);
  const codes = ladokAkt.Aktiviteter.map(
    (a) =>
      `${a.Kursinstans.Utbildningskod} ${a.Utbildningsinstans.Utbildningskod}`
  );
  const date = ladokAkt.Datumperiod.Startdatum;
  const name = codes.join(" & ") + " - " + date;

  return {
    id: uid,
    name,
  };
}

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
    getUniqueAktivitetstillfalleIds(allSections).map(
      completeAktivitetstillfalle
    )
  );

  const kurstillfalle = await Promise.all(
    getUniqueKurstillfalleIds(allSections).map(completeKurstillfalle)
  );

  res.json({
    aktivitetstillfalle,
    kurstillfalle,
  });
}
