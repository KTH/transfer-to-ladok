import { CanvasApiError } from "@kth/canvas-api";
import { Request, Response } from "express";
import { EndpointError } from "../../error";
import CanvasClient, { CanvasSection } from "../../externalApis/canvasApi";
import {
  getAktivitetstillfalle,
  getKurstillfalleStructure,
} from "../../externalApis/ladokApi";
import { getUniqueAktivitetstillfalleIds } from "./utils";

export interface ResponseBody {
  aktivitetstillfalle: {
    id: string;
    name: string;
  }[];
  kurstillfalle: {
    id: string;
    utbildningsinstansUID: string;
    name: string;
    modules: {
      utbildningsinstansUID: string;
      examCode: string;
      name: string;
    }[];
  }[];
}

/**
 * Given a list of CanvasSection, returns a list of unique UIDs when the
 * section refers to a kurstillfalle
 */
function getUniqueKurstillfalleIds(sections: CanvasSection[]): string[] {
  // Regex: AA0000VT211
  const KURSTILLFALLE_REGEX = /^\w{6,7}(HT|VT)\d{3}$/;

  const ids = sections
    .filter((s) => KURSTILLFALLE_REGEX.test(s.sis_section_id))
    .map((s) => s.integration_id);

  return Array.from(new Set(ids));
}

/** Given an Aktivitetstillfalle UID, get extra information from Ladok */
async function completeAktivitetstillfalleInformation(uid: string) {
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

/** Given an Kurstillfälle UID, get extra information from Ladok */
async function completeKurstillfalleInformation(uid: string) {
  const ladokKur = await getKurstillfalleStructure(uid);

  return {
    id: uid,
    utbildningsinstansUID: ladokKur.UtbildningsinstansUID,
    name: ladokKur.Kurstillfalleskod,
    modules: ladokKur.IngaendeMoment.map((m) => ({
      utbildningsinstansUID: m.UtbildningsinstansUID,
      examCode: m.Utbildningskod,
      name: m.Benamning.sv,
    })),
  };
}

/**
 * Return all sections in a canvas course room
 * - If the section is linked with a kurstillfälle in Ladok, this endpoint
 *   will also return all the modules in such kurstillfälle
 */
export default async function sectionsHandler(
  req: Request<{ courseId: string }>,
  res: Response<ResponseBody>
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
