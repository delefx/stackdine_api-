const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['ingredient', 'beverage', 'packaging', 'equipment', 'other'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: 0,
    },
    unit: {
      type: String,
      required: [true, 'Unit is required'],
      enum: ['kg', 'g', 'litre', 'ml', 'pieces', 'bottles', 'boxes'],
    },
    reorderPoint: {
      type: Number,
      required: [true, 'Reorder point is required'],
      min: 0,
    },
    costPerUnit: {
      type: Number,
      required: [true, 'Cost per unit is required'],
      min: 0,
    },
    supplier: {
      name: { type: String },
      contact: { type: String },
      email: { type: String },
    },
    isLowStock: {
      type: Boolean,
      default: false,
    },
    lastRestockedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

inventorySchema.pre('save', function (next) {
  this.isLowStock = this.quantity <= this.reorderPoint;
  next();
});

module.exports = mongoose.model('Inventory', inventorySchema);