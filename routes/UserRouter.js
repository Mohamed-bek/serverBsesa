import { Router } from "express";
import { authenticateToken, authorizeRoles } from "../middleware/Auth.js";
import {
  ActivateUser,
  CreateUser,
  Login,
  RefreshToken,
  UpdateAvatar,
  UpdateUserData,
  UpdateEmail,
  UpdatePassword,
  initiatePasswordRecovery,
  resetPassword,
  LogOut,
  getUserAnalytics,
  userCertificate,
  userCourses,
} from "../controllers/UserController.js";

import { upload } from "../middleware/multerConfig.js";

const UserRouter = Router();

UserRouter.put(
  "/avatar",
  authenticateToken,
  upload.single("file"),
  UpdateAvatar
);

UserRouter.post("/userCreate", CreateUser);
UserRouter.post("/activation", ActivateUser);
UserRouter.post("/login", Login);
UserRouter.get("/refresh", RefreshToken);
UserRouter.get("/logout", LogOut);
UserRouter.get("/certificate", authenticateToken, userCertificate);
UserRouter.get("/my-courses", authenticateToken, userCourses);

UserRouter.put("/update", authenticateToken, UpdateUserData);
UserRouter.put("/email", authenticateToken, UpdateEmail);
UserRouter.put("/password", authenticateToken, UpdatePassword);
UserRouter.put("/pass_recovery", initiatePasswordRecovery);
UserRouter.put("/pass_reset", resetPassword);
UserRouter.get("/user_analytics", getUserAnalytics);

export default UserRouter;
