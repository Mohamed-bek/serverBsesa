import { Router } from "express";
import {
  addCommentToBlog,
  createBlogPost,
  deleteBlogPost,
  getAllBlogPosts,
  getBlogPostById,
  toggleLikeBlogPost,
  updateBlogPost,
} from "../controllers/BlodController.js";
import { authenticateToken, authorizeRoles } from "../middleware/Auth.js";
import { upload } from "../middleware/multerConfig.js";

const BlogRouter = Router();

BlogRouter.post(
  "/blog/create",
  authenticateToken,
  authorizeRoles(["admin"]),
  upload.single("file"),
  createBlogPost
);
BlogRouter.get("/blogs", getAllBlogPosts);
BlogRouter.get("/blog/:id", getBlogPostById);
BlogRouter.put("/blog/like/:id", authenticateToken, toggleLikeBlogPost);
BlogRouter.put("/blog/comment/:id", authenticateToken, addCommentToBlog);
BlogRouter.put(
  "/blog/:id",
  authenticateToken,
  authorizeRoles(["admin"]),
  updateBlogPost
);
BlogRouter.delete(
  "/blog/:id",
  authenticateToken,
  authorizeRoles(["admin"]),
  deleteBlogPost
);

export default BlogRouter;
