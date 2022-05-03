import { CanvasApiError } from "@kth/canvas-api";
import { Request, Response } from "express";
import { EndpointError } from "../../error";
import CanvasClient from "../../externalApis/canvasApi";
import { getAktivitetstillfalle } from "../../externalApis/ladokApi";
import {
  completeKurstillfalleInformation,
  getUniqueAktivitetstillfalleIds,
  getUniqueKurstillfalleIds,
} from "./utils";
import type { AktSection, Sections } from "./types";

/** Given an Aktivitetstillfalle UID, get extra information from Ladok */
async function completeAktivitetstillfalleInformation(
  uid: string
): Promise<AktSection> {
  const ladokAkt = await getAktivitetstillfalle(uid);

  // Name format: cours+exam codes - exam date
  // Example: HF0025 TEN1 & ML0025 TEN1 - 2022-01-01

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
    getUniqueKurstillfalleIds(allSections).map(completeKurstillfalleInformation)
  );

  res.json({
    aktivitetstillfalle,
    kurstillfalle,
  });
}
