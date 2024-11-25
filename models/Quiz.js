import { Schema, model } from "mongoose";

const QuizSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    questions: [
      {
        questionText: { type: String, required: true },
        options: [
          {
            text: { type: String, required: true },
            isCorrect: { type: Boolean, default: false },
          },
        ],
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Quiz = model("Quiz", QuizSchema);
export default Quiz;
