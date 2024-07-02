import { Request, Response } from "express";
import CanvasClient from "../externalApis/canvasApi";
import {
  getAktivitetstillfalleParticipants,
  getKurstillfalleParticipants,
} from "../externalApis/ladokApi";
import { splitSections } from "./utils/commons";

/**
 * HTTP request: `/courses/:courseId/ladok-participants`
 *
 * Get a list of students that are enrolled in any kurstillfalle in Ladok
 * that maps to a section within the course-room :courseId
 */
export async function getParticipantsHandler(
  req: Request<{ courseId: string }>,
  res: Response<string[]>
) {
  const courseId = req.params.courseId;
  const canvasClient = new CanvasClient(req);
  const sections = await canvasClient.getSections(courseId);
  const { aktivitetstillfalleIds, kurstillfalleIds } = splitSections(sections);

  const participants = new Set<string>();

  if (kurstillfalleIds.length > 0) {
    const { Identitet } = await getKurstillfalleParticipants(kurstillfalleIds);
    for (const i of Identitet) {
      participants.add(i);
    }
  }

  if (aktivitetstillfalleIds.length > 0) {
    for (const id of aktivitetstillfalleIds) {
      const { Identitet } = await getAktivitetstillfalleParticipants(id);
      for (const i of Identitet) {
        participants.add(i);
      }
    }
  }

  return res.send(Array.from(participants));
}
