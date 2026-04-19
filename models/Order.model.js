const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  menuItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  price: {
    type: Number,
    required: true,
  },
  customization: {
    type: String,
    default: '',
  },
});

const orderSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: [orderItemSchema],
    orderType: {
      type: String,
      enum: ['dine-in', 'takeaway', 'delivery'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'in-progress', 'ready', 'delivered', 'cancelled'],
      default: 'pending',
    },
    table: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Table',
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    note: {
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

module.exports = mongoose.model('Order', orderSchema);