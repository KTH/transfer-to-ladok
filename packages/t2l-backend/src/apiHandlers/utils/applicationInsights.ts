import { AsyncLocalStorage } from "node:async_hooks";
import { TelemetryClient } from "applicationinsights";
import CanvasClient from "../../externalApis/canvasApi";
import { NextFunction, Request, Response } from "express";

const context = new AsyncLocalStorage<{
  userId: number;
  telemetryClient: TelemetryClient;
}>();

/**
 * Creates an Application Insights instance with the current user ID and
 * attaches it to a Async Context
 */
export async function insightsMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const canvasApi = new CanvasClient(req);
  const telemetryClient = new TelemetryClient();
  const userId = await canvasApi.getSelf().then((u) => u.id);

  telemetryClient.context.tags[telemetryClient.context.keys.userAuthUserId] =
    userId.toString();

  telemetryClient.trackNodeHttpRequest({
    request: req,
    response: res,
  });

  context.run({ telemetryClient, userId }, () => next());
}

export function getUserId() {
  return context.getStore()?.userId;
}

export function trackEvent(eventName: string) {
  const telemetryClient = context.getStore()?.telemetryClient;

  if (telemetryClient) {
    telemetryClient.trackEvent({
      name: eventName,
    });
  }
}

export function trackMetric(name: string, value: number) {
  const telemetryClient = context.getStore()?.telemetryClient;

  if (telemetryClient) {
    telemetryClient.trackMetric({ name, value });
  }
}
