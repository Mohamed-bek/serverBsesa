import { Schema, model } from "mongoose";

const applicationSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    applicantType: {
      type: String,
      enum: ["ClubApplication", "CoachApplication"],
      required: true,
    },
    subscribersIds: [
      {
        type: Schema.Types.ObjectId,
        refPath: "applicantType",
      },
    ],
    desiredDevelopment: String, // Description of development goals
    steps: [
      {
        title: {
          type: String,
          required: true,
        },
        description: {
          type: String,
          required: true,
        },
        image: {
          type: String,
        },
      },
    ], // Description of The Steps of the Program
    deadline: {
      type: Date,
      required: true,
    },
    level: {
      type: String,
      enum: ["Youth", "Amateur", "Professional"],
    },
  },
  {
    timestamps: true,
  }
);

const Application = model("Application", applicationSchema);
export default Application;
