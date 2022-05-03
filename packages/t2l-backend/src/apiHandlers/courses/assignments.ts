import { CanvasApiError } from "@kth/canvas-api";
import { Request, Response } from "express";
import { EndpointError } from "../../error";
import CanvasClient from "../../externalApis/canvasApi";

/** Object returned by the API */
export type ResponseBody = {
  id: string;
  name: string;
  gradingType: "gpa_scale" | "points" | "letter_grade";
  dueAt: string | null;
  unlockAt: string | null;
  lockAt: string | null;
}[];

/**
 */
export default async function assignmentsHandler(
  req: Request<{ courseId: string }>,
  res: Response<ResponseBody>
) {
  const canvasApi = new CanvasClient(req);
  const courseId = req.params.courseId;

  const allAssignments = await canvasApi
    .getAssignments(courseId)
    .catch((err) => {
      if (err instanceof CanvasApiError && err.code === 401) {
        throw new EndpointError(
          "Invalid canvas access token",
          "not_authorized"
        );
      }

      throw err;
    });

  res.json(
    allAssignments.map((assignment) => ({
      id: assignment.id.toString(10),
      name: assignment.name,
      gradingType: assignment.grading_type,
      dueAt: assignment.due_at,
      unlockAt: assignment.unlock_at,
      lockAt: assignment.lock_at,
    }))
  );
}
