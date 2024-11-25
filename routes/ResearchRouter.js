import { Router } from "express";
import {
  getResearches,
  getResearchById,
  createResearch,
  updateResearch,
  deleteResearch,
} from "../controllers/ReserachController.js";
import { authenticateToken, authorizeRoles } from "../middleware/Auth.js";
import { upload, uploadPdfThumbnail } from "../middleware/multerConfig.js";

const ResearchRouter = Router();

// Route to get all researches with optional filters
ResearchRouter.get("/", getResearches);

// Route to get a specific research by ID
ResearchRouter.get("/:id", getResearchById);

// Route to create a new research article
ResearchRouter.post(
  "/",
  authenticateToken,
  authorizeRoles(["admin"]),
  uploadPdfThumbnail,
  createResearch
);

// Route to update an existing research article by ID
ResearchRouter.put(
  "/:id",
  authenticateToken,
  authorizeRoles(["admin"]),
  updateResearch
);

// Route to delete a research article by ID
ResearchRouter.delete(
  "/:id",
  authenticateToken,
  authorizeRoles(["admin"]),
  deleteResearch
);

export default ResearchRouter;
