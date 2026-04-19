const express = require('express');
const router = express.Router();
const {
  placeOrder,
  getAllOrders,
  getOrder,
  getMyOrders,
  updateOrderStatus,
  cancelOrder,
} = require('../controllers/order.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.post('/', protect, authorize('customer', 'staff'), placeOrder);
router.get('/', protect, authorize('admin', 'staff'), getAllOrders);
router.get('/myorders', protect, authorize('customer'), getMyOrders);
router.get('/:id', protect, getOrder);
router.patch('/:id/status', protect, authorize('admin', 'staff'), updateOrderStatus);
router.patch('/:id/cancel', protect, cancelOrder);

module.exports = router;