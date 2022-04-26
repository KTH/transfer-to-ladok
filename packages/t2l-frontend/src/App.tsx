import React from "react";
import { useQuery, QueryClient, QueryClientProvider } from "react-query";
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
    <QueryClientProvider client={queryClient}>
      <Home />
    </QueryClientProvider>
  );
}
