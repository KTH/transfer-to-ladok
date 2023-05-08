/** Hooks that call the API Client */
import { QueryClient, useQuery } from "react-query";
import {
  Columns,
  CanvasGrades,
  GradeableStudents,
  GradesDestination,
  Sections,
} from "t2l-backend";
import { ApiError } from "../utils/errors";

function getCourseId() {
  const courseId = new URLSearchParams(location.search).get("courseId");

  if (!courseId) {
    throw new Error("No course ID!");
  }

  return courseId;
}

async function apiFetch(endpoint: string) {
  const response = await fetch(endpoint);

  const body = await response.json().catch(() => {
    throw new ApiError(endpoint, response);
  });

  if (response.status === 200) {
    return body;
  }

  throw new ApiError(endpoint, response, body);
}

export async function prefetchAssignments(queryClient: QueryClient) {
  try {
    const courseId = getCourseId();
    await queryClient.prefetchQuery(["columns", courseId], () =>
      apiFetch(`/transfer-to-ladok/api/courses/${courseId}/columns`)
    );

    console.log("prefetch completed");
  } catch (err) {
    //
  }
}

export function useSections() {
  const courseId = getCourseId();

  return useQuery<Sections>(
    ["sections", courseId],
    () => apiFetch(`/transfer-to-ladok/api/courses/${courseId}/sections`),
    {
      retry(failureCount: number, error: unknown) {
        if (
          error instanceof ApiError &&
          (error.code === "unauthorized" || error.code === "forbidden")
        ) {
          return false;
        }
        if (failureCount > 3) {
          return false;
        }

        return true;
      },
    }
  );
}

export function useAssignments() {
  const courseId = getCourseId();

  return useQuery<Columns>(["columns", courseId], () =>
    apiFetch(`/transfer-to-ladok/api/courses/${courseId}/columns`)
  );
}

export function useGradeableStudents(destination: GradesDestination) {
  const courseId = getCourseId();

  return useQuery<GradeableStudents>(
    ["gradeable-students", courseId, destination],
    () => {
      if ("aktivitetstillfalle" in destination) {
        return apiFetch(
          `/transfer-to-ladok/api/courses/${courseId}/ladok-grades?aktivitetstillfalle=${destination.aktivitetstillfalle}`
        );
      } else {
        return apiFetch(
          `/transfer-to-ladok/api/courses/${courseId}/ladok-grades?kurstillfalle=${destination.kurstillfalle}&utbildningsinstans=${destination.utbildningsinstans}`
        );
      }
    }
  );
}

export function useCanvasGrades(assignmentId: string) {
  const courseId = getCourseId();

  return useQuery<CanvasGrades>(
    ["canvas-grades", courseId, assignmentId],
    () => {
      if (assignmentId === "") {
        return Promise.resolve([]);
      } else if (assignmentId === "total") {
        return apiFetch(`/transfer-to-ladok/api/courses/${courseId}/total`);
      } else {
        return apiFetch(
          `/transfer-to-ladok/api/courses/${courseId}/assignments/${assignmentId}`
        );
      }
    }
  );
}
