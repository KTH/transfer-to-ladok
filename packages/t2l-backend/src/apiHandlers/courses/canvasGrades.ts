import { CanvasApiError } from "@kth/canvas-api";
import { Request, Response } from "express";
import { EndpointError } from "../../error";
import CanvasClient from "../../externalApis/canvasApi";
import { CanvasGrades } from "./types";

export async function assignmentGradesHandler(
  req: Request<{ courseId: string; assignmentId: string }>,
  res: Response<CanvasGrades>
) {
  const canvasApi = new CanvasClient(req);
  const courseId = req.params.courseId;
  const assignmentId = req.params.assignmentId;

  const submissions = await canvasApi
    .getSubmissions(courseId, assignmentId)
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
    submissions.map((s) => ({
      id: s.user.integration_id,
      grade: s.grade,
      gradedAt: s.graded_at,
      submittedAt: s.submitted_at,
    }))
  );
}

export async function courseGradesHandler(
  req: Request<{ courseId: string }>,
  res: Response<CanvasGrades>
) {
  const canvasApi = new CanvasClient(req);
  const courseId = req.params.courseId;

  const enrollments = await canvasApi.getFinalGrades(courseId).catch((err) => {
    if (err instanceof CanvasApiError && err.code === 401) {
      throw new EndpointError("Invalid canvas access token", "not_authorized");
    }

    throw err;
  });

  res.json(
    enrollments.map((e) => ({
      id: e.user.integration_id,
      grade: e.grades?.unposted_current_grade,
      gradedAt: null,
      submittedAt: null,
    }))
  );
}
