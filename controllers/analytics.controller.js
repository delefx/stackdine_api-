const Order = require('../models/Order.model');
const Bill = require('../models/Bill.model');
const Customer = require('../models/Customer.model');
const MenuItem = require('../models/MenuItem.model');
const Reservation = require('../models/Reservation.model');

// @desc    Get sales summary
// @route   GET /api/analytics/sales
// @access  Private (admin only)
exports.getSalesSummary = async (req, res) => {
  try {
    const { location, startDate, endDate } = req.query;
    const filter = { paymentStatus: 'paid' };

    if (location) filter.location = location;
    if (startDate && endDate) {
      filter.paidAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const bills = await Bill.find(filter);

    const totalRevenue = bills.reduce((acc, bill) => acc + bill.totalAmount, 0);
    const totalOrders = bills.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const dailySales = await Bill.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$paidAt' },
          },
          totalSales: { $sum: '$totalAmount' },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalRevenue,
        totalOrders,
        averageOrderValue,
        dailySales,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get menu popularity
// @route   GET /api/analytics/menu-popularity
// @access  Private (admin only)
exports.getMenuPopularity = async (req, res) => {
  try {
    const { location, startDate, endDate } = req.query;
    const filter = {};

    if (location) filter.location = location;
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const popularItems = await Order.aggregate([
      { $match: filter },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.menuItem',
          totalOrdered: { $sum: '$items.quantity' },
          totalRevenue: {
            $sum: { $multiply: ['$items.price', '$items.quantity'] },
          },
        },
      },
      { $sort: { totalOrdered: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'menuitems',
          localField: '_id',
          foreignField: '_id',
          as: 'menuItem',
        },
      },
      { $unwind: '$menuItem' },
      {
        $project: {
          name: '$menuItem.name',
          category: '$menuItem.category',
          totalOrdered: 1,
          totalRevenue: 1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: popularItems,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get order stats
// @route   GET /api/analytics/orders
// @access  Private (admin only)
exports.getOrderStats = async (req, res) => {
  try {
    const { location, startDate, endDate } = req.query;
    const filter = {};

    if (location) filter.location = location;
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const ordersByStatus = await Order.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const ordersByType = await Order.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$orderType',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
        },
      },
    ]);

    const peakHours = await Order.aggregate([
      { $match: filter },
      {
        $group: {
          _id: { $hour: '$createdAt' },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    res.status(200).json({
      success: true,
      data: {
        ordersByStatus,
        ordersByType,
        peakHours,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get customer analytics
// @route   GET /api/analytics/customers
// @access  Private (admin only)
exports.getCustomerAnalytics = async (req, res) => {
  try {
    const totalCustomers = await Customer.countDocuments();

    const topCustomers = await Customer.find()
      .populate('user', 'name email')
      .sort({ totalSpent: -1 })
      .limit(5);

    const averageLoyaltyPoints = await Customer.aggregate([
      {
        $group: {
          _id: null,
          avgPoints: { $avg: '$loyaltyPoints' },
          avgSpent: { $avg: '$totalSpent' },
        },
      },
    ]);

    const customerGrowth = await Customer.aggregate([
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m', date: '$createdAt' },
          },
          newCustomers: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalCustomers,
        topCustomers,
        averageLoyaltyPoints: averageLoyaltyPoints[0] || {},
        customerGrowth,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get reservation analytics
// @route   GET /api/analytics/reservations
// @access  Private (admin only)
exports.getReservationAnalytics = async (req, res) => {
  try {
    const { location } = req.query;
    const filter = {};
    if (location) filter.location = location;

    const reservationsByStatus = await Reservation.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const reservationsByDay = await Reservation.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$date' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        reservationsByStatus,
        reservationsByDay,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get location comparison
// @route   GET /api/analytics/locations
// @access  Private (admin only)
exports.getLocationComparison = async (req, res) => {
  try {
    const locationStats = await Bill.aggregate([
      { $match: { paymentStatus: 'paid' } },
      {
        $group: {
          _id: '$location',
          totalRevenue: { $sum: '$totalAmount' },
          totalOrders: { $sum: 1 },
          averageOrderValue: { $avg: '$totalAmount' },
        },
      },
      {
        $lookup: {
          from: 'locations',
          localField: '_id',
          foreignField: '_id',
          as: 'location',
        },
      },
      { $unwind: '$location' },
      {
        $project: {
          locationName: '$location.name',
          totalRevenue: 1,
          totalOrders: 1,
          averageOrderValue: 1,
        },
      },
      { $sort: { totalRevenue: -1 } },
    ]);

    res.status(200).json({
      success: true,
      data: locationStats,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};