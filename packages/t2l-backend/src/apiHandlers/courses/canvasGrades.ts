import { Request, Response } from "express";
import CanvasClient from "../../externalApis/canvasApi";
import { CanvasGrades } from "./utils/types";

/**
 * HTTP request: `GET /courses/:courseId/assignments/:assignmentId`
 * Get the grades given a Canvas `:courseId` and `:assignmentId`
 *
 * @see {@link CanvasGrades} to see how the response looks like
 */
export async function assignmentGradesHandler(
  req: Request<{ courseId: string; assignmentId: string }>,
  res: Response<CanvasGrades>
) {
  const canvasApi = new CanvasClient(req);
  const courseId = req.params.courseId;
  const assignmentId = req.params.assignmentId;
  const submissions = await canvasApi.getSubmissions(courseId, assignmentId);

  res.json(
    submissions.map((s) => ({
      id: s.user.integration_id,
      grade: s.grade,
      gradedAt: s.graded_at,
      submittedAt: s.submitted_at,
    }))
  );
}

/**
 * HTTP request: `GET /courses/:courseId/grades`
 * Get the final grades ("summa kolumnen") given a Canvas `:courseId`
 *
 * @see {@link CanvasGrades} to see how the response looks like
 */
export async function courseGradesHandler(
  req: Request<{ courseId: string }>,
  res: Response<CanvasGrades>
) {
  const canvasApi = new CanvasClient(req);
  const courseId = req.params.courseId;
  const enrollments = await canvasApi.getFinalGrades(courseId);

  res.json(
    enrollments.map((e) => ({
      id: e.user.integration_id,
      grade: e.grades?.unposted_current_grade,
      gradedAt: null,
      submittedAt: null,
    }))
  );
}
