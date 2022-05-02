import { Request, Response } from "express";
import getLadokResults, { GradesDestination } from "./utils";

interface BodyParams {
  destination: GradesDestination;
  results: {
    studentUID: string;
    grade: string;
    examinationDate: string;
  }[];
}

export default async function postGradesHandler(
  req: Request<{ courseId: string }, any, BodyParams>,
  res
) {
  const { destination, results } = req.body;
  const ladokResults = await getLadokResults(destination, "");

  for (const result of results) {
    // Check that grade exists in ladokResults
    // Check that user has permissions to report grades
    // Convert "grade" into correct ID
    // Send to Ladok as create or update
    const ladokResult = ladokResults.find(
      (ladokResult) => ladokResult.studentUID === result.studentUID
    );
  }
}
