// const Reservation = require('../models/Reservation.model');
// const Table = require('../models/Table.model');

// // @desc    Create reservation
// // @route   POST /api/reservations
// // @access  Private (customer, staff)
// exports.createReservation = async (req, res) => {
//   try {
//     const { tableId, date, time, partySize, specialRequest, location } = req.body;

//     const table = await Table.findById(tableId);
//     if (!table) {
//       return res.status(404).json({ message: 'Table not found' });
//     }

//     if (table.capacity < partySize) {
//       return res.status(400).json({
//         message: `Table capacity is ${table.capacity}, cannot fit party of ${partySize}`,
//       });
//     }

//     const existingReservation = await Reservation.findOne({
//       table: tableId,
//       date,
//       time,
//       status: { $in: ['pending', 'confirmed'] },
//     });

//     if (existingReservation) {
//       return res.status(400).json({
//         message: 'Table already reserved for this date and time',
//       });
//     }

//     const reservation = await Reservation.create({
//       customer: req.user.id,
//       table: tableId,
//       date,
//       time,
//       partySize,
//       specialRequest,
//       location,
//       handledBy: req.user.role === 'staff' ? req.user.id : null,
//     });

//     await Table.findByIdAndUpdate(tableId, { status: 'reserved' });

//     const populatedReservation = await Reservation.findById(reservation._id)
//       .populate('customer', 'name email')
//       .populate('table', 'tableNumber capacity')
//       .populate('location', 'name');

//     res.status(201).json({
//       success: true,
//       data: populatedReservation,
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // @desc    Get all reservations
// // @route   GET /api/reservations
// // @access  Private (admin, staff)
// exports.getAllReservations = async (req, res) => {
//   try {
//     const { status, date, location } = req.query;
//     const filter = {};

//     if (status) filter.status = status;
//     if (date) filter.date = date;
//     if (location) filter.location = location;

//     const reservations = await Reservation.find(filter)
//       .populate('customer', 'name email')
//       .populate('table', 'tableNumber capacity')
//       .populate('handledBy', 'name')
//       .populate('location', 'name')
//       .sort({ date: 1, time: 1 });

//     res.status(200).json({
//       success: true,
//       count: reservations.length,
//       data: reservations,
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // @desc    Get my reservations
// // @route   GET /api/reservations/myreservations
// // @access  Private (customer)
// exports.getMyReservations = async (req, res) => {
//   try {
//     const reservations = await Reservation.find({ customer: req.user.id })
//       .populate('table', 'tableNumber capacity')
//       .populate('location', 'name address')
//       .sort({ date: -1 });

//     res.status(200).json({
//       success: true,
//       count: reservations.length,
//       data: reservations,
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // @desc    Get single reservation
// // @route   GET /api/reservations/:id
// // @access  Private
// exports.getReservation = async (req, res) => {
//   try {
//     const reservation = await Reservation.findById(req.params.id)
//       .populate('customer', 'name email')
//       .populate('table', 'tableNumber capacity')
//       .populate('handledBy', 'name')
//       .populate('location', 'name');

//     if (!reservation) {
//       return res.status(404).json({ message: 'Reservation not found' });
//     }

//     if (
//       req.user.role === 'customer' &&
//       reservation.customer._id.toString() !== req.user.id
//     ) {
//       return res.status(403).json({ message: 'Not authorized to view this reservation' });
//     }

//     res.status(200).json({
//       success: true,
//       data: reservation,
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // @desc    Update reservation status
// // @route   PATCH /api/reservations/:id/status
// // @access  Private (admin, staff)
// exports.updateReservationStatus = async (req, res) => {
//   try {
//     const { status } = req.body;

//     const reservation = await Reservation.findById(req.params.id);
//     if (!reservation) {
//       return res.status(404).json({ message: 'Reservation not found' });
//     }

//     reservation.status = status;
//     await reservation.save();

//     if (status === 'cancelled' || status === 'completed' || status === 'no-show') {
//       await Table.findByIdAndUpdate(reservation.table, { status: 'available' });
//     }

//     res.status(200).json({
//       success: true,
//       message: `Reservation ${status} successfully`,
//       data: reservation,
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // @desc    Cancel reservation
// // @route   PATCH /api/reservations/:id/cancel
// // @access  Private
// exports.cancelReservation = async (req, res) => {
//   try {
//     const reservation = await Reservation.findById(req.params.id);

//     if (!reservation) {
//       return res.status(404).json({ message: 'Reservation not found' });
//     }

//     if (
//       req.user.role === 'customer' &&
//       reservation.customer.toString() !== req.user.id
//     ) {
//       return res.status(403).json({ message: 'Not authorized to cancel this reservation' });
//     }

//     if (reservation.status === 'completed') {
//       return res.status(400).json({ message: 'Cannot cancel a completed reservation' });
//     }

//     reservation.status = 'cancelled';
//     await reservation.save();

//     await Table.findByIdAndUpdate(reservation.table, { status: 'available' });

