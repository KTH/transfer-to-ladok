import { useMutation } from "react-query";
import { PostLadokGradesInput, PostLadokGradesOutput } from "t2l-backend";
import { ApiError } from "../utils/errors";

function getCourseId() {
  const courseId = new URLSearchParams(location.search).get("courseId");

  if (!courseId) {
    throw new Error("No course ID!");
  }

  return courseId;
}

/**
 * Transfer grades to Ladok by performing a POST request to /ladok-grades endpoint
 * @param input The grades to be transferred
 * @returns the result of the transfer
 */
async function apiPostLadokGrades(
  input: PostLadokGradesInput
): Promise<PostLadokGradesOutput> {
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

export function useTransferResults() {
  return useMutation<PostLadokGradesOutput, unknown, PostLadokGradesInput>(
    (input) => apiPostLadokGrades(input)
  );
}
