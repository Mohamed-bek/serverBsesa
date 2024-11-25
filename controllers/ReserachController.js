import Research from "../models/Research.js";
import uploadToSpaces from "../utitlitis/awsDigitalOcean.js";

// Create a new research article
export const createResearch = async (req, res) => {
  try {
    const {
      title,
      abstract,
      content,
      tags,
      references,
      category,
      relatedResearches,
    } = req.body;

    const thumbnailFile =
      req.files && req.files["thumbnail"] ? req.files["thumbnail"][0] : null;

    if (!thumbnailFile) {
      return res.status(404).json({ error: "Research Must have a Thumbnail" });
    }
    const thumbnail = await uploadToSpaces(thumbnailFile, "/ResearchThumbnail");
    const newResearch = new Research({
      title,
      abstract,
      content,
      tags,
      references,
      category,
      relatedResearches,
      thumbnail,
    });

    const pdfFile = req.files && req.files["pdf"] ? req.files["pdf"][0] : null;

    if (pdfFile) {
      newResearch.file = await uploadToSpaces(pdfFile, "/ResearchPdf");
    }
    await newResearch.save();
    res.status(201).json({
      message: "Research created successfully",
      research: newResearch,
    });
  } catch (error) {
    res.status(500).json({ message: "Error creating research", error });
  }
};

// Get all research articles with optional filters
export const getResearches = async (req, res) => {
  try {
    const { category, tags, title, limit = 20, page = 1 } = req.query;
    const filter = {};

    if (category) {
      filter.category = category;
    }
    if (tags.length > 0) {
      filter.tags = { $in: tags };
    }
    if (title) {
      filter.title = { $regex: title, $options: "i" };
    }

    const researches = await Research.find(filter)
      .skip(limit * (page - 1))
      .limit(limit)
      .populate("category")
      .populate({
        path: "relatedResearches",
        select: "thumbnail title",
      });
    res.status(200).json(researches);
  } catch (error) {
    res.status(500).json({ message: "Error fetching researches", error });
  }
};

// Get a single research article by ID
export const getResearchById = async (req, res) => {
  try {
    const { id } = req.params;
    const research = await Research.findById(id)
      .populate("category")
      .populate({ path: "relatedResearches", select: "thumbnail title" });

    if (!research) {
      return res.status(404).json({ message: "Research not found" });
    }

    research.views += 1;
    await research.save();

    res.status(200).json(research);
  } catch (error) {
    res.status(500).json({ message: "Error fetching research", error });
  }
};

// Update a research article
export const updateResearch = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      abstract,
      content,
      tags,
      references,
      category,
      relatedResearches,
    } = req.body;

    const updatedResearch = await Research.findByIdAndUpdate(
      id,
      {
        title,
        abstract,
        content,
        tags,
        references,
        category,
        relatedResearches,
      },
      { new: true }
    )
      .populate("category")
      .populate({
        path: "relatedResearches",
        select: "thumbnail title",
      });

    if (!updatedResearch) {
      return res.status(404).json({ message: "Research not found" });
    }

    // if (req.files) {
    //   if (req.files.file) {
    //     // Optionally remove the old file
    //     if (updatedResearch.file) fs.unlinkSync(updatedResearch.file);
    //     updatedResearch.file = req.files.file[0].path;
    //   }
    //   if (req.files.thumbnail) {
    //     // Optionally remove the old thumbnail
    //     if (updatedResearch.thumbnail) fs.unlinkSync(updatedResearch.thumbnail);
    //     updatedResearch.thumbnail = req.files.thumbnail[0].path;
    //   }
    // }

    await updatedResearch.save();
    res
      .status(200)
      .json({ message: "Research updated successfully", updatedResearch });
  } catch (error) {
    res.status(500).json({ message: "Error updating research", error });
  }
};

// Delete a research article
export const deleteResearch = async (req, res) => {
  try {
    const { id } = req.params;
    const research = await Research.findByIdAndDelete(id);

    if (!research) {
      return res.status(404).json({ message: "Research not found" });
    }

    // Optionally remove associated files
    // if (research.file) fs.unlinkSync(research.file);
    // if (research.thumbnail) fs.unlinkSync(research.thumbnail);

    res.status(200).json({ message: "Research deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting research", error });
  }
};
