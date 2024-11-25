import { Schema, model } from "mongoose";

const conferenceSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
    },
    location: {
      type: String,
      required: true,
    },
    date: {
      start: {
        type: Date,
        required: true,
      },
      end: {
        type: Date,
      },
    },
    description: {
      type: String,
      trim: true,
      required: true,
    },
    categories: [
      {
        type: String,
      },
    ],
    speakers: [
      {
        firstName: String,
        lastName: String,
        image: String,
      },
    ],
  },
  { timestamps: true }
);

const Conference = model("Conference", conferenceSchema);

export default Conference;
