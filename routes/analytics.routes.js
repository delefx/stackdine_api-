const express = require('express');
const router = express.Router();
const {
  getSalesSummary,
  getMenuPopularity,
  getOrderStats,
  getCustomerAnalytics,
  getReservationAnalytics,
  getLocationComparison,
} = require('../controllers/analytics.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.get('/sales', protect, authorize('admin'), getSalesSummary);
router.get('/menu-popularity', protect, authorize('admin'), getMenuPopularity);
router.get('/orders', protect, authorize('admin'), getOrderStats);
router.get('/customers', protect, authorize('admin'), getCustomerAnalytics);
router.get('/reservations', protect, authorize('admin'), getReservationAnalytics);
router.get('/locations', protect, authorize('admin'), getLocationComparison);

module.exports = router;