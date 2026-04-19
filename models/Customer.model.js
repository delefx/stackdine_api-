const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    address: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
    },
    preferences: {
      type: [String],
      default: [],
    },
    allergies: {
      type: [String],
      default: [],
    },
    orderHistory: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
      },
    ],
    totalSpent: {
      type: Number,
      default: 0,
    },
    loyaltyPoints: {
      type: Number,
      default: 0,
    },
    feedback: [
      {
        message: { type: String },
        rating: { type: Number, min: 1, max: 5 },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    isBlacklisted: {
      type: Boolean,
      default: false,
    },
    location: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Customer', customerSchema);