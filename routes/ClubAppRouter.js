import { Router } from "express";
import {
  createClubApplication,
  deleteClubApplication,
  getClubApplication,
  getClubApplications,
  updateClubApplicationStatus,
} from "../controllers/ClubAppController.js";
import { authenticateToken, authorizeRoles } from "../middleware/Auth.js";
import { upload } from "../middleware/multerConfig.js";

const ClubAppRouter = Router();

ClubAppRouter.post(
  "/club/application",
  upload.single("file"),
  createClubApplication
);
ClubAppRouter.get(
  "/club/application/:id",
  authenticateToken,
  authorizeRoles(["admin"]),
  getClubApplication
);
ClubAppRouter.get(
  "/club/applications",
  authenticateToken,
  authorizeRoles(["admin"]),
  getClubApplications
);
ClubAppRouter.put(
  "/club/application/:id",
  authenticateToken,
  authorizeRoles(["admin"]),
  updateClubApplicationStatus
);
ClubAppRouter.delete(
  "/club/application/:id",
  authenticateToken,
  authorizeRoles(["admin"]),
  deleteClubApplication
);

export default ClubAppRouter;
