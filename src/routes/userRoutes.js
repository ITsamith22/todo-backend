const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  updateProfileImage,
  changePassword,
  deleteAccount,
  getUserStats
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { uploadProfileImage, handleUploadError } = require('../middleware/uploadMiddleware');

// All routes are protected (require authentication)
router.use(protect);

// Profile routes
router.route('/profile')
  .get(getProfile)        // GET /api/user/profile - Get user profile
  .put(updateProfile);    // PUT /api/user/profile - Update user profile

// Profile image route
router.put('/profile-image', uploadProfileImage, handleUploadError, updateProfileImage);

// Password change route
router.put('/change-password', changePassword);

// User statistics route
router.get('/stats', getUserStats);

// Delete account route
router.delete('/account', deleteAccount);

module.exports = router;