import { setupWorker } from "msw";
import mock1Handlers from "./handlers/mock-1";
import sf1624Handlers from "./handlers/mock-sf1624";
// This configures a Service Worker with the given request handlers.
export const worker = setupWorker(...mock1Handlers, ...sf1624Handlers);
