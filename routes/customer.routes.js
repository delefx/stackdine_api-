const express = require('express');
const router = express.Router();
const {
  getAllCustomers,
  getCustomer,
  getMyProfile,
  updateMyProfile,
  submitFeedback,
  toggleBlacklist,
  getCustomerSegments,
} = require('../controllers/customer.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.get('/me', protect, authorize('customer'), getMyProfile);
router.put('/me', protect, authorize('customer'), updateMyProfile);
router.post('/feedback', protect, authorize('customer'), submitFeedback);
router.get('/segments', protect, authorize('admin'), getCustomerSegments);
router.get('/', protect, authorize('admin', 'staff'), getAllCustomers);
router.get('/:id', protect, authorize('admin', 'staff'), getCustomer);
router.patch('/:id/blacklist', protect, authorize('admin'), toggleBlacklist);

module.exports = router;