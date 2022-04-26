/** Hooks that call the API Client */
import { useQuery } from "react-query";
import { T2LSections } from "../../../t2l-backend/src/apiHandlers/sections";

class ApiError extends Error {
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
      return response.json();
    }

    throw new ApiError(body.message, body.code);
  } catch (err) {
    // No way to parse the error message from the API
    throw err;
  }
}

export function useSections(courseId: string) {
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
    throw query.error;
  }

  return query;
}
