import { useMutation } from "react-query";
import {
  GradesDestination,
  PostLadokGradesInput,
  PostLadokGradesOutput,
} from "t2l-backend";
import { ApiError } from "../utils/errors";
import {
  convertToApiInput,
  RowBefore,
  processApiOutput,
  RowAfter,
} from "../utils/getResultsToBeTransferred";

export interface SendGradesInput {
  results: RowBefore[];
  destination: GradesDestination;
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
  const endpoint = `/transfer-to-ladok/api/courses/${courseId}/ladok-grades`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  try {
    const body = await response.json();

    if (response.status === 200) {
      return body as PostLadokGradesOutput;
    }

    throw new ApiError(`POST ${endpoint}`, response, body);
  } catch (err) {
    // No way to parse the error message from the API
    throw new ApiError(`POST ${endpoint}`, response);
  }
}

export function useSendGrades() {
  return useMutation<RowAfter[], unknown, SendGradesInput>(
    async ({ destination, results }) => {
      const output = await apiSendResults(
        convertToApiInput(destination, results)
      );

      return processApiOutput(results, output);
    }
  );
}
