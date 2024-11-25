import { Router } from "express";
import {
  AddCategory,
  DeleteCategory,
  GetCategorys,
} from "../controllers/CategoryController.js";
import { authenticateToken, authorizeRoles } from "../middleware/Auth.js";

const CategoryRouter = Router();

CategoryRouter.post(
  "/categories",
  authenticateToken,
  authorizeRoles(["admin"]),
  AddCategory
);

CategoryRouter.delete(
  "/categories/:id",
  authenticateToken,
  authorizeRoles(["admin"]),
  DeleteCategory
);

CategoryRouter.get("/categories", GetCategorys);

export default CategoryRouter;
