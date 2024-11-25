import { Schema, model } from "mongoose";

const userMembershipSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    membershipId: {
      type: Schema.Types.ObjectId,
      ref: "Membership",
      required: true,
    },
    paymentId: {
      type: Schema.Types.ObjectId,
      ref: "Payment",
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "expired", "cancelled"],
      default: "active",
    },
    subscriptionId: {
      type: String,
    },
    discountCode: {
      type: String, // Any discount or promo code applied
    },
    cancellationReason: {
      type: String, // Reason for membership cancellation
    },
  },
  {
    timestamps: true,
  }
);

const UserMembership = model("UserMembership", userMembershipSchema);

export default UserMembership;
