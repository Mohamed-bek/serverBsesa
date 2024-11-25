import { Schema, model } from "mongoose";

const CategorySchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "The Category must Have a Name"],
    },
    description: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const Category = model("Category", CategorySchema);
export default Category;
