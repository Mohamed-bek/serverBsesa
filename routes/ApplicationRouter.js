import { Router } from "express";
import {
  createApplication,
  deleteApplication,
  getApplicationById,
  getApplications,
  updateApplication,
} from "../controllers/ApplicationController.js";
import { authenticateToken, authorizeRoles } from "../middleware/Auth.js";
import { upload } from "../middleware/multerConfig.js";
const ApplicationRouter = Router();

ApplicationRouter.post(
  "/application",
  authenticateToken,
  authorizeRoles(["admin"]),
  upload.single("file"),
  createApplication
);
ApplicationRouter.get("/applications", getApplications);

ApplicationRouter.get("/application/:id", getApplicationById);

ApplicationRouter.put(
  "/application/:id",
  authenticateToken,
  authorizeRoles(["admin"]),
  updateApplication
);
ApplicationRouter.delete(
  "/application/:id",
  authenticateToken,
  authorizeRoles(["admin"]),
  deleteApplication
);

export default ApplicationRouter;
