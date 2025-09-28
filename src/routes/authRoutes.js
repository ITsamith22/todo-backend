const express = require('express');
const router = express.Router();
const { register, login, getMe, updateProfile } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { uploadProfileImage, handleUploadError } = require('../middleware/uploadMiddleware');

// Register route with optional profile image upload
router.post('/register', uploadProfileImage, handleUploadError, register);

// Login route
router.post('/login', login);

// Get current user profile
router.get('/me', protect, getMe);

// Update user profile with optional image upload
router.put('/profile', protect, uploadProfileImage, handleUploadError, updateProfile);

module.exports = router;