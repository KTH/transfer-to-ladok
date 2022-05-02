import { Router } from "express";
import sectionsHandler from "./apiHandlers/sections";
import auth from "./apiHandlers/auth";
import { errorHandler } from "./error";
const router = Router();

router.post("/", (req, res) => {
  const domain = req.body.custom_domain;
  const courseId = req.body.custom_courseid;

  //

  res.redirect(`/transfer-to-ladok?courseId=${courseId}`);
});
router.use("/auth", auth);
router.get("/api/courses/:courseId/sections", (req, res, next) =>
  sectionsHandler(req, res).catch(next)
);
router.get("/api/courses/:courseId/assignments");
router.get("/api/courses/:courseId/total");
router.get("/api/courses/:courseId/assignments/:assignmentId");
router.get("/api/courses/:courseId/utbildningsinstans/:utbUID/students");
router.get("/api/courses/:courseId/aktivitestillfalle/:aktUID/students");
router.post("/api/courses/:courseId/utbildningsinstans/:utbUID/send-grades");
router.post("/api/courses/:courseId/aktivitetstillfalle/:aktUID/send-grades");

router.use("/api", errorHandler);

export default router;
