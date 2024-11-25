import Quiz from "../models/Quiz.js";
import QuizResponse from "../models/QuizResponse.js";
import Course from "../models/Course.js";
// import { PDFDocument, rgb } from "pdf-lib";
import { transporter } from "../utitlitis/sendMail.js";
import User from "../models/User.js";
import fs from "fs";
import path from "path";
import { PassThrough } from "stream";
import PDFDocument from "pdfkit";
import uploadToSpaces from "../utitlitis/awsDigitalOcean.js";

const rootDir = path.resolve();

export const CreateQuiz = async (req, res) => {
  try {
    const { name, questions } = req.body;
    const quiz = await Quiz.create({ name, questions });
    if (!quiz) res.status(404).json({ message: "Failing Creating The quiz" });
    res.status(200).json({ message: "Quiz created successfully", quiz });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failing Creating The quiz", err: error.message });
  }
};

const generateCertificate = async (user, courseTitle) => {
  const doc = new PDFDocument({
    layout: "landscape",
    size: "A4",
  });

  // Generate the file path for saving
  const date = new Date();
  const pdfFileName = `${user._id}_${date.getTime()}.pdf`;

  // Create a stream to hold the PDF data in memory
  const pdfChunks = [];
  const stream = doc.pipe(new PassThrough());

  // Handle streaming data
  stream.on("data", (chunk) => {
    if (chunk instanceof Buffer) {
      pdfChunks.push(chunk); // Only push Buffer instances directly to our buffer array
    } else if (chunk instanceof ArrayBuffer) {
      pdfChunks.push(Buffer.from(chunk)); // Convert ArrayBuffer to Buffer if necessary
    } else {
      console.error("Unexpected chunk type:", chunk.constructor.name);
    }
  });

  // Add background image and text content before closing the document
  const imagePath = path.join(rootDir, "certifivateTemplate", "CanvaGen.png");

  // Add background image to the document
  doc.image(imagePath, 0, 0, {
    width: 842,
  });

  // Add course title
  const pageWidth = doc.page.width; // A4 landscape width
  const pageHeight = 595; // A4 landscape height
  doc
    .font(path.join(rootDir, "fonts", "OpenSans-VariableFont_wdth,wght.ttf"))
    .fontSize(50)
    .text(
      courseTitle.toLowerCase(),
      pageWidth / 2 - (doc.fontSize(50).widthOfString(courseTitle) + 100) / 2,
      140,
      {
        align: "center",
        width: doc.fontSize(50).widthOfString(courseTitle) + 100,
      }
    );

  // Format the current date
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);

  // Add user's name and date
  doc
    .fontSize(40)
    .text(
      `${user.firstName} ${user.lastName}`,
      pageWidth / 2 -
        (doc.fontSize(40).widthOfString(`${user.firstName} ${user.lastName}`) +
          100) /
          2,
      275,
      {
        align: "center",
        width:
          doc.fontSize(40).widthOfString(`${user.firstName} ${user.lastName}`) +
          100,
      }
    );

  doc
    .fontSize(20)
    .text(
      formattedDate,
      pageWidth / 2 - (doc.fontSize(20).widthOfString(formattedDate) + 100) / 2,
      340,
      {
        align: "center",
        width: doc.fontSize(20).widthOfString(formattedDate) + 100,
      }
    );
  doc
    .fontSize(10)
    .fillColor("white")
    .text(pdfFileName.split(".")[0], 0, pageHeight - 40, {
      align: "center",
      width: doc.fontSize(10).widthOfString(pdfFileName.split(".")[0]) + 20,
      height: 70,
    });

  // Add another text, e.g. "BSESA"
  doc
    .font(path.join(rootDir, "fonts", "Creattion Demo.otf"))
    .fontSize(50)
    .fillColor("black")
    .text(
      "BSESA",
      pageWidth / 2 - (doc.fontSize(50).widthOfString("BSESA") + 100) / 2,
      425,
      {
        align: "center",
        width: doc.fontSize(50).widthOfString("BSESA") + 80,
        height: doc.fontSize(50).heightOfString("BSESA"),
      }
    );

  // Ensure the PDF is fully written before ending the document
  doc.end();

  // Wait until the PDF generation is complete and buffer it
  await new Promise((resolve) => stream.on("end", resolve));

  // Ensure chunks are concatenated into a Buffer
  const pdfBuffer = Buffer.concat(pdfChunks);

  const uploadResult = await uploadToSpaces(
    {
      buffer: pdfBuffer,
      originalname: pdfFileName,
      mimetype: "application/pdf",
    },
    "/Certificates"
  );

  return { pdfUrl: uploadResult };
};

