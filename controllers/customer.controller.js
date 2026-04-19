const Customer = require('../models/Customer.model');
const User = require('../models/User.model');

// @desc    Get all customers
// @route   GET /api/customers
// @access  Private (admin, staff)
exports.getAllCustomers = async (req, res) => {
  try {
    const { location, isBlacklisted } = req.query;
    const filter = {};

    if (location) filter.location = location;
    if (isBlacklisted) filter.isBlacklisted = isBlacklisted === 'true';

    const customers = await Customer.find(filter)
      .populate('user', 'name email role isActive')
      .populate('location', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: customers.length,
      data: customers,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single customer
// @route   GET /api/customers/:id
// @access  Private (admin, staff)
exports.getCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id)
      .populate('user', 'name email createdAt')
      .populate('orderHistory', 'status totalAmount createdAt orderType')
      .populate('location', 'name');

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    res.status(200).json({
      success: true,
      data: customer,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get my customer profile
// @route   GET /api/customers/me
// @access  Private (customer)
exports.getMyProfile = async (req, res) => {
  try {
    const customer = await Customer.findOne({ user: req.user.id })
      .populate('user', 'name email')
      .populate('orderHistory', 'status totalAmount createdAt orderType');

    if (!customer) {
      return res.status(404).json({ message: 'Customer profile not found' });
    }

    res.status(200).json({
      success: true,
      data: customer,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update my customer profile
// @route   PUT /api/customers/me
// @access  Private (customer)
exports.updateMyProfile = async (req, res) => {
  try {
    const { phone, address, preferences, allergies } = req.body;

    const customer = await Customer.findOneAndUpdate(
      { user: req.user.id },
      { phone, address, preferences, allergies },
      { new: true, runValidators: true }
    ).populate('user', 'name email');

    if (!customer) {
      return res.status(404).json({ message: 'Customer profile not found' });
    }

    res.status(200).json({
      success: true,
      data: customer,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Submit feedback
// @route   POST /api/customers/feedback
// @access  Private (customer)
exports.submitFeedback = async (req, res) => {
  try {
    const { message, rating } = req.body;

    const customer = await Customer.findOneAndUpdate(
      { user: req.user.id },
      {
        $push: {
          feedback: { message, rating, createdAt: Date.now() },
        },
      },
      { new: true }
    );

    if (!customer) {
      return res.status(404).json({ message: 'Customer profile not found' });
    }

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: customer.feedback,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Blacklist a customer
// @route   PATCH /api/customers/:id/blacklist
// @access  Private (admin only)
exports.toggleBlacklist = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    customer.isBlacklisted = !customer.isBlacklisted;
    await customer.save();

    res.status(200).json({
      success: true,
      message: `Customer ${customer.isBlacklisted ? 'blacklisted' : 'removed from blacklist'} successfully`,
      data: customer,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get customer segments
// @route   GET /api/customers/segments
// @access  Private (admin only)
exports.getCustomerSegments = async (req, res) => {
  try {
    const highSpenders = await Customer.find({ totalSpent: { $gte: 50000 } })
      .populate('user', 'name email')
      .sort({ totalSpent: -1 })
      .limit(10);

    const loyalCustomers = await Customer.find({ loyaltyPoints: { $gte: 500 } })
      .populate('user', 'name email')
      .sort({ loyaltyPoints: -1 })
      .limit(10);

    const newCustomers = await Customer.find()
      .populate('user', 'name email createdAt')
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      data: {
        highSpenders,
        loyalCustomers,
        newCustomers,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};