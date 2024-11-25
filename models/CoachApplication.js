import { Schema, model } from "mongoose";

const coachSchema = new Schema(
  {
    image: {
      type: String,
    },
    applicationId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Application",
    },
    name: {
      unique: true,
      type: String,
      required: true,
    },
    dateOfBirth: {
      type: Date,
    },
    contactEmail: {
      type: String,
      required: true,
    },
    contactPhone: String,
    experienceYears: {
      type: Number,
      required: true,
    },
    qualifications: [String], // Example: ['UEFA A License', 'Youth Development Program']
    specialties: [String], // Example: ['Youth Coaching', 'Offensive Strategy']
    currentClub: {
      type: String,
    },
    biography: String, //A brief biography or description of the coach's background, philosophy, and coaching style.
    achievements: [String],
    CoachingLevel: {
      type: String,
      enum: ["Youth", "Amateur", "Professional"],
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    languagesSpoken: [String],
  },
  {
    timestamps: true,
  }
);

const Coach = model("CoachApplication", coachSchema);
export default Coach;
