import { Request, Response } from "express";
import CanvasClient from "../externalApis/canvasApi";
import type { Columns } from "./utils/types";
/**
 * HTTP request: `GET /courses/:courseId/assignments`
 * Get the assignments in a given Canvas `:courseId`
 *
 * @see {@link Columns} to see how the response looks like
 */
export default async function columnsHandler(
  req: Request<{ courseId: string }>,
  res: Response<Columns>
) {
  const canvasApi = new CanvasClient(req);
  const courseId = req.params.courseId;

  const canvasCourse = await canvasApi.getCourse(courseId);
  const allAssignments = await canvasApi.getAssignments(courseId);

  res.json({
    finalGrades: {
      hasLetterGrade: canvasCourse.grading_standard_id !== null,
    },
    assignments: allAssignments.map((assignment) => ({
      id: assignment.id.toString(10),
      name: assignment.name,
      gradingType: assignment.grading_type,
      dueAt: assignment.due_at,
      unlockAt: assignment.unlock_at,
      published: assignment.published,
      lockAt: assignment.lock_at,
      hasSubmissions: assignment.has_submitted_submissions,
    })),
  });
}
