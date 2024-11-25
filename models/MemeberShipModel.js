import { Schema, model } from "mongoose";

const membershipSchema = new Schema(
  {
    paymentId: {
      type: String,
      required: true,
    },
    paymentId: { type: String, required: true, unique: true },
    link: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
      enum: ["Gold", "Premium", "Pro"],
    },
    duration: {
      type: String,
    },
    price: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      maxlength: 500,
    },
    benefits: {
      type: [String],
      default: [],
    },
    discount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

membershipSchema.index({ paymentId: 1 });

const Membership = model("Membership", membershipSchema);

export default Membership;
