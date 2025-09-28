const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads/profiles');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Create unique filename: userId-timestamp.extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname).toLowerCase();
    cb(null, `${req.user ? req.user._id : 'temp'}-${uniqueSuffix}${extension}`);
  }
});

// More flexible file filter
const fileFilter = (req, file, cb) => {
  console.log('File upload details:', {
    originalname: file.originalname,
    mimetype: file.mimetype,
    fieldname: file.fieldname
  });

  // Allow common image types - more comprehensive list
  const allowedMimes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
    'image/bmp',
    'image/tiff'
  ];

  // Also check file extensions as fallback
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff'];
  const fileExtension = path.extname(file.originalname).toLowerCase();

  // Check both MIME type and extension (more flexible)
  const isValidMime = allowedMimes.includes(file.mimetype);
  const isValidExtension = allowedExtensions.includes(fileExtension);

  if (isValidMime || isValidExtension) {
    console.log('File accepted:', file.originalname);
    return cb(null, true);
  } else {
    console.log('File rejected:', {
      mimetype: file.mimetype,
      extension: fileExtension,
      originalname: file.originalname
    });
    return cb(new Error(`Invalid file type. Received MIME type: ${file.mimetype}, Extension: ${fileExtension}. Only image files are allowed.`));
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});

// Middleware for single profile image upload
const uploadProfileImage = upload.single('profileImage');

// Enhanced error handling middleware for multer
const handleUploadError = (err, req, res, next) => {
  console.log('Upload error occurred:', err);
  
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 5MB'
      });
    }
    return res.status(400).json({
      success: false,
      message: `Upload error: ${err.message}`
    });
  }
  
  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  
  next();
};

module.exports = {
  uploadProfileImage,
  handleUploadError
};