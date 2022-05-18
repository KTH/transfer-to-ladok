/** Hooks that call the API Client */
import { useQuery } from "react-query";
import {
  Assignments,
  GradeableStudents,
  GradesDestination,
  Sections,
} from "t2l-backend";

export class ApiError extends Error {
  code: string;

  constructor(message: string, code: string) {
    super(message);
    this.code = code;
  }
}

async function apiFetch(endpoint: string) {
  const response = await fetch(endpoint);

  try {
    const body = await response.json();

    if (response.status === 200) {
      return body;
    }

    throw new ApiError(body.message, body.code);
  } catch (err) {
    // No way to parse the error message from the API
    throw err;
  }
}

interface SectionsQuery {
  sections: Sections | null;
  error: unknown;
  status: "loading" | "error" | "success" | "idle" | "unauthenticated";
}

export function useSections(courseId: string): SectionsQuery {
  const query = useQuery<Sections>(
    ["sections", courseId],
    () => apiFetch(`/transfer-to-ladok/api/courses/${courseId}/sections`),
    {
      retry(failureCount: number, error: unknown) {
        if (error instanceof ApiError && error.code === "unauthorized") {
          return false;
        }
        if (failureCount > 3) {
          return false;
        }

        return true;
      },
    }
  );

  if (query.isError) {
    if (
      query.error instanceof ApiError &&
      query.error.code === "unauthorized"
    ) {
      return {
        status: "unauthenticated",
        sections: null,
        error: null,
      };
    } else {
      return {
        status: "error",
        sections: null,
        error: query.error,
      };
    }
  }

  return {
    status: query.status,
    sections: query.data,
    error: query.error,
  };
}

export function useAssignments(courseId: string) {
  return useQuery<Assignments>(["assignments", courseId], () =>
    apiFetch(`/transfer-to-ladok/api/courses/${courseId}/assignments`)
  );
}

export function useGradeableStudents(
  courseId: string,
  destination: GradesDestination
) {
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
