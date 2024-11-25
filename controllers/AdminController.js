import User from "../models/User.js";

export const getUsers = async (req, res) => {
  try {
    const { page = 1 } = req.params;
    const { role, search } = req.query;
    const limit = 10;

    const query = {};

    if (role) {
      query.role = role;
    }

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(query)
      .skip(limit * (page - 1))
      .limit(limit);

    if (users.length === 0) {
      return res.status(404).json({ message: "The List Of the Users Ended" });
    }

    res.status(200).json({ users });
  } catch (error) {
    res.status(500).json({
      message: "Failed To Get Users",
      err: error.message,
    });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User Not Found" });
    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ message: "Failed To Get User", err: error.message });
  }
};

export const makeUserAdmin = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findByIdAndUpdate(
      userId,
      { role: "admin" },
      {
        new: true,
      }
    );
    if (!user) return res.status(404).json({ message: "User not found." });
    res.status(200).json({ message: "User Have been Updated" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Making The User An Admin Fail", err: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    await User.findByIdAndDelete(userId);
    res.status(200).json({ message: "User Have been Deleted" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Deleting User Failed", err: error.message });
  }
};
