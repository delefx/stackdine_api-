const Location = require('../models/Location.model');
const Table = require('../models/Table.model');
const User = require('../models/User.model');

// @desc    Get all locations
// @route   GET /api/locations
// @access  Private (admin only)
exports.getAllLocations = async (req, res) => {
  try {
    const locations = await Location.find().populate('manager', 'name email');
    res.status(200).json({ success: true, count: locations.length, data: locations });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single location
// @route   GET /api/locations/:id
// @access  Private (admin only)
exports.getLocation = async (req, res) => {
  try {
    const location = await Location.findById(req.params.id).populate('manager', 'name email');
    if (!location) {
      return res.status(404).json({ message: 'Location not found' });
    }
    res.status(200).json({ success: true, data: location });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create location
// @route   POST /api/locations
// @access  Private (admin only)
exports.createLocation = async (req, res) => {
  try {
    const location = await Location.create(req.body);
    res.status(201).json({ success: true, data: location });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update location
// @route   PUT /api/locations/:id
// @access  Private (admin only)
exports.updateLocation = async (req, res) => {
  try {
    const location = await Location.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!location) {
      return res.status(404).json({ message: 'Location not found' });
    }
    res.status(200).json({ success: true, data: location });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete location
// @route   DELETE /api/locations/:id
// @access  Private (admin only)
exports.deleteLocation = async (req, res) => {
  try {
    const location = await Location.findById(req.params.id);
    if (!location) {
      return res.status(404).json({ message: 'Location not found' });
    }
    
    // Check for active tables
    const tablesCount = await Table.countDocuments({ location: req.params.id });
    if (tablesCount > 0) {
      return res.status(400).json({ message: 'Cannot delete location with existing tables' });
    }
    
    // Check for staff
    const staffCount = await User.countDocuments({ location: req.params.id });
    if (staffCount > 0) {
      return res.status(400).json({ message: 'Cannot delete location with assigned staff' });
    }

    await location.deleteOne();
    res.status(200).json({ success: true, message: 'Location deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle location status
// @route   PATCH /api/locations/:id/status
// @access  Private (admin only)
exports.toggleLocationStatus = async (req, res) => {
  try {
    const location = await Location.findById(req.params.id);
    if (!location) {
      return res.status(404).json({ message: 'Location not found' });
    }
    
    location.isActive = !location.isActive;
    await location.save();
    
    res.status(200).json({ success: true, data: location });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
