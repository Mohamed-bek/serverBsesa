import Conference from "../models/Conference.js";
import uploadToSpaces from "../utitlitis/awsDigitalOcean.js";

export const CreateConference = async (req, res) => {
  try {
    const { name, description, location, date, categories, speakers } =
      req.body;

    if (!req.file)
      return res
        .status(404)
        .json({ error: "The Conference Image is required" });

    const image = await uploadToSpaces(req.file, "/Conference");
    const conference = await Conference.create({
      name,
      description,
      location,
      date,
      categories,
      speakers,
      image,
    });
    if (!conference)
      res.status(400).json({ message: "Conference Not Created" });
    res
      .status(200)
      .json({ message: "Conference Created Successefully", conference });
  } catch (error) {
    res.status(error.status || 500).json({ err: error.message });
  }
};

export const GetConferences = async (req, res) => {
  try {
    const conferences = await Conference.find();
    res.status(200).json({ conferences });
  } catch (error) {
    res.status(error.status || 500).json({ err: error.message });
  }
};

export const GetConference = async (req, res) => {
  try {
    const { id } = req.params;
    const conference = await Conference.findById(id);
    if (!conference) {
      res.status(404).json({ err: "Conference Not Found" });
    }
    res.status(200).json({ conference });
  } catch (error) {
    res.status(error.status || 500).json({ err: error.message });
  }
};

export const UpdateConference = async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.body;
    const conference = await Conference.findById(id);
    if (!conference) {
      res.status(404).json({ err: "Conference Not Found" });
    }
    conference.date = date;
    await conference.save();
    res.status(200).json({ message: "Conference Date Update Successfully" });
  } catch (error) {
    res.status(error.status || 500).json({ err: error.message });
  }
};

export const CancelConference = async (req, res) => {
  try {
    const { id } = req.params;
    const conference = await Conference.findById(id);
    if (!conference) {
      res.status(404).json({ err: "Conference Not Found" });
    }
    await conference.deleteOne();
    res.status(200).json({ message: "Conference Canceled Successfully" });
  } catch (error) {
    res.status(error.status || 500).json({ err: error.message });
  }
};
