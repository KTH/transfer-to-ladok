import { Router } from "express";
import sectionsHandler from "./apiHandlers/sections";
import columnsHandler from "./apiHandlers/columns";
import {
  assignmentGradesHandler,
  courseGradesHandler,
} from "./apiHandlers/canvasGrades";
import { getGradesHandler, postGradesHandler } from "./apiHandlers/ladokGrades";
import auth from "./otherHandlers/auth";
import { monitor, about } from "./otherHandlers/system";
import log from "skog";
const router = Router();

router.get("/_monitor", monitor);
router.get("/_about", about);

// This endpoint is where the user lands after clicking "Transfer to Ladok"
// from the left-side menu
router.post("/", (req, res) => {
  const courseId = req.body.custom_courseid;
  log.info(
    `The app launched in canvas course ${courseId}, ${req?.body?.context_title}, by user ${req?.body?.custom_canvas_user_id}`
  );

  res.redirect(`/transfer-to-ladok/?courseId=${courseId}`);
});

// Authentication is handled via its own router under "/auth" endpoints
router.use("/auth", auth);

//
//
// From here, everything are api endpoints:

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

export default router;
