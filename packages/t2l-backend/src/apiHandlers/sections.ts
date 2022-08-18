import { Request, Response } from "express";
import CanvasClient from "../externalApis/canvasApi";
import { splitSections } from "./utils/commons";
import log from "skog";
import type {
  AktivitetstillfalleSection,
  KurstillfalleSection,
  Sections,
} from "./utils/types";
import {
  Aktivitetstillfalle,
  getAktivitetstillfalle,
  getKurstillfalleStructure,
  Kurstillfalle,
} from "../externalApis/ladokApi";
import { defaultClient, TelemetryClient } from "applicationinsights";

export function formatAktivitetstillfalle(
  uid: string,
  ladokAkt: Aktivitetstillfalle
): AktivitetstillfalleSection {
  const codes = ladokAkt.Aktiviteter.map(
    (a) =>
      `${a.Kursinstans.Utbildningskod} ${a.Utbildningsinstans.Utbildningskod}`
  );
  const date = ladokAkt.Datumperiod.Startdatum;
  const name = codes.join(" & ") + " - " + date;

  return {
    id: uid,
    name,
    date,
  };
}

/**
 * Given an Kurstillfälle UID, returns information about the kurstillfälle in Ladok
 */
export function formatKurstillfalle(
  uid: string,
  ladokKur: Kurstillfalle
): KurstillfalleSection {
  return {
    id: uid,
    utbildningsinstans: ladokKur.UtbildningsinstansUID,
    courseCode: ladokKur.Utbildningskod,
    roundCode: ladokKur.Kurstillfalleskod,
    modules: ladokKur.IngaendeMoment.map((m) => ({
      utbildningsinstans: m.UtbildningsinstansUID,
      code: m.Utbildningskod,
      name: m.Benamning.sv,
    })),
  };
}

async function trackatracka(userId: number) {
  const tc = new TelemetryClient();
  log.info(`------- User ID: ${userId}`);
  tc.trackEvent({
    name: "Example",
    tagOverrides: {
      [defaultClient.context.keys.userAuthUserId]: "rick",
    },
  });
}

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
  // Enable these lines to use Application Insights!
  // const { id: userId } = await canvasApi.getSelf();
  // await trackatracka(userId);

  const courseId = req.params.courseId;
  const allSections = await canvasApi.getSections(courseId);
  const { aktivitetstillfalleIds, kurstillfalleIds } =
    splitSections(allSections);

  const aktivitetstillfalle = await Promise.all(
    aktivitetstillfalleIds.map(async (id) => {
      const akt = await getAktivitetstillfalle(id);

      return formatAktivitetstillfalle(id, akt);
    })
  );

  const kurstillfalle = await Promise.all(
    kurstillfalleIds.map(async (id) => {
      const k = await getKurstillfalleStructure(id);

      return formatKurstillfalle(id, k);
    })
  );

  res.json({
    aktivitetstillfalle,
    kurstillfalle,
  });
}
