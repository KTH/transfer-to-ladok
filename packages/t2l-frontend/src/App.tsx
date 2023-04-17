import * as React from "react";
import { ErrorBoundary } from "react-error-boundary";
import { QueryClient, QueryClientProvider, focusManager } from "react-query";
import { prefetchAssignments, useSections } from "./hooks/apiClient";
import { ApiError } from "./utils/errors";

import FullPageError from "./screens/FullPageError";
import Unauthenticated from "./screens/Unauthenticated";
import Authenticated from "./screens/Authenticated";
import { InfoAlert } from "./components/Alert";

import "./App.scss";

const queryClient = new QueryClient();
focusManager.setEventListener(() => {
  console.log("X");
  return () => {};
});

prefetchAssignments(queryClient);

function Home() {
  const sectionsQuery = useSections();

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
      return <Unauthenticated />;
    }

    throw sectionsQuery.error;
  }

  if (sectionsQuery.isSuccess) {
    return <Authenticated sections={sectionsQuery.data} />;
  }

  // WTF
  return <div></div>;
}

export default function App() {
  return (
    <ErrorBoundary FallbackComponent={FullPageError}>
      <QueryClientProvider client={queryClient}>
        <InfoAlert>
          We have updated Transfer to Ladok to make it easier and safer to use
          with the same functionality.{" "}
          <a href="#">Read more about the update</a>. In the meantime you can
          still use <a href="#">the previous version of Transfer to Ladok</a>.
          Send us your feedback to{" "}
          <a href="mailto:it-support@kth.se" style={{ whiteSpace: "nowrap" }}>
            it-support@kth.se
          </a>
        </InfoAlert>
        <Home />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
