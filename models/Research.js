import { Schema, model } from "mongoose";

const researchSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      unique: true,
    },
    abstract: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    tags: [String], // Tags for searching
    references: [String], // List of references for the research
    file: {
      type: String, // Path to the research PDF or document file
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    thumbnail: {
      type: String, // Path to the image file
    },
    views: {
      type: Number,
      default: 0,
    },
    relatedResearches: [{ type: Schema.Types.ObjectId, ref: "Research" }],
  },
  {
    timestamps: true,
  }
);

const Research = model("Research", researchSchema);
export default Research;
