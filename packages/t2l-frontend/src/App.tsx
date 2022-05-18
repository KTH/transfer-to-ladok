import * as React from "react";
import { ErrorBoundary } from "react-error-boundary";
import { QueryClient, QueryClientProvider } from "react-query";
import FullPageError from "./components/FullPageError";
import { useSections } from "./hooks/apiClient";
import Gradebook from "./screens/Gradebook";
import Unauthenticated from "./screens/Unauthenticated";

const queryClient = new QueryClient();

type Destination =
  | {
      aktivitetstillfalleId: string;
    }
  | {
      kurstillfalleId: string;
      utbildningsinstansId: string;
    };

function Home() {
  const courseId = new URLSearchParams(location.search).get("courseId");
  const query = useSections(courseId);
  const [destination, setDestination] = React.useState<Destination | null>(
    null
  );

  if (query.status === "loading") {
    return <div></div>;
  }

  if (query.status === "unauthenticated") {
    return <Unauthenticated courseId={courseId} />;
  }

  if (query.status === "error") {
    throw query.error;
  }

  // If there is only one examination, just choose it
  const { aktivitetstillfalle, kurstillfalle } = query.sections;
  if (
    !destination &&
    aktivitetstillfalle.length === 1 &&
    kurstillfalle.length === 0
  ) {
    setDestination({
      aktivitetstillfalleId: aktivitetstillfalle[0].id,
    });
  }

  if (!destination) {
    return <div>Selector</div>;
  }

  return <Gradebook />;
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
