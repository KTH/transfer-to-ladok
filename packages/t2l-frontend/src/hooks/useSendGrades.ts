import { useMutation } from "react-query";
import { PostLadokGradesInput, PostLadokGradesOutput } from "t2l-backend";
import { ApiError } from "../utils/errors";
import {
  GradeWithStatus,
  getTransferenceOutcome,
} from "../utils/mergeGradesList";
import { UserSelection } from "../screens/wizard/SelectionStep";

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

function splitInput(input: PostLadokGradesInput): PostLadokGradesInput[] {
  // TODO: implement split
  return [input];
}

export function useTransfer(userSelection: UserSelection | null) {
  return useMutation<GradeWithStatus[], unknown, GradeWithStatus[]>(
    async (grades) => {
      if (!userSelection || !userSelection.destination) {
        return [];
      }

      const input: PostLadokGradesInput = {
        destination: userSelection?.destination.value,
        results: grades
          .filter((g) => g.status === "ready")
          .map((g) => ({
            id: g.student.id,
            draft: {
              examinationDate: g.input?.examinationDate || "",
              grade: g.input?.grade || "",
            },
          })),
      };

      const output = await apiPostLadokGrades(input);

      return getTransferenceOutcome(grades, output);
    }
  );
}
