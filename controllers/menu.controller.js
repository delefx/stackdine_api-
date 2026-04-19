const MenuItem = require('../models/MenuItem.model');
const cloudinary = require('../config/cloudinary');

// @desc    Get all menu items
// @route   GET /api/menu
// @access  Public
exports.getAllMenuItems = async (req, res) => {
  try {
    const { category, isAvailable, location } = req.query;
    const filter = {};

    if (category) filter.category = category;
    if (isAvailable) filter.isAvailable = isAvailable === 'true';
    if (location) filter.location = location;

    const menuItems = await MenuItem.find(filter)
      .populate('createdBy', 'name')
      .populate('location', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: menuItems.length,
      data: menuItems,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single menu item
// @route   GET /api/menu/:id
// @access  Public
exports.getMenuItem = async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id)
      .populate('createdBy', 'name')
      .populate('location', 'name');

    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    res.status(200).json({
      success: true,
      data: menuItem,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create menu item
// @route   POST /api/menu
// @access  Private (admin only)
exports.createMenuItem = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      isAvailable,
      preparationTime,
      location,
    } = req.body;

    let image = {};
    if (req.file) {
      image = {
        public_id: req.file.filename,
        url: req.file.path,
      };
    }

    const menuItem = await MenuItem.create({
      name,
      description,
      price,
      category,
      isAvailable,
      preparationTime,
      location,
      image,
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      data: menuItem,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update menu item
// @route   PUT /api/menu/:id
// @access  Private (admin only)
exports.updateMenuItem = async (req, res) => {
  try {
    let menuItem = await MenuItem.findById(req.params.id);

    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    if (req.file) {
      if (menuItem.image && menuItem.image.public_id) {
        await cloudinary.uploader.destroy(menuItem.image.public_id);
      }
      req.body.image = {
        public_id: req.file.filename,
        url: req.file.path,
      };
    }

    menuItem = await MenuItem.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: menuItem,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete menu item
// @route   DELETE /api/menu/:id
// @access  Private (admin only)
exports.deleteMenuItem = async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);

    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    if (menuItem.image && menuItem.image.public_id) {
      await cloudinary.uploader.destroy(menuItem.image.public_id);
    }

    await menuItem.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Menu item deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle menu item availability
// @route   PATCH /api/menu/:id/availability
// @access  Private (admin, staff)
exports.toggleAvailability = async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);

    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    menuItem.isAvailable = !menuItem.isAvailable;
    await menuItem.save();

    res.status(200).json({
      success: true,
      message: `Menu item is now ${menuItem.isAvailable ? 'available' : 'unavailable'}`,
      data: menuItem,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};