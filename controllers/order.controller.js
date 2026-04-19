const Order = require('../models/Order.model');
const MenuItem = require('../models/MenuItem.model');
const Customer = require('../models/Customer.model');
const Table = require('../models/Table.model');

// @desc    Place an order
// @route   POST /api/orders
// @access  Private (customer, staff)
exports.placeOrder = async (req, res) => {
  try {
    const { items, orderType, tableId, note, location } = req.body;

    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const menuItem = await MenuItem.findById(item.menuItem);
      if (!menuItem) {
        return res.status(404).json({ message: `Menu item ${item.menuItem} not found` });
      }
      if (!menuItem.isAvailable) {
        return res.status(400).json({ message: `${menuItem.name} is currently unavailable` });
      }

      const subtotal = menuItem.price * item.quantity;
      totalAmount += subtotal;

      orderItems.push({
        menuItem: menuItem._id,
        quantity: item.quantity,
        price: menuItem.price,
        customization: item.customization || '',
      });
    }

    const order = await Order.create({
      customer: req.user.id,
      items: orderItems,
      orderType,
      table: tableId || null,
      totalAmount,
      note,
      location,
      handledBy: req.user.role === 'staff' ? req.user.id : null,
    });

    if (tableId) {
      await Table.findByIdAndUpdate(tableId, {
        status: 'occupied',
        currentOrder: order._id,
      });
    }

    await Customer.findOneAndUpdate(
      { user: req.user.id },
      { $push: { orderHistory: order._id } }
    );

    const populatedOrder = await Order.findById(order._id)
      .populate('customer', 'name email')
      .populate('items.menuItem', 'name price')
      .populate('table', 'tableNumber')
      .populate('location', 'name');

    res.status(201).json({
      success: true,
      data: populatedOrder,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private (admin, staff)
exports.getAllOrders = async (req, res) => {
  try {
    const { status, orderType, location } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (orderType) filter.orderType = orderType;
    if (location) filter.location = location;

    const orders = await Order.find(filter)
      .populate('customer', 'name email')
      .populate('items.menuItem', 'name price')
      .populate('table', 'tableNumber')
      .populate('location', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'name email')
      .populate('items.menuItem', 'name price')
      .populate('table', 'tableNumber')
      .populate('handledBy', 'name')
      .populate('location', 'name');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (
      req.user.role === 'customer' &&
      order.customer._id.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: 'Not authorized to view this order' });
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get my orders
// @route   GET /api/orders/myorders
// @access  Private (customer)
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ customer: req.user.id })
      .populate('items.menuItem', 'name price image')
      .populate('table', 'tableNumber')
      .populate('location', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update order status
// @route   PATCH /api/orders/:id/status
// @access  Private (admin, staff)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.status = status;
    await order.save();

    if (status === 'delivered' || status === 'cancelled') {
      if (order.table) {
        await Table.findByIdAndUpdate(order.table, {
          status: 'available',
          currentOrder: null,
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Order status updated to ${status}`,
      data: order,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Cancel order
// @route   PATCH /api/orders/:id/cancel
// @access  Private
exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({
        message: 'Only pending orders can be cancelled',
      });
    }

    order.status = 'cancelled';
    await order.save();

    if (order.table) {
      await Table.findByIdAndUpdate(order.table, {
        status: 'available',
        currentOrder: null,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      data: order,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};