//     res.status(200).json({
//       success: true,
//       message: 'Reservation cancelled successfully',
//       data: reservation,
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

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

    await Table.findByIdAndUpdate(tableId, { status: 'reserved' });

    // Send reservation confirmation email
    try {
      const user = await User.findById(req.user.id);
      await sendEmail({
        to: user.email,
        subject: 'StackDine — Reservation Confirmation 📅',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0f172a; color: #ffffff;">
            <h1 style="color: #f97316; font-size: 24px; margin-bottom: 4px;">StackDine</h1>
            <p style="color: #9ca3af; margin-bottom: 24px;">Restaurant Management System</p>
            <h2 style="font-size: 20px; margin-bottom: 8px;">Hi ${user.name}, your table is reserved! 📅</h2>
            <p style="color: #d1d5db; line-height: 1.6;">Your reservation has been received and is pending confirmation from our staff.</p>
            <div style="background-color: #1f2937; border-radius: 8px; padding: 16px; margin: 20px 0;">
              <p style="color: #9ca3af; margin: 0 0 12px; font-size: 13px;">RESERVATION DETAILS</p>
              <p style="color: #ffffff; margin: 6px 0;">Table: <strong style="color: #f97316;">${table.tableNumber}</strong></p>
              <p style="color: #ffffff; margin: 6px 0;">Date: <strong>${new Date(date).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong></p>
              <p style="color: #ffffff; margin: 6px 0;">Time: <strong>${time}</strong></p>
              <p style="color: #ffffff; margin: 6px 0;">Party Size: <strong>${partySize} guests</strong></p>
              ${specialRequest ? `<p style="color: #9ca3af; margin: 6px 0; font-size: 13px;">Special Request: ${specialRequest}</p>` : ''}
            </div>
            <p style="color: #d1d5db; line-height: 1.6;">You'll receive another email once your reservation is confirmed by our staff.</p>
            <p style="color: #6b7280; font-size: 12px; margin-top: 32px; border-top: 1px solid #1f2937; padding-top: 16px;">
              If you did not make this reservation, please contact us immediately.
            </p>
          </div>
        `,
      });
    } catch (emailErr) {
      console.error('Reservation confirmation email failed:', emailErr.message);
    }

    const populatedReservation = await Reservation.findById(reservation._id)
      .populate('customer', 'name email')
      .populate('table', 'tableNumber capacity')
      .populate('location', 'name');

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

    const reservation = await Reservation.findById(req.params.id)
      .populate('customer', 'name email')
      .populate('table', 'tableNumber');

    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    reservation.status = status;
    await reservation.save();

    if (status === 'cancelled' || status === 'completed' || status === 'no-show') {
      await Table.findByIdAndUpdate(reservation.table, { status: 'available' });
    }

    // Send status update email
    try {
      await sendEmail({
        to: reservation.customer.email,
        subject: `StackDine — Reservation ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0f172a; color: #ffffff;">
            <h1 style="color: #f97316; font-size: 24px; margin-bottom: 4px;">StackDine</h1>
            <p style="color: #9ca3af; margin-bottom: 24px;">Restaurant Management System</p>
            <h2 style="font-size: 20px;">Hi ${reservation.customer.name}, your reservation has been ${status}!</h2>
            <div style="background-color: #1f2937; border-radius: 8px; padding: 16px; margin: 20px 0;">
              <p style="color: #9ca3af; margin: 0 0 8px; font-size: 13px;">RESERVATION STATUS</p>
              <p style="color: #f97316; font-size: 22px; font-weight: bold; margin: 0; text-transform: capitalize;">${status}</p>
            </div>
            <p style="color: #d1d5db;">
              ${status === 'confirmed' ? 'Great news! Your table reservation has been confirmed. We look forward to seeing you! 🎉' :
                status === 'cancelled' ? 'Your reservation has been cancelled.' :
                status === 'completed' ? 'Thank you for dining with us! We hope to see you again soon. 🍽️' :
                'Your reservation status has been updated.'}
            </p>
            <p style="color: #6b7280; font-size: 12px; margin-top: 32px; border-top: 1px solid #1f2937; padding-top: 16px;">
              If you have any questions, please contact us.
            </p>
          </div>
        `,
      });
    } catch (emailErr) {
      console.error('Reservation status email failed:', emailErr.message);
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
    const reservation = await Reservation.findById(req.params.id)
      .populate('customer', 'name email');

    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    if (
      req.user.role === 'customer' &&
      reservation.customer._id.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: 'Not authorized to cancel this reservation' });
    }

    if (reservation.status === 'completed') {
      return res.status(400).json({ message: 'Cannot cancel a completed reservation' });
    }

    reservation.status = 'cancelled';
    await reservation.save();

    await Table.findByIdAndUpdate(reservation.table, { status: 'available' });

    // Send cancellation email
    try {
      await sendEmail({
        to: reservation.customer.email,
        subject: 'StackDine — Reservation Cancelled',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0f172a; color: #ffffff;">
            <h1 style="color: #f97316; font-size: 24px; margin-bottom: 4px;">StackDine</h1>
            <p style="color: #9ca3af; margin-bottom: 24px;">Restaurant Management System</p>
            <h2 style="font-size: 20px;">Hi ${reservation.customer.name}, your reservation has been cancelled.</h2>
            <p style="color: #d1d5db; line-height: 1.6;">
              Your reservation for <strong style="color: #f97316;">${new Date(reservation.date).toLocaleDateString()}</strong> at <strong style="color: #f97316;">${reservation.time}</strong> has been cancelled.
            </p>
            <p style="color: #6b7280; font-size: 12px; margin-top: 32px; border-top: 1px solid #1f2937; padding-top: 16px;">
              If you didn't cancel this reservation, please contact us immediately.
            </p>
          </div>
        `,
      });
    } catch (emailErr) {
      console.error('Reservation cancellation email failed:', emailErr.message);
    }

    res.status(200).json({
      success: true,
      message: 'Reservation cancelled successfully',
      data: reservation,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};