import Application from "../models/Application.js";
import uploadToSpaces from "../utitlitis/awsDigitalOcean.js";

// Create a new application
export const createApplication = async (req, res) => {
  try {
    const { applicantType, desiredDevelopment, name, steps, deadline, level } =
      req.body;
    const file = req.file;
    if (!file)
      return res
        .status(404)
        .json({ error: "The Application Must Have An Image" });
    const fileUrl = await uploadToSpaces(file, "/ApplicationImages");
    const newApplication = new Application({
      applicantType,
      desiredDevelopment,
      steps,
      name,
      deadline,
      level,
      image: fileUrl,
    });

    await newApplication.save();
    res.status(201).json({
      message: "Application created successfully",
      application: newApplication,
    });
  } catch (error) {
    res.status(500).json({ message: "Error creating application", error });
  }
};

// Get all applications
export const getApplications = async (req, res) => {
  try {
    const { applicantType, level, isDeadlinePassed, name } = req.query;
    const filter = {};

    if (applicantType) {
      filter.applicantType = applicantType;
    }
    if (level) {
      filter.level = level;
    }
    if (name) {
      filter.name = { $regex: name, $options: "i" };
    }

    if (isDeadlinePassed !== undefined) {
      const currentDate = new Date();
      if (isDeadlinePassed === "true") {
        filter.deadline = { $lt: currentDate };
      } else if (isDeadlinePassed === "false") {
        filter.deadline = { $gte: currentDate };
      }
    }
    const applications = await Application.find(filter);

    res.status(200).json(applications);
  } catch (error) {
    res.status(500).json({ message: "Error fetching applications", error });
  }
};

// Get an application by ID
export const getApplicationById = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }
    res.status(200).json(application);
  } catch (error) {
    res.status(500).json({ message: "Error fetching application", error });
  }
};

// Update an application by ID
export const updateApplication = async (req, res) => {
  // const { }
  try {
    const updatedApplication = await Application.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true } // Return the updated document
    );

    if (!updatedApplication) {
      return res.status(404).json({ message: "Application not found" });
    }

    res.status(200).json({
      message: "Application updated successfully",
      application: updatedApplication,
    });
  } catch (error) {
    res.status(500).json({ message: "Error updating application", error });
  }
};

// Delete an application by ID
export const deleteApplication = async (req, res) => {
  try {
    const deletedApplication = await Application.findByIdAndDelete(
      req.params.id
    );

    if (!deletedApplication) {
      return res.status(404).json({ message: "Application not found" });
    }

    res.status(200).json({ message: "Application deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting application", error });
  }
};
