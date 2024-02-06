import { useMutation } from "react-query";
import {
  PostLadokGradesInput,
  PostLadokGradesOutput,
  ResultOutput,
} from "t2l-backend";
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

function createPaginatedInputs(
  userSelection: UserSelection,
  grades: GradeWithStatus[]
): PostLadokGradesInput[] {
  // TODO: implement split
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
  return [input];
}

export function useTransfer(userSelection: UserSelection | null) {
  return useMutation<GradeWithStatus[], unknown, GradeWithStatus[]>(
    async (grades) => {
      if (!userSelection || !userSelection.destination) {
        return [];
      }

      const outputs = await Promise.all(
        createPaginatedInputs(userSelection, grades).map((input) =>
          apiPostLadokGrades(input)
        )
      );

      // join the outputs into one output
      const output = {
        summary: {
          success: outputs.reduce(
            (accumulator, output) => accumulator + output.summary.success,
            0
          ),
          error: outputs.reduce(
            (accumulator, output) => accumulator + output.summary.error,
            0
          ),
        },
        results: outputs.reduce(
          (accumulator, output) => [...accumulator, ...output.results],
          [] as ResultOutput[]
        ),
      };

      debugger;
      return getTransferenceOutcome(grades, output);
    }
  );
}
