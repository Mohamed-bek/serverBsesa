import ClubApplication from "../models/ClubApplications.js";
import Application from "../models/Application.js";
import path from "path";
import ejs from "ejs";
import fs from "fs";
import { transporter } from "../utitlitis/sendMail.js";
const __dirname = path.dirname(new URL(import.meta.url).pathname);
import uploadToSpaces from "../utitlitis/awsDigitalOcean.js";

// Create a new Club Application
export const createClubApplication = async (req, res) => {
  try {
    const {
      applicationId,
      name,
      location,
      establishedYear,
      contactEmail,
      contactPhone,
      website,
      description,
      level,
      clubSize,
    } = req.body;
    const application = await Application.findById(applicationId);

    if (!application)
      return res.status(404).json({
        error: "The Application That You went To Subscribe Is Not Found",
      });

    if (!req.file) {
      return res
        .status(400)
        .json({ message: "The logo of the Club is required" });
    }
    const logo = await uploadToSpaces(req.file, "/ClubLogo");
    const newClubApplication = new ClubApplication({
      applicationId,
      name,
      logo,
      location,
      establishedYear,
      contactEmail,
      contactPhone,
      website,
      description,
      level,
      clubSize,
    });

    await newClubApplication.save();

    application.subscribersIds.push(newClubApplication);
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
      subject: `Your Club Ruequet is Under Review`,
      html,
    });

    res.status(201).json({
      message: "Club application created successfully",
      newClubApplication,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating club application", error });
  }
};

// Get all Club Applications (with optional filters)
export const getClubApplications = async (req, res) => {
  try {
    const { status, level, name } = req.query;

    const filter = {};

    if (status) {
      filter.status = status;
    }
    if (level) {
      filter.level = level;
    }
    if (name) {
      filter.name = { $regex: name, $options: "i" };
    }

    const clubApplications = await ClubApplication.find(filter);
    res.status(200).json(clubApplications);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching club applications", error });
  }
};

// Get Application By Id
export const getClubApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const clubApplication = await ClubApplication.findById(id);
    if (!clubApplication)
      return res.status(404).json({ error: "Club application not found" });
    res.status(200).json(clubApplication);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update the status of a Club Application
export const updateClubApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["pending", "approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const updatedApplication = await ClubApplication.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updatedApplication) {
      return res.status(404).json({ message: "Club application not found" });
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
      subject: `Your Club Ruequet is ${status}`,
      html,
    });

    res
      .status(200)
      .json({ message: "Club application status updated", updatedApplication });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating club application status", error });
  }
};

// Delete a Club Application
export const deleteClubApplication = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedApplication = await ClubApplication.findByIdAndDelete(id);

    if (!deletedApplication) {
      return res.status(404).json({ message: "Club application not found" });
    }

    res.status(200).json({ message: "Club application deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting club application", error });
  }
};
