import * as React from "react";
import { ErrorBoundary } from "react-error-boundary";
import { QueryClient, QueryClientProvider } from "react-query";
import FullPageError from "./components/FullPageError";
import { useSections } from "./hooks/apiClient";

const queryClient = new QueryClient();

function Home() {
  const courseId = new URLSearchParams(location.search).get("courseId");
  const query = useSections(courseId);

  if (query.status === "loading") {
    return <div>loading...</div>;
  }

  if (query.status === "unauthenticated") {
    return <div>You are not logged in</div>;
  }

  if (query.status === "error") {
    throw query.error;
  }

  return <div>loaded!!!</div>;
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
