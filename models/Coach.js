import { Schema, model } from "mongoose";

const CoachSchema = new Schema(
  {
    firstName: {
      type: String,
      required: [true, "The First Name Must be Provided"],
    },
    lastName: {
      type: String,
      required: [true, "The Last Name Must be Provided"],
    },
    sosialMedais: {
      facebook: String,
      linkidIn: String,
    },
    description: {
      type: String,
      required: [true, "The Description Must be Provided"],
    },
    image: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const Coach = model("Coach", CoachSchema);

export default Coach;
