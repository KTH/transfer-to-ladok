import * as React from "react";
import { ErrorBoundary } from "react-error-boundary";
import { QueryClient, QueryClientProvider } from "react-query";
import { ApiError, useSections } from "./hooks/apiClient";

import FullPageError from "./screens/FullPageError";
import Unauthenticated from "./screens/Unauthenticated";
import Authenticated from "./screens/Authenticated";

const queryClient = new QueryClient();

function Home() {
  const courseId = new URLSearchParams(location.search).get("courseId");

  if (!courseId) {
    throw new Error("No courseId provided");
  }

  const sectionsQuery = useSections(courseId);

  if (sectionsQuery.isLoading) {
    // Since the "loading" takes less than 1 second, we don't need to show any
    // spinner.
    //
    // Read more: https://www.nngroup.com/articles/response-times-3-important-limits/
    return <div></div>;
  }

  if (sectionsQuery.isError) {
    if (
      sectionsQuery.error instanceof ApiError &&
      sectionsQuery.error.code === "unauthorized"
    ) {
      return <Unauthenticated courseId={courseId} />;
    }

    throw sectionsQuery.error;
  }

  if (sectionsQuery.isSuccess) {
    return <Authenticated />;
  }

  // WTF
  return <div></div>;
}

export default function App() {
  return (
    <ErrorBoundary FallbackComponent={FullPageError}>
      <QueryClientProvider client={queryClient}>
        <Home />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
