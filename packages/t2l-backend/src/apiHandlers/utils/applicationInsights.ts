import { AsyncLocalStorage } from "node:async_hooks";
import { nanoid } from "nanoid";

import { Contracts, defaultClient, TelemetryClient } from "applicationinsights";
import type { NextFunction, Request, Response } from "express";
import type { ContextTagKeys } from "applicationinsights/out/Declarations/Contracts";
import type FlushOptions from "applicationinsights/out/Library/FlushOptions";

const storage = new AsyncLocalStorage<TelemetryClient>();

function _getClient() {
  return storage.getStore() || defaultClient;
}

/**
 * Creates an Application Insights instance with the current user ID and
 * attaches it to a Async Context
 */
export async function insightsMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const client = new TelemetryClient();
  client.trackNodeHttpRequest({ request: req, response: res });

  // We overwrite operationId
  client.context.tags[defaultClient.context.keys.operationId] = nanoid();

  storage.run(client, () => next());
}

export function openContext<T>(callback: () => T) {
  const client = new TelemetryClient();
  client.context.tags[defaultClient.context.keys.operationId] = nanoid();

  return storage.run(client, callback);
}

export function setInsightsField(key: keyof ContextTagKeys, value: string) {
  const keyName = defaultClient.context.keys[key];
  const store = storage.getStore();

  if (store) {
    store.context.tags[keyName] = value;
  }
}

export function getInsightsField(key: keyof ContextTagKeys) {
  return storage.getStore()?.context.tags[defaultClient.context.keys[key]];
}

export function trackAvailability(telemetry: Contracts.AvailabilityTelemetry) {
  _getClient().trackAvailability(telemetry);
}

export function trackPageView(telemetry: Contracts.PageViewTelemetry) {
  _getClient().trackPageView(telemetry);
}

export function trackTrace(telemetry: Contracts.TraceTelemetry) {
  _getClient().trackTrace(telemetry);
}

export function trackMetric(telemetry: Contracts.MetricTelemetry) {
  _getClient().trackMetric(telemetry);
}

export function trackException(telemetry: Contracts.ExceptionTelemetry) {
  _getClient().trackException(telemetry);
}

export function trackEvent(telemetry: Contracts.EventTelemetry) {
  _getClient().trackEvent(telemetry);
}

export function trackDependency(
  telemetry: Contracts.DependencyTelemetry & Contracts.Identified
) {
  _getClient().trackDependency(telemetry);
}

export function flushTelemetry(options: FlushOptions) {
  _getClient().flush(options);
}
