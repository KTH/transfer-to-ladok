import { Router } from "express";
import sectionsHandler from "./apiHandlers/sections";
const router = Router();

router.get("/api/courses/:courseId", sectionsHandler);

export default router;
