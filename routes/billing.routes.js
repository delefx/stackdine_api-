// const express = require('express');
// const router = express.Router();
// const {
//   generateBill,
//   processPayment,
//   getAllBills,
//   getBill,
//   refundBill,
// } = require('../controllers/billing.controller');
// const { protect, authorize } = require('../middleware/auth.middleware');

// router.post('/generate/:orderId', protect, authorize('admin', 'staff'), generateBill);
// router.get('/', protect, authorize('admin', 'staff'), getAllBills);
// router.get('/:id', protect, getBill);
// router.patch('/:id/pay', protect, authorize('admin', 'staff'), processPayment);
// router.patch('/:id/refund', protect, authorize('admin'), refundBill);

// module.exports = router;

const express = require('express');
const router = express.Router();
const {
  generateBill,
  processPayment,
  getAllBills,
  getBill,
  refundBill,
  getMyBills,
} = require('../controllers/billing.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.get('/mybills', protect, authorize('customer'), getMyBills);
router.post('/generate/:orderId', protect, authorize('admin', 'staff'), generateBill);
router.get('/', protect, authorize('admin', 'staff'), getAllBills);
router.get('/:id', protect, getBill);
router.patch('/:id/pay', protect, authorize('admin', 'staff'), processPayment);
router.patch('/:id/refund', protect, authorize('admin'), refundBill);

module.exports = router;