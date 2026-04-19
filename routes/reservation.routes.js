const express = require('express');
const router = express.Router();
const {
  createReservation,
  getAllReservations,
  getMyReservations,
  getReservation,
  updateReservationStatus,
  cancelReservation,
} = require('../controllers/reservation.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.post('/', protect, authorize('customer', 'staff'), createReservation);
router.get('/', protect, authorize('admin', 'staff'), getAllReservations);
router.get('/myreservations', protect, authorize('customer'), getMyReservations);
router.get('/:id', protect, getReservation);
router.patch('/:id/status', protect, authorize('admin', 'staff'), updateReservationStatus);
router.patch('/:id/cancel', protect, cancelReservation);

module.exports = router;