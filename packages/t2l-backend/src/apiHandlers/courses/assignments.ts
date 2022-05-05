import { Request, Response } from "express";
import CanvasClient from "../../externalApis/canvasApi";
import { Assignments } from "./utils/types";

export default async function assignmentsHandler(
  req: Request<{ courseId: string }>,
  res: Response<Assignments>
) {
  const canvasApi = new CanvasClient(req);
  const courseId = req.params.courseId;
  const allAssignments = await canvasApi.getAssignments(courseId);

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
