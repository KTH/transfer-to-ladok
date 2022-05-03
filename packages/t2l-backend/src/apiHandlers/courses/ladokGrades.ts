import { Request, Response } from "express";
import { createResult, updateResult } from "../../externalApis/ladokApi";
import { getLadokResults, GradesDestination, LadokResult } from "./utils";

interface BodyParams {
  destination: GradesDestination;
  results: {
    studentUID: string;
    grade: string;
    examinationDate: string;
  }[];
}

interface ResponseBody {
  summary: {
    success: number;
    error: number;
  };
  results: {
    studentUID: string;
    status: "success" | "error";
    error?: {
      code:
        | "non_existing_grade"
        | "unauthorized"
        | "incorrect_format"
        | "unknown_error";
    };
  }[];
}

export async function getGradesHandler(
  req: Request<{ courseId: string }, any, any, GradesDestination>,
  res: Response<LadokResult[]>
) {
  // TODO: check if the courseId matches with GradeDestination
  // TODO: get user LadokUID from session

  const ladokResults = await getLadokResults(req.body.destination, "");
  res.send(ladokResults);
}

export async function postGradesHandler(
  req: Request<{ courseId: string }, any, BodyParams>,
  res: Response<ResponseBody>
) {
  const { destination, results } = req.body;
  const ladokResults = await getLadokResults(destination, "");
  const response: ResponseBody["results"] = [];

  for (const result of results) {
    const ladokResult = ladokResults.find(
      (r) => r.studentUID === result.studentUID
    );
    if (!ladokResult) {
      response.push({
        studentUID: result.studentUID,
        status: "error",
        error: {
          code: "non_existing_grade",
        },
      });
      continue;
    }

    if (!ladokResult.hasPermission) {
      response.push({
        studentUID: result.studentUID,
        status: "error",
        error: {
          code: "unauthorized",
        },
      });
      continue;
    }

    if (ladokResult.resultatUID) {
      await updateResult(ladokResult.resultatUID, {
        // TODO: Convert "grade" into correct ID
        Betygsgrad: 0,
        BetygsskalaID: 0,
        Examinationsdatum: "",
      }).catch((err) => {
        // TODO
      });

      // TODO
    } else {
      await createResult(
        ladokResult.studieresultatUID,
        ladokResult.utbildningsinstansUID,
        {
          Betygsgrad: 0,
          BetygsskalaID: 0,
          Examinationsdatum: "",
        }
      );
    }
  }
}
