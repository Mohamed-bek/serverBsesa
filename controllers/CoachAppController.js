import CoachApplication from "../models/CoachApplication.js";
import Application from "../models/Application.js";
import path from "path";
import ejs from "ejs";
import fs from "fs";
import { transporter } from "../utitlitis/sendMail.js";
import uploadToSpaces from "../utitlitis/awsDigitalOcean.js";

const __dirname = path.dirname(new URL(import.meta.url).pathname);

// Create a new Coach Application
export const createCoachApplication = async (req, res) => {
  try {
    const {
      applicationId,
      name,
      dateOfBirth,
      contactEmail,
      contactPhone,
      experienceYears,
      qualifications,
      specialties,
      currentClub,
      biography,
      achievements,
      CoachingLevel,
      languagesSpoken,
    } = req.body;

    const application = await Application.findById(applicationId);
    if (!application)
      return res.status(404).json({
        error: "The Application That You Want To Subscribe To Is Not Found",
      });
    if (!req.file)
      return res.status(404).json({
        error: "The Image Of the Coach Is messing",
      });
    const imageUrl = await uploadToSpaces(req.file, "/CoachImages");
    const newCoachApplication = new CoachApplication({
      applicationId,
      name,
      dateOfBirth,
      contactEmail,
      contactPhone,
      experienceYears,
      qualifications,
      specialties,
      currentClub,
      biography,
      achievements,
      CoachingLevel,
      languagesSpoken,
      image: imageUrl,
    });

    await newCoachApplication.save();

    application.subscribersIds.push(newCoachApplication);
    await application.save();

    const template = fs.readFileSync(
      path.join(__dirname, "../mail/subApplication.ejs"),
      "utf8"
    );

    const html = ejs.render(template, {
      name,
      applicationName: application.name,
      status: "pending",
    });

    await transporter.sendMail({
      from: `BSESA <${process.env.SMTP_MAIL}>`,
      to: contactEmail,
      subject: `Your Request For ${application.name} is Under Review`,
      html,
    });

    res.status(201).json({
      message: "Coach application created successfully",
      newCoachApplication,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error creating coach application", error });
  }
};

// Get all Coach Applications (with optional filters)
export const getCoachApplications = async (req, res) => {
  try {
    const { status, CoachingLevel, name } = req.query;

    const filter = {};

    if (status) {
      filter.status = status;
    }
    if (CoachingLevel) {
      filter.CoachingLevel = CoachingLevel;
    }
    if (name) {
      filter.name = { $regex: name, $options: "i" };
    }

    const coachApplications = await CoachApplication.find(filter);
    res.status(200).json(coachApplications);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching coach applications", error });
  }
};

// Get Coach Application By Id
export const getCoachApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const coachApplication = await CoachApplication.findById(id);
    if (!coachApplication)
      return res.status(404).json({ error: "Coach application not found" });
    res.status(200).json(coachApplication);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update the status of a Coach Application
export const updateCoachApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["pending", "approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const updatedApplication = await CoachApplication.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updatedApplication) {
      return res.status(404).json({ message: "Coach application not found" });
    }

    const application = await Application.findById(
      updatedApplication.applicationId
    );

    const template = fs.readFileSync(
      path.join(__dirname, "../mail/subApplication.ejs"),
      "utf8"
    );

    const html = ejs.render(template, {
      name: updatedApplication.name,
      applicationName: application.name,
      status,
    });

    await transporter.sendMail({
      from: `BSESA <${process.env.SMTP_MAIL}>`,
      to: updatedApplication.contactEmail,
      subject: `Your Coaching Application is ${status}`,
      html,
    });

    res.status(200).json({
      message: "Coach application status updated",
      updatedApplication,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating coach application status", error });
  }
};

// Delete a Coach Application
export const deleteCoachApplication = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedApplication = await CoachApplication.findByIdAndDelete(id);

    if (!deletedApplication) {
      return res.status(404).json({ message: "Coach application not found" });
    }

    res.status(200).json({ message: "Coach application deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting coach application", error });
  }
};
