import { Schema, model } from "mongoose";

const ProgressSchema = Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    videoId: {
      type: Schema.Types.ObjectId,
      ref: "Video",
      required: true,
    },
    progress: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
  },
  {
    timestamp: true,
  }
);

// Ensure that a user can only have one entry per course/video combination.
ProgressSchema.index({ userId: 1, courseId: 1, videoId: 1 }, { unique: true });

const Progress = model("Progress", ProgressSchema);
export default Progress;
