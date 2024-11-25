import { Schema, model } from "mongoose";

const clubSchema = new Schema(
  {
    applicationId: {
      type: Schema.Types.ObjectId,
      ref: "Application",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    logo: {
      type: String,
      // required: true,
    },
    location: {
      type: String,
      required: true,
    },
    establishedYear: {
      type: Number,
      required: true,
    },
    contactEmail: {
      type: String,
      required: true,
    },
    contactPhone: {
      type: String,
      required: true,
    },
    website: String,
    description: String,
    level: {
      type: String,
      enum: ["Professional", "Semi-professional", "Amateur"],
    },
    clubSize: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

const ClubApplication = model("ClubApplication", clubSchema);
export default ClubApplication;
