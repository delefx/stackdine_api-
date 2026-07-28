const express = require('express');
const router = express.Router();
const {
  getAllLocations,
  getLocation,
  createLocation,
  updateLocation,
  deleteLocation,
  toggleLocationStatus,
} = require('../controllers/location.controller');

const { protect, authorize } = require('../middleware/auth.middleware');

// Protect all routes and restrict to admin
router.use(protect);
router.use(authorize('admin'));

router.route('/')
  .get(getAllLocations)
  .post(createLocation);

router.route('/:id')
  .get(getLocation)
  .put(updateLocation)
  .delete(deleteLocation);

router.patch('/:id/status', toggleLocationStatus);

module.exports = router;
