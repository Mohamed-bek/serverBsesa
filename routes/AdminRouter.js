import { Router } from "express";
import {
  deleteUser,
  getUsers,
  makeUserAdmin,
} from "../controllers/AdminController.js";
import { authenticateToken, authorizeRoles } from "../middleware/Auth.js";
const AdminRouter = Router();

AdminRouter.delete(
  "/user/:userId",
  authenticateToken,
  authorizeRoles(["admin"]),
  deleteUser
);

AdminRouter.get(
  "/users/:page",
  authenticateToken,
  authorizeRoles(["admin"]),
  getUsers
);

AdminRouter.get(
  "/user/:userId",
  authenticateToken,
  authorizeRoles(["admin"]),
  getUsers
);

AdminRouter.put(
  "/:userId",
  authenticateToken,
  authorizeRoles(["admin"]),
  makeUserAdmin
);

export default AdminRouter;
