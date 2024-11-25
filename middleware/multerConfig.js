import multer from "multer";
import path from "path";
import fs from "fs";

const __dirname = path.dirname(new URL(import.meta.url).pathname);
// Memory storage for small files
const memoryStorage = multer.memoryStorage();

// Export a single file upload middleware
export const upload = multer({ storage: memoryStorage }); // For single file uploads

export const uploadPdfThumbnail = multer({ storage: memoryStorage }).fields([
  { name: "pdf", maxCount: 1 }, // Allow one video file
  { name: "thumbnail", maxCount: 1 }, // Allow one thumbnail file
]);

// Disk storage for large files
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.resolve(__dirname, "uploads"); // Absolute path for the uploads folder
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true }); // Create the directory if it doesn't exist
    }
    cb(null, uploadDir); // Save files to the "uploads" directory
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // Create unique filenames
  },
});

// Multer middleware for large files
export const uploadLargeFile = multer({
  storage: diskStorage,
  limits: { fileSize: 10 * 1024 * 1024 * 1024 }, // Set max file size (10 GB)
});
