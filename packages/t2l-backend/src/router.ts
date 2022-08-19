import { Router } from "express";
import sectionsHandler from "./apiHandlers/sections";
import columnsHandler from "./apiHandlers/columns";
import {
  assignmentGradesHandler,
  courseGradesHandler,
} from "./apiHandlers/canvasGrades";
import { getGradesHandler, postGradesHandler } from "./apiHandlers/ladokGrades";
import auth from "./otherHandlers/auth";
import { errorHandler } from "./apiHandlers/error";
import { buildInfo } from "./config/info";
import { insightsMiddleware } from "./apiHandlers/utils/applicationInsights";
const router = Router();

router.get("/_about", (req, res) => {
  res.set("Content-type", "text/plain");
  res.send(`
Transfer to Ladok
-----------------
- Build date: ${buildInfo.buildDate}

- Docker image:   ${buildInfo.dockerImage}
- Docker version: ${buildInfo.dockerVersion}

- Git branch: ${buildInfo.gitBranch}
- Git commit: ${buildInfo.gitCommit}
`);
});

/* Un-comment this section when Transfer to Ladok (frontend) is ready for
   production

// This endpoint is where the user lands after clicking "Transfer to Ladok"
// from the left-side menu
router.post("/", (req, res) => {
  const courseId = req.body.custom_courseid;

  res.redirect(`/transfer-to-ladok?courseId=${courseId}`);
});

// Authentication is handled via its own router under "/auth" endpoints
router.use("/auth", auth);
*/

// From here, everything are api endpoints:

router.use("/api", (req, res, next) => insightsMiddleware(req, res, next));
router.get("/api/courses/:courseId/sections", (req, res, next) =>
  sectionsHandler(req, res).catch(next)
);
router.get("/api/courses/:courseId/columns", (req, res, next) =>
  columnsHandler(req, res).catch(next)
);
router.get("/api/courses/:courseId/total", (req, res, next) =>
  courseGradesHandler(req, res).catch(next)
);
router.get(
  "/api/courses/:courseId/assignments/:assignmentId",
  (req, res, next) => assignmentGradesHandler(req, res).catch(next)
);

router.get("/api/courses/:courseId/ladok-grades", (req, res, next) =>
  getGradesHandler(req, res).catch(next)
);
router.post("/api/courses/:courseId/ladok-grades", (req, res, next) =>
  postGradesHandler(req, res).catch(next)
);

router.use("/api", errorHandler);

export default router;
