import { ErrorInfo } from "react";
import { FallbackProps } from "react-error-boundary";
import { ApiError } from "../hooks/apiClient";

export default function FullPageError({ error }: FallbackProps) {
  if (error instanceof ApiError && error.code === "unauthorized") {
    return <div>Login page</div>;
  }

  return <div>WTF</div>;
}
