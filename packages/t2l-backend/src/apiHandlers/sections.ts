import { Request, Response } from "express";
import {
  getCanvasSections,
  Section as CanvasSection,
} from "../externalApis/canvasApi";
import { getAktivitetstillfalle } from "../externalApis/ladokApi";

/** Path parameters required by this handler */
interface PathParameters {
  courseId: string;
}

/** Object returned by the API */
interface T2LSections {
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
    };
  }[];
}

/**
 * Given a list of CanvasSection, return a list of unique UIDs when the
 * section refers to a aktivitetstillfalle.
 */
function getUniqueAktivitetstillfalleIds(sections: CanvasSection[]): string[] {
  // Regex: AKT.<<UID>>.<optional suffix>
  const AKTIVITETSTILLFALLE_REGEX = /^AKT\.([a-z0-9-]+)(\.\w+)?$/;

  const ids = sections
    .map((s) => AKTIVITETSTILLFALLE_REGEX.exec(s.sis_section_id)?.[1])
    .filter((id): id is string => id !== undefined);

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

export default async function sectionsHandler(
  req: Request<PathParameters>,
  res: Response<T2LSections>
) {
  const courseId = req.params.courseId;
  const allSections = await getCanvasSections(courseId);

  const aktivitetstillfalle = await Promise.all(
    getUniqueAktivitetstillfalleIds(allSections).map(
      completeAktivitetstillfalleInformation
    )
  );

  res.json({
    aktivitetstillfalle,
    kurstillfalle: [],
  });
}
