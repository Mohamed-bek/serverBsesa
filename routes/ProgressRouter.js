import { Router } from "express";
import {
  saveProgress,
  checkCompletedCourse,
  getProgress,
} from "../controllers/ProgressController.js";
import { authenticateToken, authorizeRoles } from "../middleware/Auth.js";

const ProgressRouter = Router();

ProgressRouter.put("/progress", authenticateToken, saveProgress);
ProgressRouter.get("/progress/:courseId", authenticateToken, getProgress);
// ProgressRouter.get(
//   "/course/compelted/:courseId",
//   authenticateToken,
//   checkCompletedCourse
// );

export default ProgressRouter;
