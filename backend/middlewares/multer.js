// middlewares/multer.js
import multer from "multer";

const storage = multer.memoryStorage();

export const singleUpload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images and PDF files
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
}).fields([
  { name: 'profilePhoto', maxCount: 1 },
  { name: 'file', maxCount: 1 } 
]);