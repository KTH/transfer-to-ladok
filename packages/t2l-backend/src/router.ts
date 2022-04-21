import { Router } from "express";
import sectionsHandler from "./apiHandlers/sections";
import auth from "./apiHandlers/auth";
const router = Router();

router.use("/auth", auth);

export default router;
