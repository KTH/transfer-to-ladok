import { NextFunction, Request, Response } from "express";
import { Forbidden } from "../apiHandlers/error";
import CanvasClient from "../externalApis/canvasApi";
import { getReporters } from "../externalApis/ladokApi";

export async function checkLadokPermissionsMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const canvas = new CanvasClient(req);
  const userName = await canvas.getSelf().then((r) => r.login_id);
  const isReporter = await getReporters().then((r) =>
    r.Anvandare.find((a) => a.Anvandarnamn === userName)
  );

  if (!isReporter) {
    // Link to: https://intra.kth.se/utbildning/systemstod/ladok
    throw new Forbidden(
      "You need reporter permissions in Ladok to use this app"
    );
  }

  next();
}
