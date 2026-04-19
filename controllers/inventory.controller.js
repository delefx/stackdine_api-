const Inventory = require('../models/Inventory.model');
 
// @desc    Get all inventory items
// @route   GET /api/inventory
// @access  Private (admin, staff)
exports.getAllInventory = async (req, res) => {
  try {
    const { category, isLowStock } = req.query;
    const filter = {};
 
    if (category) filter.category = category;
    if (isLowStock) filter.isLowStock = isLowStock === 'true';
 
    const inventory = await Inventory.find(filter).sort({ name: 1 });
 
    res.status(200).json({
      success: true,
      count: inventory.length,
      data: inventory,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
 
// @desc    Get single inventory item
// @route   GET /api/inventory/:id
// @access  Private (admin, staff)
exports.getInventoryItem = async (req, res) => {
  try {
    // FIX: was accidentally copy-pasted as Inventory.find(filter) — should be findById
    const item = await Inventory.findById(req.params.id);
 
    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }
 
    res.status(200).json({
      success: true,
      data: item,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
 
// @desc    Create inventory item
// @route   POST /api/inventory
// @access  Private (admin only)
exports.createInventoryItem = async (req, res) => {
  try {
    const item = await Inventory.create(req.body);
 
    res.status(201).json({
      success: true,
      data: item,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
 
// @desc    Update inventory item
// @route   PUT /api/inventory/:id
// @access  Private (admin only)
exports.updateInventoryItem = async (req, res) => {
  try {
    const item = await Inventory.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
 
    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }
 
    res.status(200).json({
      success: true,
      data: item,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
 
// @desc    Delete inventory item
// @route   DELETE /api/inventory/:id
// @access  Private (admin only)
exports.deleteInventoryItem = async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id);
 
    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }
 
    await item.deleteOne();
 
    res.status(200).json({
      success: true,
      message: 'Inventory item deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
 
// @desc    Restock inventory item
// @route   PATCH /api/inventory/:id/restock
// @access  Private (admin, staff)
exports.restockItem = async (req, res) => {
  try {
    const { quantity } = req.body;
 
    const item = await Inventory.findById(req.params.id);
 
    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }
 
    // FIX: cast to Number to prevent string concatenation bug
    item.quantity += Number(quantity);
    item.lastRestockedAt = Date.now();
    await item.save();
 
    res.status(200).json({
      success: true,
      message: `Restocked ${quantity} ${item.unit} of ${item.name}`,
      data: item,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
 
// @desc    Get low stock items
// @route   GET /api/inventory/lowstock
// @access  Private (admin, staff)
exports.getLowStockItems = async (req, res) => {
  try {
    // FIX: removed location filter and populate — location removed from inventory
    const filter = { isLowStock: true };
 
    const items = await Inventory.find(filter).sort({ quantity: 1 });
 
    res.status(200).json({
      success: true,
      count: items.length,
      data: items,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};