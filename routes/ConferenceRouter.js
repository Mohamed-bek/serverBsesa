import { Router } from "express";
import {
  CancelConference,
  CreateConference,
  GetConference,
  GetConferences,
  UpdateConference,
} from "../controllers/ConferenceController.js";
import { upload } from "../middleware/multerConfig.js";

import { authenticateToken, authorizeRoles } from "../middleware/Auth.js";

const ConferenceRouter = Router();

ConferenceRouter.post(
  "/conference/create",
  authenticateToken,
  authorizeRoles(["admin"]),
  upload.single("file"),
  CreateConference
);
ConferenceRouter.get("/conferences", GetConferences);
ConferenceRouter.get("/conference", GetConference);
ConferenceRouter.put(
  "/conference/:id",
  authenticateToken,
  authorizeRoles(["admin"]),
  UpdateConference
);
ConferenceRouter.delete(
  "/conference/:id",
  authenticateToken,
  authorizeRoles(["admin"]),
  CancelConference
);

export default ConferenceRouter;
