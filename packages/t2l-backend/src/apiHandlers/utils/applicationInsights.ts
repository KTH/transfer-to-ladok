import { AsyncLocalStorage } from "node:async_hooks";
import { TelemetryClient } from "applicationinsights";
import CanvasClient from "../../externalApis/canvasApi";
import { NextFunction, Request, Response } from "express";
import { nanoid } from "nanoid";

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

  telemetryClient.context.tags[telemetryClient.context.keys.operationId] =
    nanoid();

  telemetryClient.trackNodeHttpRequest({
    request: req,
    response: res,
  });

  context.run({ telemetryClient, userId }, () => next());
}

export function getUserId() {
  return context.getStore()?.userId;
}

export function trackEvent(eventName: string, properties?: object) {
  const telemetryClient = context.getStore()?.telemetryClient;

  if (telemetryClient) {
    telemetryClient.trackEvent({
      name: eventName,
      properties,
    });
  }
}
