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
router.use("/api", errorHandler);

export default router;
