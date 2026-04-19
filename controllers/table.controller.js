const Table = require('../models/Table.model');
const Reservation = require('../models/Reservation.model');

// @desc    Get all tables
// @route   GET /api/tables
// @access  Private (admin, staff)
exports.getAllTables = async (req, res) => {
  try {
    const { status, location } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (location) filter.location = location;

    const tables = await Table.find(filter)
      .populate('currentOrder', 'status totalAmount orderType')
      .populate('location', 'name')
      .sort({ tableNumber: 1 });

    res.status(200).json({
      success: true,
      count: tables.length,
      data: tables,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single table
// @route   GET /api/tables/:id
// @access  Private (admin, staff)
exports.getTable = async (req, res) => {
  try {
    const table = await Table.findById(req.params.id)
      .populate('currentOrder', 'status totalAmount orderType items')
      .populate('location', 'name');

    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    res.status(200).json({
      success: true,
      data: table,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create table
// @route   POST /api/tables
// @access  Private (admin only)
exports.createTable = async (req, res) => {
  try {
    const { tableNumber, capacity, location } = req.body;

    const tableExists = await Table.findOne({ tableNumber, location });
    if (tableExists) {
      return res.status(400).json({ message: 'Table number already exists in this location' });
    }

    const table = await Table.create({ tableNumber, capacity, location });

    res.status(201).json({
      success: true,
      data: table,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update table
// @route   PUT /api/tables/:id
// @access  Private (admin only)
exports.updateTable = async (req, res) => {
  try {
    const table = await Table.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    res.status(200).json({
      success: true,
      data: table,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete table
// @route   DELETE /api/tables/:id
// @access  Private (admin only)
exports.deleteTable = async (req, res) => {
  try {
    const table = await Table.findById(req.params.id);

    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    if (table.status === 'occupied') {
      return res.status(400).json({ message: 'Cannot delete an occupied table' });
    }

    await table.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Table deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Assign table to walk-in customer
// @route   PATCH /api/tables/:id/assign
// @access  Private (admin, staff)
exports.assignTable = async (req, res) => {
  try {
    const table = await Table.findById(req.params.id);

    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    if (table.status !== 'available') {
      return res.status(400).json({ message: `Table is currently ${table.status}` });
    }

    table.status = 'occupied';
    await table.save();

    res.status(200).json({
      success: true,
      message: 'Table assigned successfully',
      data: table,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Free up a table
// @route   PATCH /api/tables/:id/free
// @access  Private (admin, staff)
exports.freeTable = async (req, res) => {
  try {
    const table = await Table.findById(req.params.id);

    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    table.status = 'available';
    table.currentOrder = null;
    await table.save();

    res.status(200).json({
      success: true,
      message: 'Table is now available',
      data: table,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get available tables for reservation
// @route   GET /api/tables/available
// @access  Public
exports.getAvailableTables = async (req, res) => {
  try {
    const { capacity, location } = req.query;
    const filter = { status: 'available', isActive: true };

    if (capacity) filter.capacity = { $gte: parseInt(capacity) };
    if (location) filter.location = location;

    const tables = await Table.find(filter)
      .populate('location', 'name address')
      .sort({ capacity: 1 });

    res.status(200).json({
      success: true,
      count: tables.length,
      data: tables,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};