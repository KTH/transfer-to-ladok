import { setupWorker } from "msw";
import mock1Handlers from "./handlers/mock-1";
import mock2Handlers from "./handlers/mock-2";
import sf1624Handlers from "./handlers/mock-sf1624";
// This configures a Service Worker with the given request handlers.
export const worker = setupWorker(
  ...mock1Handlers,
  ...mock2Handlers,
  ...sf1624Handlers
);
