import { Schema, model } from "mongoose";

const QuizResponseSchema = new Schema(
  {
    courseId: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    quizId: {
      type: Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    responses: [
      {
        questionId: {
          type: Schema.Types.ObjectId,
          ref: "Quiz.questions",
          required: true,
        },
        selectedOption: { type: String, required: true },
      },
    ],
    score: { type: Number, required: true },
    passed: { type: Boolean, required: true },
    certificate: { type: String, default: null },
  },
  {
    timestamps: true,
  }
);

const QuizResponse = model("QuizResponse", QuizResponseSchema);
export default QuizResponse;