export const saveQuizResponse = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { courseId, responses } = req.body;
    const userId = req.user.id;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    let correctAnswers = 0;

    responses.forEach((response) => {
      const question = quiz.questions.find(
        (q) => q._id.toString() === response.questionId
      );
      const correctOption = question.options.find((opt) => opt.isCorrect);

      if (correctOption && correctOption.text === response.selectedOption) {
        correctAnswers++;
      }
    });

    const totalQuestions = quiz.questions.length;
    const score = (correctAnswers / totalQuestions) * 100;
    const passed = score >= 70; // Example passing score

    const existingResponse = await QuizResponse.findOne({ quizId, userId });
    if (existingResponse) {
      if (!existingResponse.passed) {
        await QuizResponse.deleteOne({ _id: existingResponse._id });
      }
    }

    let certificateUrl = null;
    if (passed) {
      const user = await User.findById(userId);
      const course = await Course.findById(courseId);
      const { pdfUrl } = await generateCertificate(user, course.title);
      certificateUrl = pdfUrl;

      await transporter.sendMail({
        from: `Elearning <${process.env.SMTP_MAIL}>`,
        to: user.email,
        subject: "Your Course Completion Certificate",
        text: `Dear ${user.firstName},\n\nCongratulations on completing the course!`,
        attachments: [
          {
            filename: `${user.firstName}-certificate.pdf`,
            path: certificateUrl, // Send the URL of the uploaded certificate
          },
        ],
      });
    }

    const quizResponse = new QuizResponse({
      courseId,
      quizId,
      userId,
      responses,
      score,
      passed,
      certificate: certificateUrl,
    });

    await quizResponse.save();

    if (quizResponse.passed) {
      return res.status(200).json({
        score,
        passed,
        message: "Please check your email for the certificate.",
      });
    }
    return res.status(200).json({
      score,
      passed,
      message: "You failed, please try again tomorrow.",
    });
  } catch (error) {
    console.error("Error submitting quiz:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error", err: error.message });
  }
};

export const CheckLastTimeQuiz = async (req, res, next) => {
  try {
    const { quizId } = req.params;
    const { courseId } = req.body;
    const userId = req.user.id;
    const now = new Date();
    const checkPassed = await QuizResponse.findOne({
      quizId,
      courseId,
      userId,
    })
      .sort({ createdAt: -1 }) // Sort by createdAt in descending order
      .lean(); // Use lean for better performance

    if (checkPassed && checkPassed.passed)
      return res
        .status(401)
        .json({ message: "You have passed the Quiz Already You Can't Repeat" });

    if (checkPassed) {
      const oneDayLater = new Date(checkPassed.createdAt);
      oneDayLater.setDate(oneDayLater.getDate() + 1);
      if (now < oneDayLater) {
        const timeLeft = oneDayLater - now;
        const hoursLeft = Math.ceil(timeLeft / (1000 * 60 * 60));
        return res.status(403).json({
          message: `You must wait ${hoursLeft} hour(s) before retaking this quiz.`,
        });
      }
    }
    next();
  } catch (error) {
    res.status(500).json({ message: "Error Server", err: error.message });
  }
};

export const addQuizToCourse = async (req, res) => {
  try {
    const { quizId, courseId } = req.body;

    const updatedCourse = await Course.findByIdAndUpdate(
      courseId,
      { $set: { quiz: quizId } },
      { new: true }
    );

    if (!updatedCourse) {
      return res.status(404).json({ message: "Course not found" });
    }

    res.status(200).json({
      message: "Quiz added to Course successfully",
      course: updatedCourse,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Quiz failed to add", error: error.message });
  }
};

export const getQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.quizId).lean();
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    quiz.questions.forEach((q) => {
      q.options = q.options.map(({ text }) => ({ text }));
    });

    res.status(200).json({ quiz });
  } catch (error) {
    res.status(500).json({ message: "Server Error", err: error.message });
  }
};
