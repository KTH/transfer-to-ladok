/** Hooks that call the API Client */
import { useQuery } from "react-query";
import { T2LSections } from "../../../t2l-backend/src/apiHandlers/sections";
import { ErrorCode } from "../../../t2l-backend/src/error";

export class ApiError extends Error {
  code: ErrorCode;

  constructor(message: string, code: ErrorCode) {
    super(message);
    this.code = code;
  }
}

async function apiFetch(endpoint: string) {
  const response = await fetch(endpoint);

  try {
    const body = await response.json();

    if (response.status === 200) {
      return response.json();
    }

    throw new ApiError(body.message, body.code);
  } catch (err) {
    // No way to parse the error message from the API
    throw err;
  }
}

interface SectionsQuery {
  sections: T2LSections | null;
  error: unknown;
  status: "loading" | "error" | "success" | "idle" | "unauthenticated";
}

export function useSections(courseId: string): SectionsQuery {
  const query = useQuery<T2LSections>(
    ["sections", courseId],
    () => apiFetch(`/transfer-to-ladok/api/courses/${courseId}/sections`),
    {
      retry(failureCount: number, error: unknown) {
        if (error instanceof ApiError && error.code === "not_authorized") {
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
      query.error.code === "not_authorized"
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
