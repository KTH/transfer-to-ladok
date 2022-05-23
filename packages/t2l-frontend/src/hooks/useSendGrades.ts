import { useMutation } from "react-query";
import {
  GradesDestination,
  PostLadokGradesInput,
  PostLadokGradesOutput,
} from "t2l-backend/src/types";
import {
  convertToApiInput,
  PreviewTableRow,
  processApiOutput,
  TransferredTableRow,
} from "../utils/getResultsToBeTransferred";

export interface SendGradesInput {
  results: PreviewTableRow[];
  destination: GradesDestination;
}

export class ApiError extends Error {
  code: string;

  constructor(message: string, code: string) {
    super(message);
    this.code = code;
  }
}

function getCourseId() {
  const courseId = new URLSearchParams(location.search).get("courseId");

  if (!courseId) {
    throw new Error("No course ID!");
  }

  return courseId;
}

async function apiSendResults(input: PostLadokGradesInput) {
  const courseId = getCourseId();

  const response = await fetch(
    `/transfer-to-ladok/api/courses/${courseId}/ladok-grades`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    }
  );

  try {
    const body = await response.json();

    if (response.status === 200) {
      return body as PostLadokGradesOutput;
    }

    throw new ApiError(body.message, body.code);
  } catch (err) {
    // No way to parse the error message from the API
    throw err;
  }
}

export function useSendGrades() {
  return useMutation<TransferredTableRow[], unknown, SendGradesInput>(
    async ({ destination, results }) => {
      const output = await apiSendResults(
        convertToApiInput(destination, results)
      );

      return processApiOutput(results, output);
    }
  );
}
