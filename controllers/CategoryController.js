import Category from "../models/Category.js";

export const AddCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    const isExist = await Category.findOne({ name: name.toLowerCase() });
    if (isExist)
      return res.status(401).json({ message: "Category Already Exist" });
    const category = await Category.create({
      name: name.toLowerCase(),
      description,
    });
    res
      .status(200)
      .json({ message: "Category Created successfully", category });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Category not Created", err: error.message });
  }
};

export const DeleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const isExist = await Category.findById(id);
    if (!isExist)
      return res.status(401).json({ message: "Category Dosen't Exist" });
    await isExist.deleteOne();
    res.status(200).json({ message: "Category Deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Category not Deleted", err: error.message });
  }
};

export const GetCategorys = async (req, res) => {
  try {
    const categories = await Category.find();
    res.status(200).json({ categories });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Categorys not Found", err: error.message });
  }
};
