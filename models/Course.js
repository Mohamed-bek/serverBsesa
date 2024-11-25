import { Schema, model } from "mongoose";

const courseSchema = new Schema(
  {
    title: { type: String, required: true },
    categorys: [{ type: Schema.Types.ObjectId, ref: "Category" }],
    description: { type: String, required: true },
    price: { type: Number, required: true },
    videos: [
      {
        video: { type: Schema.Types.ObjectId, ref: "Video", required: true },
        order: { type: Number },
      },
    ],
    thumbnail: { type: String },
    published: { type: Boolean, default: false },
    completed: { type: Boolean, default: false },
    quiz: { type: Schema.Types.ObjectId, ref: "Quiz" },
  },
  {
    timestamps: true,
  }
);

// courseSchema.pre("save", async function (next) {
//   if (this.isModified("videos")) {
//     const videoCount = this.videos.length;

//     // Fetch existing course videos
//     const existingCourse = await Course.findById(this._id).select("videos");

//     if (!existingCourse) {
//       return next(new Error("Course not found"));
//     }

//     // Extract existing video IDs
//     const existingVideoIds = existingCourse.videos.map((video) =>
//       video.video.toString()
//     );

//     // Check for duplicates and set the order for new videos
//     const newVideos = [];

//     for (let i = 0; i < videoCount; i++) {
//       const newVideoId = this.videos[i].video.toString();

//       // Only add new videos that do not already exist in the course
//       if (!existingVideoIds.includes(newVideoId)) {
//         newVideos.push(this.videos[i]); // Add new video to the list
//       }
//     }

//     // Calculate the max order from existing videos
//     const currentOrders = existingCourse.videos.map((video) => video.order);
//     const maxOrder = currentOrders.length > 0 ? Math.max(...currentOrders) : 0;

//     // Assign order to the new videos
//     for (let i = 0; i < newVideos.length; i++) {
//       if (!newVideos[i].order) {
//         newVideos[i].order = maxOrder + i + 1; // Incrementing order
//       }
//     }

//     // Combine existing videos with new videos
//     this.videos = [...existingCourse.videos, ...newVideos]; // Keep existing videos intact
//   }
//   next();
// });

const Course = model("Course", courseSchema);
export default Course;
