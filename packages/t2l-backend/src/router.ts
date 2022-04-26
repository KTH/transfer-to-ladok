import { Router } from "express";
import sectionsHandler from "./apiHandlers/sections";
import auth from "./apiHandlers/auth";
const router = Router();

router.post("/", (req, res) => {
  const domain = req.body.custom_domain;
  const courseId = req.body.custom_courseid;

  //

  res.redirect(`/transfer-to-ladok?courseId=${courseId}`);
});
router.use("/auth", auth);
router.get("/api/courses/:courseId/sections", sectionsHandler);

export default router;
