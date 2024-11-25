import { Schema, model } from "mongoose";

const paymentSchema = new Schema(
  {
    amount: { type: Number, required: true },
    currency: { type: String, required: true },
    stripePaymentId: { type: String, required: true }, // Store Stripe payment reference
    status: {
      type: String,
      enum: ["succeeded", "pending", "failed", "chargeback"],
      required: true,
    },
  },
  { timestamps: true }
);

const Payment = model("Payment", paymentSchema);
export default Payment;
