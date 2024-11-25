import Course from "../models/Course.js";
import UserMembership from "../models/UserMembership.js";
import uploadToSpaces from "../utitlitis/awsDigitalOcean.js";
import Order from "../models/Order.js";
import Progress from "../models/Progress.js";

export const CreateCourse = async (req, res) => {
  try {
    console.log("Starting CreateCourse");
    const { title, description, price, categorys } = req.body;
    let categoryIds = categorys;
    if (typeof categorys === "string") {
      categoryIds = JSON.parse(categorys);
    }
    const file = req.file;
    console.log("cat: " + categorys);
    if (!file) {
      return res.status(400).json({ message: "No Image file uploaded" });
    }

    // const categoryIds = JSON.parse(categorys);
    const thumbnail = await uploadToSpaces(file, "/CourseImage");
    const NewCourse = new Course({
      title,
      description,
      thumbnail,
      price,
      categorys: categoryIds,
      published: true,
    });

    await NewCourse.save();

    res.status(201).json({
      message: "Created The Course Successfully ",
      course: NewCourse,
    });
  } catch (error) {
    console.error(error);
    res.status(error.status || 500).json({ err: error.message });
  }
};

export const addVideosToCourse = async (req, res) => {
  const { id } = req.params;
  const { newVideos } = req.body;

  try {
    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }

    if (!Array.isArray(newVideos) || newVideos.length === 0) {
      return res.status(400).json({ message: "No valid videos provided." });
    }

    newVideos.forEach((videoId) => {
      if (videoId) {
        course.videos.push({ video: videoId });
      } else {
        console.warn("Invalid videoId encountered:", videoId);
      }
    });

    await course.save();
    res.status(200).json({ message: "Videos added successfully.", course });
  } catch (error) {
    console.error("Error adding videos to course:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const addOneVideosToCourse = async (req, res) => {
  const { id } = req.params; // Course ID
  const { videoId } = req.body; // Video ID to be added

  console.log("Adding video to course:", videoId);

  try {
    const course = await Course.findById(id); // Fetch the course without populating initially

    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }

    if (!videoId) {
      return res.status(400).json({ message: "You must provide a video ID." });
    }

    // Check if the video already exists in the course
    const videoExists = course.videos.some(
      (videoEntry) => videoEntry.video.toString() === videoId
    );

    if (videoExists) {
      return res
        .status(400)
        .json({ message: "Video already exists in course." });
    }

    // Add the new video
    course.videos.push({ video: videoId });

    // Save the updated course
    await course.save();

    // Populate after saving to return the updated structure
    const updatedCourse = await Course.findById(id).populate({
      path: "videos.video",
      select: "title thumbnail",
    });

    res
      .status(200)
      .json({ message: "Video added successfully.", course: updatedCourse });
  } catch (error) {
    console.error("Error adding video to course:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const deleteVideoFromCourse = async (req, res) => {
  const { id } = req.params; // Course ID
  const { videoId } = req.query; // Video ID to be deleted

  try {
    const course = await Course.findById(id); // Find the course by ID

    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }

    if (!videoId) {
      return res.status(400).json({ message: "You must provide a video ID." });
    }

    const videoIndex = course.videos.findIndex((videoEntry) => {
      return videoEntry?.video.toString() === videoId;
    });

    if (videoIndex === -1) {
      return res.status(404).json({ message: "Video not found in course." });
    }

    const newCourseVideo = course.videos.splice(videoIndex, 1);
    course.videos = [...course.videos];
    course.markModified("videos");

    // Save the updated course
    await course.save();

    res.status(200).json({ message: "Video deleted successfully." });
  } catch (error) {
    console.error("Error deleting video from course:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const GetCoursesByFilter = async (req, res) => {
  try {
    const {
      title,
      categories,
      minPrice,
      maxPrice,
      page = 1,
      limit = 20,
    } = req.query;
    const userId = req.userId;
    const filter = {};

    if (title) {
      filter.title = { $regex: title, $options: "i" };
    }

    if (categories) {
      filter.categorys = { $in: categories };
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) {
        filter.price.$gte = Number(minPrice);
      }
      if (maxPrice) {
        filter.price.$lte = Number(maxPrice);
      }
    }

    let discount = 0;

    if (userId) {
      const userMembership = await UserMembership.findOne({
        userId,
        status: "active",
      }).populate({
        path: "membershipId",
        select: "discount",
      });

      if (userMembership) {
        discount = userMembership.membershipId.discount;
      }
    }

    let courses = await Course.find(filter)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate({
        path: "videos.video", // Populate the video details in the videos array
        select: "title thumbnail", // Select specific fields to return for videos
      });
    const NbOfCourses = await Course.countDocuments(filter);

    if (discount > 0) {
      courses = courses.map((course) => ({
        ...course.toObject(),
        price: course.price - (course.price * discount) / 100,
      }));
    }

    res
      .status(200)
      .json({ courses, NbOfPages: Math.ceil(NbOfCourses / limit) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

export const GetCourseById = async (req, res) => {
  try {
    const { id } = req.params; // Course ID
    const userId = req.userId; // Authenticated user's ID

    let discount = 0;
    let isPurchased = false;

    // Fetch the course and populate its videos
    const course = await Course.findById(id).populate({
      path: "videos.video",
      select: "title thumbnail description createdAt",
    });

    if (!course) throw new Error("Course does not exist");

    // If user is authenticated, calculate membership discount and purchase status
    let progressData = [];
    if (userId) {
      const userMembership = await UserMembership.findOne({
        userId,
        status: "active",
      }).populate({
        path: "membershipId",
        select: "discount",
      });

      if (userMembership) {
        discount = userMembership.membershipId.discount;
      }

      const order = await Order.findOne({
        course: course._id,
        user: userId,
        paymentStatus: "completed",
      });
      if (order) {
        isPurchased = true;
      }

      // Fetch progress for the user across all videos in this course
      progressData = await Progress.find({
        userId,
        courseId: course._id,
      }).select("videoId progress");
    }

    // Apply membership discount to course price
    if (discount > 0) {
      course.price = course.price - (course.price * discount) / 100;
    }

    // Add progress data to each video
    const videosWithProgress = course.videos.map((videoEntry) => {
      const progressEntry = progressData.find(
        (progress) =>
          progress.videoId.toString() === videoEntry.video._id.toString()
      );
      return {
        ...videoEntry.video.toObject(),
        progress: progressEntry ? progressEntry.progress : 0, // Default to 0 if no progress found
      };
    });

    // Return course with video progress
    res.status(200).json({
      course: {
        ...course.toObject(),
        videos: videosWithProgress,
      },
      isPurchased,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// export const GetCourseById = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const userId = req.userId;

//     let discount = 0;
//     let isPurchased = false;

//     const course = await Course.findById(id).populate({
//       path: "videos.video",
//       select: "title thumbnail description createdAt",
//     });
//     if (!course) throw new Error("Course not exist");
//     if (userId) {
//       const userMembership = await UserMembership.findOne({
//         userId,
//         status: "active",
//       }).populate({
//         path: "membershipId",
//         select: "discount",
//       });

//       if (userMembership) {
//         discount = userMembership.membershipId.discount;
//       }
//       const order = await Order.findOne({
//         course: course._id,
//         user: userId,
//       });
//       if (order) {
//         isPurchased = true;
//       }
//     }

//     if (discount > 0) {
//       course.price = course.price - (course.price * discount) / 100;
//     }

//     res.status(200).json({ course, isPurchased });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: error.message });
//   }
// };

export const GetNewestCourse = async (req, res) => {
  try {
    const { limit = 4 } = req.query;
    const courses = await Course.find().sort({ createdAt: -1 }).limit(limit);

    res.status(200).json({ courses });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

export const GetPopularCourses = async (req, res) => {
  try {
    let popularityThreshold = 4; // Initial popularity threshold

    // Find the most popular courses based on order count
    let popularCourses = await Course.aggregate([
      {
        $lookup: {
          from: "orders",
          localField: "_id",
          foreignField: "course",
          as: "orders",
        },
      },
      {
        $addFields: {
          orderCount: { $size: "$orders" },
        },
      },
      {
        $match: {
          orderCount: { $gte: popularityThreshold },
        },
      },
      {
        $sort: {
          orderCount: -1, // Sort by order count in descending order
        },
      },
      {
        $lookup: {
          from: "categories", // Add categories lookup
          localField: "categorys",
          foreignField: "_id",
          as: "categorys",
        },
      },
      {
        $project: {
          orders: 0, // Exclude the orders field
          orderCount: 0, // Exclude the orderCount field
        },
      },
    ]);
    while (
      popularCourses.length < popularityThreshold &&
      popularityThreshold > 1
    ) {
      popularityThreshold--; // Reduce the threshold
      popularCourses = await Course.aggregate([
        {
          $lookup: {
            from: "orders",
            localField: "_id",
            foreignField: "course",
            as: "orders",
          },
        },
        {
          $addFields: {
            orderCount: { $size: "$orders" },
          },
        },
        {
          $match: {
            orderCount: { $gte: popularityThreshold },
          },
        },
        {
          $sort: {
            orderCount: -1, // Sort by order count in descending order
          },
        },
        {
          $lookup: {
            from: "categories", // Add categories lookup
            localField: "categorys",
            foreignField: "_id",
            as: "categorys",
          },
        },
        {
          $project: {
            orders: 0, // Exclude the orders field
            orderCount: 0, // Exclude the orderCount field
          },
        },
      ]);
    }

    // If no popular courses, return random courses
    if (popularCourses.length === 0) {
      const randomCourses = await Course.aggregate([
        { $sample: { size: 4 } },
        {
          $lookup: {
            from: "categories",
            localField: "categorys",
            foreignField: "_id",
            as: "categorys",
          },
        },
      ]);
      return res.status(200).json({ courses: randomCourses });
    }

    return res.status(200).json({ courses: popularCourses });
  } catch (error) {
    console.error("Error fetching courses:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
