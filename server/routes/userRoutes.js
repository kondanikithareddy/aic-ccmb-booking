const express = require('express');
const router = express.Router();
const { getAllUsers, updateUserRole, deleteUser, approveUser, rejectUser } = require('../controllers/userController');
const { protect, admin } = require('../middleware/authMiddleware');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
router.route('/').get(protect, admin, getAllUsers);

// @desc    Update a user's role
// @route   PUT /api/users/:id/role
// @access  Private/Admin
router.route('/:id/role').put(protect, admin, updateUserRole);
router.route('/:id').delete(protect, admin, deleteUser);
router.route('/:id/approve').put(protect, admin, approveUser);
router.route('/:id/reject').put(protect, admin, rejectUser); // <-- ADD THIS


module.exports = router;