import { Schema, model } from "mongoose";

const videoSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "The Video Must Have A Title"],
    },
    description: {
      type: String,
      required: [true, "The Video Must Have A Description"],
    },
    url: { type: String },
    thumbnail: {
      type: String,
      // required: [true, "The Video Must Have a Thumbnail"],
    },
    pdf: { type: String },
    links: [String],
  },
  {
    timestamps: true,
  }
);

const Video = model("Video", videoSchema);
export default Video;
