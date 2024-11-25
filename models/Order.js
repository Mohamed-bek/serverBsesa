import { Schema, model } from "mongoose";

const orderSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true }, // Link to user
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true }, // One course per order
    payment: { type: Schema.Types.ObjectId, ref: "Payment" }, // Optional field: Only after payment is created
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const Order = model("Order", orderSchema);
export default Order;
