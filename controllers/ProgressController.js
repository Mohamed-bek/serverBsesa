import Progress from "../models/Progress.js";
import Course from "../models/Course.js";

export const saveProgress = async (req, res) => {
  try {
    const { courseId, videoId, progress } = req.body;
    await Progress.updateOne(
      { userId: req.user.id, courseId, videoId },
      { progress, lastUpdated: new Date() },
      { upsert: true }
    );
    res.status(200).json({ message: "Progress saved successfully" });
  } catch (error) {
    res
      .status(error.status || 500)
      .json({ message: "Error saving progress", err: error.message });
  }
};

export const getProgress = async (req, res) => {
  try {
    const { courseId } = req.params;
    const progress = await Progress.find({
      userId: req.user.id,
      courseId,
    })
      .populate({
        path: "videoId",
        select: "thumbnail title",
      })
      .populate({
        path: "courseId",
        select: "title thumbnail",
      });
    res.status(200).json({ progress });
  } catch (error) {
    res
      .status(200)
      .json({ message: "Error fetching progress", err: error.message });
  }
};

export const checkCompletedCourse = async (req, res, next) => {
  const { courseId } = req.params;
  const userId = req.user.id;
  try {
    // 1. Fetch all video IDs for the course
    const course = await Course.findById(courseId).populate("videos");
    if (!course) return res.status(404).json({ message: "Course not found" });
    const videoIds = course.videos.map((video) => video.video.toString());

    // 2. Fetch user's progress for these videos
    const progress = await Progress.find({ userId, courseId });
    const progressMap = progress.reduce((acc, p) => {
      acc[p.videoId.toString()] = p.progress;
      return acc;
    }, {});

    // 3. Check if all videos are completed
    const allVideosCompleted = videoIds.every(
      (videoId) => progressMap[videoId] >= 90
    );
    req.quizId = course.quiz;
    allVideosCompleted
      ? next()
      : res
          .status(401)
          .json({ massage: "You must Complete The Course before The Quiz" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Err We cant check The course", err: error.message });
  }
};

// import { useState, useEffect } from 'react';
// import { useRouter } from 'next/router';
// import axios from 'axios';

// const VideoPlayer = ({ videoUrl, courseId, videoId }) => {
//   const router = useRouter();
//   const [progress, setProgress] = useState(0);

//   const handleProgress = (event) => {
//     const percent = (event.target.currentTime / event.target.duration) * 100;
//     setProgress(percent);

//     // Save progress when it exceeds certain thresholds (e.g., every 10%)
//     if (percent % 10 === 0) {
//       axios.post('/api/progress', { courseId, videoId, progress: percent });
//     }
//   };

//   const handleEnded = () => {
//     axios.post('/api/progress', { courseId, videoId, progress: 100 });
//     router.push('/quiz'); // Automatically redirect to quiz if course finishes
//   };

//   return (
//     <video
//       src={videoUrl}
//       onTimeUpdate={handleProgress}
//       onEnded={handleEnded}
//       controls
//       className="w-full h-auto"
//     />
//   );
// };

// export default VideoPlayer;
