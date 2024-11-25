import { Schema, model } from "mongoose";
import bcrypt from "bcrypt";

const UserSchema = new Schema(
  {
    firstName: {
      type: String,
      required: [true, "The First Name Must be Provided"],
    },
    lastName: {
      type: String,
      required: [true, "The Last Name Must be Provided"],
    },
    email: {
      type: String,
      required: [true, "The Email Must be Provided"],
      unique: true,
    },
    password: {
      type: String,
      required: [true, "The Password Must be Provided"],
    },
    refreshToken: {
      type: String,
    },
    image: {
      type: String,
      default: "image",
    },
    role: {
      type: String,
      enum: ["client", "admin", "coach"],
      default: "client",
    },
    resetToken: { type: String },
    resetTokenExpiration: { type: Date },
  },
  {
    timestamps: true,
  }
);

UserSchema.methods.comparePassword = function (inputPassword) {
  return bcrypt.compare(inputPassword, this.password);
};

UserSchema.methods.hashPassword = function (inputPassword) {
  return bcrypt.compare(inputPassword, this.password);
};

const User = model("User", UserSchema);

export default User;
