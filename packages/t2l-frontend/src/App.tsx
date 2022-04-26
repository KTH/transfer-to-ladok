import React from "react";
import { useQuery, QueryClient, QueryClientProvider } from "react-query";

const queryClient = new QueryClient();

function Home() {
  const sections = useQuery("sections", () =>
    fetch("/transfer-to-ladok/api/courses/1/sections").then((r) => r.json())
  );

  if (sections.data) {
    return <div>Loaded!!</div>;
  }
  return <div>loading...</div>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Home />
    </QueryClientProvider>
  );
}
