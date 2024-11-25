import { Router } from "express";
import {
  createCoachApplication,
  deleteCoachApplication,
  getCoachApplication,
  getCoachApplications,
  updateCoachApplicationStatus,
} from "../controllers/CoachAppController.js";
import { authenticateToken, authorizeRoles } from "../middleware/Auth.js";
import { upload } from "../middleware/multerConfig.js";

const CoachAppRouter = Router();

CoachAppRouter.post(
  "/coach/application",
  upload.single("file"),
  createCoachApplication
);
CoachAppRouter.get(
  "/coach/applications",
  authenticateToken,
  authorizeRoles(["admin"]),
  getCoachApplications
);
CoachAppRouter.get(
  "/coach/application/:id",
  authenticateToken,
  authorizeRoles(["admin"]),
  getCoachApplication
);
CoachAppRouter.put(
  "/coach/application/:id",
  authenticateToken,
  authorizeRoles(["admin"]),
  updateCoachApplicationStatus
);
CoachAppRouter.delete(
  "/coach/application/:id",
  authenticateToken,
  authorizeRoles(["admin"]),
  deleteCoachApplication
);

export default CoachAppRouter;
