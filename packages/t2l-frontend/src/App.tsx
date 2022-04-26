import * as React from "react";
import { ErrorBoundary } from "react-error-boundary";
import { QueryClient, QueryClientProvider } from "react-query";
import FullPageError from "./components/FullPageError";
import { useSections } from "./hooks/apiClient";

const queryClient = new QueryClient();

function Home() {
  const query = useSections("1");

  if (!query.data) {
    return <div>loading...</div>;
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
