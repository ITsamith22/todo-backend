const User = require('../models/User');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

// @desc    Get user profile
// @route   GET /api/user/profile
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/user/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { username, email } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if username already exists (excluding current user)
    if (username && username !== user.username) {
      const usernameExists = await User.findOne({ 
        username, 
        _id: { $ne: user._id } 
      });
      if (usernameExists) {
        return res.status(400).json({
          success: false,
          message: 'Username already exists'
        });
      }
    }

    // Check if email already exists (excluding current user)
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ 
        email, 
        _id: { $ne: user._id } 
      });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }
    }

    // Update user fields
    if (username) user.username = username;
    if (email) user.email = email;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Update profile image
// @route   PUT /api/user/profile-image
// @access  Private
exports.updateProfileImage = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please select an image file'
      });
    }

    // Delete old profile image if it's not the default
    if (user.profileImage && user.profileImage !== 'default-profile.png') {
      const oldImagePath = path.join(__dirname, '../uploads', user.profileImage);
      fs.unlink(oldImagePath, (err) => {
        if (err) console.log('Error deleting old profile image:', err);
      });
    }

    // Update profile image path
    user.profileImage = `profiles/${req.file.filename}`;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile image updated successfully',
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage,
        profileImageUrl: `${req.protocol}://${req.get('host')}/uploads/${user.profileImage}`
      }
    });
  } catch (error) {
    // If there was an error and a file was uploaded, delete it
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.log('Error deleting uploaded file:', err);
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Change password
// @route   PUT /api/user/change-password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current password, new password, and confirm password'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password and confirm password do not match'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    // Get user with password
    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check current password
    const isCurrentPasswordCorrect = await user.matchPassword(currentPassword);
    if (!isCurrentPasswordCorrect) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Delete user account
// @route   DELETE /api/user/account
// @access  Private
exports.deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your password to confirm account deletion'
      });
    }

    // Get user with password
    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify password
    const isPasswordCorrect = await user.matchPassword(password);
    if (!isPasswordCorrect) {
      return res.status(400).json({
        success: false,
        message: 'Incorrect password'
      });
    }

    // Delete profile image if it's not the default
    if (user.profileImage && user.profileImage !== 'default-profile.png') {
      const imagePath = path.join(__dirname, '../uploads', user.profileImage);
      fs.unlink(imagePath, (err) => {
        if (err) console.log('Error deleting profile image:', err);
      });
    }

    // Delete all user's todos
    const Todo = require('../models/Todo');
    await Todo.deleteMany({ userId: user._id });

    // Delete user account
    await User.findByIdAndDelete(user._id);

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get user statistics
// @route   GET /api/user/stats
// @access  Private
exports.getUserStats = async (req, res) => {
  try {
    const Todo = require('../models/Todo');
    const userId = req.user._id;

    // Get user registration date
    const user = await User.findById(userId).select('createdAt');
    
    // Calculate days since registration
    const daysSinceRegistration = Math.floor(
      (Date.now() - user.createdAt) / (1000 * 60 * 60 * 24)
    );

    // Get todo statistics
    const todoStats = await Todo.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: null,
          totalTodos: { $sum: 1 },
          completedTodos: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          pendingTodos: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          highPriorityTodos: {
            $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] }
          }
        }
      }
    ]);

    const stats = todoStats.length > 0 ? todoStats[0] : {
      totalTodos: 0,
      completedTodos: 0,
      pendingTodos: 0,
      highPriorityTodos: 0
    };

    // Calculate completion rate
    const completionRate = stats.totalTodos > 0 
      ? Math.round((stats.completedTodos / stats.totalTodos) * 100) 
      : 0;

    res.status(200).json({
      success: true,
      data: {
        user: {
          username: req.user.username,
          email: req.user.email,
          memberSince: user.createdAt,
          daysSinceRegistration
        },
        todoStats: {
          ...stats,
          completionRate: `${completionRate}%`
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};