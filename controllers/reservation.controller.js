const Reservation = require('../models/Reservation.model');
const Table = require('../models/Table.model');
const User = require('../models/User.model');
const sendEmail = require('../utils/sendEmail');

// @desc    Create reservation
// @route   POST /api/reservations
// @access  Private (customer, staff)
exports.createReservation = async (req, res) => {
  try {
    const { tableId, date, time, partySize, specialRequest, location } = req.body;

    const table = await Table.findById(tableId);
    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    if (table.capacity < partySize) {
      return res.status(400).json({
        message: `Table capacity is ${table.capacity}, cannot fit party of ${partySize}`,
      });
    }

    const existingReservation = await Reservation.findOne({
      table: tableId,
      date,
      time,
      status: { $in: ['pending', 'confirmed'] },
    });

    if (existingReservation) {
      return res.status(400).json({
        message: 'Table already reserved for this date and time',
      });
    }

    const reservation = await Reservation.create({
      customer: req.user.id,
      table: tableId,
      date,
      time,
      partySize,
      specialRequest,
      location,
      handledBy: req.user.role === 'staff' ? req.user.id : null,
    });

    // Only mark table as reserved if the reservation is for today
    const reservationDate = new Date(date);
    const today = new Date();
    const isToday =
      reservationDate.getFullYear() === today.getFullYear() &&
      reservationDate.getMonth() === today.getMonth() &&
      reservationDate.getDate() === today.getDate();

    if (isToday) {
      await Table.findByIdAndUpdate(tableId, { status: 'reserved' });
    }

    const populatedReservation = await Reservation.findById(reservation._id)
      .populate('customer', 'name email')
      .populate('table', 'tableNumber capacity')
      .populate('location', 'name');

    try {
      await sendEmail({
        to: populatedReservation.customer.email,
        subject: 'StackDine — Reservation Confirmation',
        html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#0f172a;color:#fff"><h1 style="color:#f97316">StackDine</h1><p style="color:#9ca3af">Restaurant Management System</p><h2>Hi ${populatedReservation.customer.name}, your table is reserved!</h2><p style="color:#d1d5db">Your reservation is pending confirmation.</p></div>`,
      });
    } catch (emailErr) {
      console.error('Reservation email failed:', emailErr.message);
    }

    res.status(201).json({
      success: true,
      data: populatedReservation,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all reservations
// @route   GET /api/reservations
// @access  Private (admin, staff)
exports.getAllReservations = async (req, res) => {
  try {
    const { status, date, location } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (date) filter.date = date;
    if (location) filter.location = location;

    const reservations = await Reservation.find(filter)
      .populate('customer', 'name email')
      .populate('table', 'tableNumber capacity')
      .populate('handledBy', 'name')
      .populate('location', 'name')
      .sort({ date: 1, time: 1 });

    res.status(200).json({
      success: true,
      count: reservations.length,
      data: reservations,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get my reservations
// @route   GET /api/reservations/myreservations
// @access  Private (customer)
exports.getMyReservations = async (req, res) => {
  try {
    const reservations = await Reservation.find({ customer: req.user.id })
      .populate('table', 'tableNumber capacity')
      .populate('location', 'name address')
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      count: reservations.length,
      data: reservations,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single reservation
// @route   GET /api/reservations/:id
// @access  Private
exports.getReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id)
      .populate('customer', 'name email')
      .populate('table', 'tableNumber capacity')
      .populate('handledBy', 'name')
      .populate('location', 'name');

    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    if (
      req.user.role === 'customer' &&
      reservation.customer._id.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: 'Not authorized to view this reservation' });
    }

    res.status(200).json({
      success: true,
      data: reservation,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update reservation status
// @route   PATCH /api/reservations/:id/status
// @access  Private (admin, staff)
exports.updateReservationStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    reservation.status = status;
    await reservation.save();

    const populatedRes = await Reservation.findById(req.params.id).populate('customer', 'name email');
    try {
      await sendEmail({
        to: populatedRes.customer.email,
        subject: `StackDine — Reservation ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#0f172a;color:#fff"><h1 style="color:#f97316">StackDine</h1><h2>Hi ${populatedRes.customer.name}, your reservation status: ${status}</h2></div>`,
      });
    } catch (emailErr) {
      console.error('Reservation status email failed:', emailErr.message);
    }

    if (status === 'cancelled' || status === 'completed' || status === 'no-show') {
      await Table.findByIdAndUpdate(reservation.table, { status: 'available' });
    }

    res.status(200).json({
      success: true,
      message: `Reservation ${status} successfully`,
      data: reservation,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Cancel reservation
// @route   PATCH /api/reservations/:id/cancel
// @access  Private
exports.cancelReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    if (
      req.user.role === 'customer' &&
      reservation.customer.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: 'Not authorized to cancel this reservation' });
    }

    if (reservation.status === 'completed') {
      return res.status(400).json({ message: 'Cannot cancel a completed reservation' });
    }

    reservation.status = 'cancelled';
    await reservation.save();

    const populatedCancelRes = await Reservation.findById(req.params.id).populate('customer', 'name email');
    try {
      await sendEmail({
        to: populatedCancelRes.customer.email,
        subject: `StackDine — Reservation Cancelled`,
        html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#0f172a;color:#fff"><h1 style="color:#f97316">StackDine</h1><h2>Hi ${populatedCancelRes.customer.name}, your reservation status: cancelled</h2></div>`,
      });
    } catch (emailErr) {
      console.error('Reservation cancellation email failed:', emailErr.message);
    }

    await Table.findByIdAndUpdate(reservation.table, { status: 'available' });

    res.status(200).json({
      success: true,
      message: 'Reservation cancelled successfully',
      data: reservation,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
