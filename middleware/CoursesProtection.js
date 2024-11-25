import jwt from "jsonwebtoken";
import User from "../models/User.js"; // Adjust path as necessary
import Course from "../models/Course.js"; // Adjust path as necessary
import Order from "../models/Order.js"; // Adjust path as necessary

export const checkVideoAccess = async (req, res, next) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    // Verify the token
    const { videoId, courseId } = req.params;
    const userData = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // Find the user
    const user = await User.findById(userData.id);

    if (!user) return res.status(404).json({ message: "User not found" });

    // Get the video ID from the request

    // Find the course(s) that include the video
    const course = await Course.findById(courseId);

    if (!course) {
      return res
        .status(404)
        .json({ message: "No course found for this video" });
    }

    // Check if the user has any order that includes one of the courses
    const order = await Order.findOne({
      user: user._id,
      course: courseId, // Check if the course ID is in the user's orders
      paymentStatus: "completed", // Ensure the payment was completed
    });

    // Attach access status to the request
    req.user = user; // Store user info for further use
    req.videoAccess = !!order; // True if the user has access, false otherwise
    next();
  } catch (error) {
    console.error(error);
    res.status(403).json({ message: "Invalid token" });
  }
};
