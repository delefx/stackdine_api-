const Bill = require('../models/Bill.model');
const Order = require('../models/Order.model');
const Customer = require('../models/Customer.model');

// @desc    Generate bill from order
// @route   POST /api/billing/generate/:orderId
// @access  Private (admin, staff)
exports.generateBill = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate('items.menuItem', 'name price')
      .populate('customer', 'name email');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const existingBill = await Bill.findOne({ order: order._id });
    if (existingBill) {
      return res.status(400).json({ message: 'Bill already generated for this order' });
    }

    const { discount = 0, tax = 0, tip = 0, paymentMethod } = req.body;

    const items = order.items.map((item) => ({
      name: item.menuItem.name,
      quantity: item.quantity,
      price: item.price,
      subtotal: item.price * item.quantity,
    }));

    const subTotal = order.totalAmount;
    const discountAmount = (subTotal * discount) / 100;
    const taxAmount = (subTotal * tax) / 100;
    const totalAmount = subTotal - discountAmount + taxAmount + tip;

    const bill = await Bill.create({
      order: order._id,
      customer: order.customer._id,
      items,
      subTotal,
      discount,
      tax,
      tip,
      totalAmount,
      paymentMethod,
      issuedBy: req.user.id,
      location: order.location,
    });

    const populatedBill = await Bill.findById(bill._id)
      .populate('order', 'orderType status')
      .populate('customer', 'name email')
      .populate('issuedBy', 'name')
      .populate('location', 'name');

    res.status(201).json({
      success: true,
      data: populatedBill,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Process payment
// @route   PATCH /api/billing/:id/pay
// @access  Private (admin, staff, customer)
exports.processPayment = async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);

    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    if (bill.paymentStatus === 'paid') {
      return res.status(400).json({ message: 'Bill already paid' });
    }

    // Allow customer to update payment method when paying
    if (req.body.paymentMethod) {
      bill.paymentMethod = req.body.paymentMethod;
    }

    bill.paymentStatus = 'paid';
    bill.paidAt = Date.now();
    await bill.save();

    await Order.findByIdAndUpdate(bill.order, { status: 'delivered' });

    await Customer.findOneAndUpdate(
      { user: bill.customer },
      {
        $inc: {
          totalSpent: bill.totalAmount,
          loyaltyPoints: Math.floor(bill.totalAmount / 100),
        },
      }
    );

    res.status(200).json({
      success: true,
      message: 'Payment processed successfully',
      data: bill,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all bills
// @route   GET /api/billing
// @access  Private (admin, staff)
exports.getAllBills = async (req, res) => {
  try {
    const { paymentStatus, location } = req.query;
    const filter = {};

    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (location) filter.location = location;

    const bills = await Bill.find(filter)
      .populate('order', 'orderType status')
      .populate('customer', 'name email')
      .populate('issuedBy', 'name')
      .populate('location', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bills.length,
      data: bills,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single bill
// @route   GET /api/billing/:id
// @access  Private
exports.getBill = async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id)
      .populate('order', 'orderType status items')
      .populate('customer', 'name email')
      .populate('issuedBy', 'name')
      .populate('location', 'name');

    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    if (
      req.user.role === 'customer' &&
      bill.customer._id.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: 'Not authorized to view this bill' });
    }

    res.status(200).json({
      success: true,
      data: bill,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Refund bill
// @route   PATCH /api/billing/:id/refund
// @access  Private (admin only)
exports.refundBill = async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);

    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    if (bill.paymentStatus !== 'paid') {
      return res.status(400).json({ message: 'Only paid bills can be refunded' });
    }

    bill.paymentStatus = 'refunded';
    await bill.save();

    await Customer.findOneAndUpdate(
      { user: bill.customer },
      {
        $inc: {
          totalSpent: -bill.totalAmount,
          loyaltyPoints: -Math.floor(bill.totalAmount / 100),
        },
      }
    );

    res.status(200).json({
      success: true,
      message: 'Bill refunded successfully',
      data: bill,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get my bills (customer)
// @route   GET /api/billing/mybills
// @access  Private (customer)
exports.getMyBills = async (req, res) => {
  try {
    const bills = await Bill.find({ customer: req.user.id })
      .populate('order', 'orderType status items')
      .populate('issuedBy', 'name')
      .populate('location', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bills.length,
      data: bills,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};