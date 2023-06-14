import log from "skog";
import { Request, Response } from "express";
import { getAutentiserad } from "../externalApis/ladokApi";

export async function monitor(req: Request, res: Response) {
  res.set("Content-type", "text/plain");

  try {
    const { Anvandarnamn } = await getAutentiserad();

    res.send(`
APPLICATION_STATUS: OK
----------------------
- Ladok User: ${Anvandarnamn}
    `);
  } catch (error) {
    log.error(error as Error, "Error. Ladok might be down");

    res.send("APPLICATION_STATUS: ERROR");
  }
}

export function about(req: Request, res: Response<string>) {
  const gitCommit = process.env.GIT_COMMIT ?? "unknown";
  const gitBranch = process.env.GIT_BRANCH ?? "unknown";

  res.set("Content-type", "text/plain");
  res.send(`
Transfer to Ladok
-----------------
- Git branch: ${gitBranch}
- Git commit: ${gitCommit}
`);
}
