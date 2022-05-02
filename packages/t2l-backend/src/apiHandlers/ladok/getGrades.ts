import { Request, Response } from "express";
import getLadokResults, { GradesDestination, LadokResult } from "./utils";

export default async function getGradesHandler(
  req: Request<{ courseId: string }, any, any, GradesDestination>,
  res: Response<LadokResult[]>
) {
  // TODO: check if the courseId matches with GradeDestination
  // TODO: get user LadokUID from session

  const ladokResults = await getLadokResults(req.body.destination, "");
  res.send(ladokResults);
}
