// const MenuItem = require('../models/MenuItem.model');
// const cloudinary = require('../config/cloudinary');

// // @desc    Get all menu items
// // @route   GET /api/menu
// // @access  Public
// exports.getAllMenuItems = async (req, res) => {
//   try {
//     const { category, isAvailable, location } = req.query;
//     const filter = {};

//     if (category) filter.category = category;
//     if (isAvailable) filter.isAvailable = isAvailable === 'true';
//     if (location) filter.location = location;

//     const menuItems = await MenuItem.find(filter)
//       .populate('createdBy', 'name')
//       .populate('location', 'name')
//       .sort({ createdAt: -1 });

//     res.status(200).json({
//       success: true,
//       count: menuItems.length,
//       data: menuItems,
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // @desc    Get single menu item
// // @route   GET /api/menu/:id
// // @access  Public
// exports.getMenuItem = async (req, res) => {
//   try {
//     const menuItem = await MenuItem.findById(req.params.id)
//       .populate('createdBy', 'name')
//       .populate('location', 'name');

//     if (!menuItem) {
//       return res.status(404).json({ message: 'Menu item not found' });
//     }

//     res.status(200).json({
//       success: true,
//       data: menuItem,
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // @desc    Create menu item
// // @route   POST /api/menu
// // @access  Private (admin only)
// exports.createMenuItem = async (req, res) => {
//   try {
//     const {
//       name,
//       description,
//       price,
//       category,
//       isAvailable,
//       preparationTime,
//       location,
//     } = req.body;

//     let image = {};
//     if (req.file) {
//       image = {
//         public_id: req.file.filename,
//         url: req.file.path,
//       };
//     }

//     const menuItem = await MenuItem.create({
//       name,
//       description,
//       price,
//       category,
//       isAvailable,
//       preparationTime,
//       location,
//       image,
//       createdBy: req.user.id,
//     });

//     res.status(201).json({
//       success: true,
//       data: menuItem,
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // @desc    Update menu item
// // @route   PUT /api/menu/:id
// // @access  Private (admin only)
// exports.updateMenuItem = async (req, res) => {
//   try {
//     let menuItem = await MenuItem.findById(req.params.id);

//     if (!menuItem) {
//       return res.status(404).json({ message: 'Menu item not found' });
//     }

//     if (req.file) {
//       if (menuItem.image && menuItem.image.public_id) {
//         await cloudinary.uploader.destroy(menuItem.image.public_id);
//       }
//       req.body.image = {
//         public_id: req.file.filename,
//         url: req.file.path,
//       };
//     }

//     menuItem = await MenuItem.findByIdAndUpdate(req.params.id, req.body, {
//       new: true,
//       runValidators: true,
//     });

//     res.status(200).json({
//       success: true,
//       data: menuItem,
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // @desc    Delete menu item
// // @route   DELETE /api/menu/:id
// // @access  Private (admin only)
// exports.deleteMenuItem = async (req, res) => {
//   try {
//     const menuItem = await MenuItem.findById(req.params.id);

//     if (!menuItem) {
//       return res.status(404).json({ message: 'Menu item not found' });
//     }

//     // 1. OPTIONAL: Check if item is in active orders
//     // const isInOrder = await Order.findOne({ "items.menuItem": req.params.id });
//     // if (isInOrder) {
//     //   return res.status(400).json({ message: 'Cannot delete item that exists in orders. Try "archiving" it instead.' });
//     // }

//     // 2. Delete from Cloudinary
//     if (menuItem.image?.public_id) {
//       // Use await to ensure Cloudinary finishes before we move on
//       await cloudinary.uploader.destroy(menuItem.image.public_id);
//     }

//     // 3. Delete from Database
//     await MenuItem.findByIdAndDelete(req.params.id);

//     res.status(200).json({
//       success: true,
//       message: 'Menu item and associated image deleted successfully',
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // @desc    Toggle menu item availability
// // @route   PATCH /api/menu/:id/availability
// // @access  Private (admin, staff)
// exports.toggleAvailability = async (req, res) => {
//   try {
//     const menuItem = await MenuItem.findById(req.params.id);

//     if (!menuItem) {
//       return res.status(404).json({ message: 'Menu item not found' });
//     }

//     menuItem.isAvailable = !menuItem.isAvailable;
//     await menuItem.save();

//     res.status(200).json({
//       success: true,
//       message: `Menu item is now ${menuItem.isAvailable ? 'available' : 'unavailable'}`,
//       data: menuItem,
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };





const MenuItem = require('../models/MenuItem.model');
const { cloudinary, upload } = require('../config/cloudinary');

// @desc    Get all menu items
// @route   GET /api/menu
// @access  Public
exports.getAllMenuItems = async (req, res) => {
  try {
    const { category, isAvailable } = req.query;
    // FIX: removed location filter and populate — same issue as inventory
    const filter = {};

    if (category) filter.category = category;
    if (isAvailable) filter.isAvailable = isAvailable === 'true';

    const menuItems = await MenuItem.find(filter)
      .populate('createdBy', 'name')
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
    // FIX: removed .populate('location', 'name')
    const menuItem = await MenuItem.findById(req.params.id)
      .populate('createdBy', 'name');

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
    } = req.body;
    // FIX: removed location from destructuring

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

    if (menuItem.image?.public_id) {
      await cloudinary.uploader.destroy(menuItem.image.public_id);
    }

    await MenuItem.findByIdAndDelete(req.params.id);

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