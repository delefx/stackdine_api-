const express = require('express');
const router = express.Router();
const {
  getAllMenuItems,
  getMenuItem,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleAvailability,
} = require('../controllers/menu.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const { upload } = require('../config/cloudinary');

router.get('/', getAllMenuItems);
router.get('/:id', getMenuItem);
router.post('/', protect, authorize('admin'), upload.single('image'), createMenuItem);
router.put('/:id', protect, authorize('admin'), upload.single('image'), updateMenuItem);
router.delete('/:id', protect, authorize('admin'), deleteMenuItem);
router.patch('/:id/availability', protect, authorize('admin', 'staff'), toggleAvailability);

module.exports = router;