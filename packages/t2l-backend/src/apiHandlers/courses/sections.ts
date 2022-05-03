import { CanvasApiError } from "@kth/canvas-api";
import { Request, Response } from "express";
import { EndpointError } from "../../error";
import CanvasClient from "../../externalApis/canvasApi";
import { getAktivitetstillfalle } from "../../externalApis/ladokApi";
import {
  completeKurstillfalle,
  getUniqueAktivitetstillfalleIds,
  getUniqueKurstillfalleIds,
} from "./utils";
import type { AktSection, Sections } from "./types";

/** Given an Aktivitetstillfalle UID, get extra information from Ladok */
async function completeAktivitetstillfalleInformation(
  uid: string
): Promise<AktSection> {
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
  const allSections = await canvasApi.getSections(courseId).catch((err) => {
    if (err instanceof CanvasApiError && err.code === 401) {
      throw new EndpointError("Invalid canvas access token", "not_authorized");
    }

    throw err;
  });

  const aktivitetstillfalle = await Promise.all(
    getUniqueAktivitetstillfalleIds(allSections).map(
      completeAktivitetstillfalleInformation
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
