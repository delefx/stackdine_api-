const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    table: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Table',
      required: true,
    },
    date: {
      type: Date,
      required: [true, 'Reservation date is required'],
    },
    time: {
      type: String,
      required: [true, 'Reservation time is required'],
    },
    partySize: {
      type: Number,
      required: [true, 'Party size is required'],
      min: 1,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'completed', 'no-show'],
      default: 'pending',
    },
    specialRequest: {
      type: String,
      default: '',
    },
    location: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
    },
    handledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Reservation', reservationSchema);