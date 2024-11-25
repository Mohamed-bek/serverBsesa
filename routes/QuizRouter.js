import { Router } from "express";
import {
  addQuizToCourse,
  CheckLastTimeQuiz,
  CreateQuiz,
  getQuiz,
  saveQuizResponse,
} from "../controllers/QuizResponseController.js";
import { checkCompletedCourse } from "../controllers/ProgressController.js";
import { authenticateToken, authorizeRoles } from "../middleware/Auth.js";

const QuizRouter = Router();

QuizRouter.post(
  "/quiz",
  authenticateToken,
  authorizeRoles(["admin"]),
  CreateQuiz
);
QuizRouter.put(
  "/course/quiz",
  authenticateToken,
  authorizeRoles(["admin"]),
  addQuizToCourse
);
QuizRouter.get(
  "/quiz/:courseId",
  authenticateToken,
  checkCompletedCourse,
  getQuiz
);

QuizRouter.post(
  "/quiz/response/:quizId",
  authenticateToken,
  CheckLastTimeQuiz,
  saveQuizResponse
);

export default QuizRouter;
