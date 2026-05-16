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



// const Order = require('../models/Order.model');
// const MenuItem = require('../models/MenuItem.model');
// const Customer = require('../models/Customer.model');
// const Table = require('../models/Table.model');
// const User = require('../models/User.model');
// const sendEmail = require('../utils/sendEmail');

// // @desc    Place an order
// // @route   POST /api/orders
// // @access  Private (customer, staff)
// exports.placeOrder = async (req, res) => {
//   try {
//     const { items, orderType, tableId, note, location } = req.body;

//     let totalAmount = 0;
//     const orderItems = [];

//     for (const item of items) {
//       const menuItem = await MenuItem.findById(item.menuItem);
//       if (!menuItem) {
//         return res.status(404).json({ message: `Menu item ${item.menuItem} not found` });
//       }
//       if (!menuItem.isAvailable) {
//         return res.status(400).json({ message: `${menuItem.name} is currently unavailable` });
//       }
//       const subtotal = menuItem.price * item.quantity;
//       totalAmount += subtotal;
//       orderItems.push({
//         menuItem: menuItem._id,
//         quantity: item.quantity,
//         price: menuItem.price,
//         customization: item.customization || '',
//       });
//     }

//     const order = await Order.create({
//       customer: req.user.id,
//       items: orderItems,
//       orderType,
//       table: tableId || null,
//       totalAmount,
//       note,
//       location,
//       handledBy: req.user.role === 'staff' ? req.user.id : null,
//     });

//     if (tableId) {
//       await Table.findByIdAndUpdate(tableId, {
//         status: 'occupied',
//         currentOrder: order._id,
//       });
//     }

//     await Customer.findOneAndUpdate(
//       { user: req.user.id },
//       { $push: { orderHistory: order._id } }
//     );

//     // Send order confirmation email
//     try {
//       const user = await User.findById(req.user.id);
//       await sendEmail({
//         to: user.email,
//         subject: 'StackDine — Order Confirmation 🎉',
//         html: `
//           <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0f172a; color: #ffffff;">
//             <h1 style="color: #f97316; font-size: 24px; margin-bottom: 4px;">StackDine</h1>
//             <p style="color: #9ca3af; margin-bottom: 24px;">Restaurant Management System</p>
//             <h2 style="font-size: 20px; margin-bottom: 8px;">Hi ${user.name}, your order has been placed! 🎉</h2>
//             <p style="color: #d1d5db; line-height: 1.6;">Your order has been received and is now being processed.</p>
//             <div style="background-color: #1f2937; border-radius: 8px; padding: 16px; margin: 20px 0;">
//               <p style="color: #9ca3af; margin: 0 0 12px; font-size: 13px;">ORDER DETAILS</p>
//               <p style="color: #ffffff; margin: 6px 0;">Type: <strong style="color: #f97316;">${orderType}</strong></p>
//               <p style="color: #ffffff; margin: 6px 0;">Items: <strong>${orderItems.length}</strong></p>
//               ${note ? `<p style="color: #9ca3af; margin: 6px 0; font-size: 13px;">Note: ${note}</p>` : ''}
//               <div style="border-top: 1px solid #374151; margin-top: 12px; padding-top: 12px;">
//                 <p style="color: #f97316; font-size: 20px; font-weight: bold; margin: 0;">Total: ₦${totalAmount.toLocaleString()}</p>
//               </div>
//             </div>
//             <p style="color: #d1d5db; line-height: 1.6;">Track your order status in real-time on the StackDine app.</p>
//             <p style="color: #6b7280; font-size: 12px; margin-top: 32px; border-top: 1px solid #1f2937; padding-top: 16px;">
//               If you did not place this order, please contact us immediately.
//             </p>
//           </div>
//         `,
//       });
//     } catch (emailErr) {
//       console.error('Order confirmation email failed:', emailErr.message);
//     }

//     const populatedOrder = await Order.findById(order._id)
//       .populate('customer', 'name email')
//       .populate('items.menuItem', 'name price')
//       .populate('table', 'tableNumber')
//       .populate('location', 'name');

//     res.status(201).json({
//       success: true,
//       data: populatedOrder,
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // @desc    Get all orders
// // @route   GET /api/orders
// // @access  Private (admin, staff)
// exports.getAllOrders = async (req, res) => {
//   try {
//     const { status, orderType, location } = req.query;
//     const filter = {};

//     if (status) filter.status = status;
//     if (orderType) filter.orderType = orderType;
//     if (location) filter.location = location;

//     const orders = await Order.find(filter)
//       .populate('customer', 'name email')
//       .populate('items.menuItem', 'name price')
//       .populate('table', 'tableNumber')
//       .populate('location', 'name')
//       .sort({ createdAt: -1 });

//     res.status(200).json({
//       success: true,
//       count: orders.length,
//       data: orders,
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // @desc    Get single order
// // @route   GET /api/orders/:id
// // @access  Private
// exports.getOrder = async (req, res) => {
//   try {
//     const order = await Order.findById(req.params.id)
//       .populate('customer', 'name email')
//       .populate('items.menuItem', 'name price')
//       .populate('table', 'tableNumber')
//       .populate('handledBy', 'name')
//       .populate('location', 'name');

//     if (!order) {
//       return res.status(404).json({ message: 'Order not found' });
//     }

//     if (
//       req.user.role === 'customer' &&
//       order.customer._id.toString() !== req.user.id
//     ) {
//       return res.status(403).json({ message: 'Not authorized to view this order' });
//     }

//     res.status(200).json({
//       success: true,
//       data: order,
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // @desc    Get my orders
// // @route   GET /api/orders/myorders
// // @access  Private (customer)
// exports.getMyOrders = async (req, res) => {
//   try {
//     const orders = await Order.find({ customer: req.user.id })
//       .populate('items.menuItem', 'name price image')
//       .populate('table', 'tableNumber')
//       .populate('location', 'name')
//       .sort({ createdAt: -1 });

//     res.status(200).json({
//       success: true,
//       count: orders.length,
//       data: orders,
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // @desc    Update order status
// // @route   PATCH /api/orders/:id/status
// // @access  Private (admin, staff)
// exports.updateOrderStatus = async (req, res) => {
//   try {
//     const { status } = req.body;

//     const order = await Order.findById(req.params.id)
//       .populate('customer', 'name email');
//     if (!order) {
//       return res.status(404).json({ message: 'Order not found' });
//     }

//     order.status = status;
//     await order.save();

//     if (status === 'delivered' || status === 'cancelled') {
//       if (order.table) {
//         await Table.findByIdAndUpdate(order.table, {
//           status: 'available',
//           currentOrder: null,
//         });
//       }
//     }

//     // Send status update email
//     try {
//       await sendEmail({
//         to: order.customer.email,
//         subject: `StackDine — Order ${status.charAt(0).toUpperCase() + status.slice(1)}`,
//         html: `
//           <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0f172a; color: #ffffff;">
//             <h1 style="color: #f97316; font-size: 24px; margin-bottom: 4px;">StackDine</h1>
//             <p style="color: #9ca3af; margin-bottom: 24px;">Restaurant Management System</p>
//             <h2 style="font-size: 20px;">Hi ${order.customer.name}, your order status has been updated!</h2>
//             <div style="background-color: #1f2937; border-radius: 8px; padding: 16px; margin: 20px 0;">
//               <p style="color: #9ca3af; margin: 0 0 8px; font-size: 13px;">STATUS UPDATE</p>
//               <p style="color: #f97316; font-size: 22px; font-weight: bold; margin: 0; text-transform: capitalize;">${status}</p>
//             </div>
//             <p style="color: #d1d5db;">
//               ${status === 'delivered' ? 'Your order has been delivered. Enjoy your meal! 🍽️' :
//                 status === 'ready' ? 'Your order is ready! 🎉' :
//                 status === 'in-progress' ? 'Your order is being prepared in the kitchen. 🍳' :
//                 status === 'confirmed' ? 'Your order has been confirmed by our staff. ✅' :
//                 status === 'cancelled' ? 'Your order has been cancelled.' :
//                 'Your order status has been updated.'}
//             </p>
//             <p style="color: #6b7280; font-size: 12px; margin-top: 32px; border-top: 1px solid #1f2937; padding-top: 16px;">
//               Track your order in real-time on the StackDine app.
//             </p>
//           </div>
//         `,
//       });
//     } catch (emailErr) {
//       console.error('Status update email failed:', emailErr.message);
//     }

//     res.status(200).json({
//       success: true,
//       message: `Order status updated to ${status}`,
//       data: order,
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // @desc    Cancel order
// // @route   PATCH /api/orders/:id/cancel
// // @access  Private
// exports.cancelOrder = async (req, res) => {
//   try {
//     const order = await Order.findById(req.params.id)
//       .populate('customer', 'name email');
//     if (!order) {
//       return res.status(404).json({ message: 'Order not found' });
//     }

//     if (order.status !== 'pending') {
//       return res.status(400).json({
//         message: 'Only pending orders can be cancelled',
//       });
//     }

//     order.status = 'cancelled';
//     await order.save();

//     if (order.table) {
//       await Table.findByIdAndUpdate(order.table, {
//         status: 'available',
//         currentOrder: null,
//       });
//     }

//     // Send cancellation email
//     try {
//       await sendEmail({
//         to: order.customer.email,
//         subject: 'StackDine — Order Cancelled',
//         html: `
//           <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0f172a; color: #ffffff;">
//             <h1 style="color: #f97316; font-size: 24px; margin-bottom: 4px;">StackDine</h1>
//             <p style="color: #9ca3af; margin-bottom: 24px;">Restaurant Management System</p>
//             <h2 style="font-size: 20px;">Hi ${order.customer.name}, your order has been cancelled.</h2>
//             <p style="color: #d1d5db; line-height: 1.6;">
//               Your order of <strong style="color: #f97316;">₦${order.totalAmount?.toLocaleString()}</strong> has been cancelled successfully.
//             </p>
//             <p style="color: #6b7280; font-size: 12px; margin-top: 32px; border-top: 1px solid #1f2937; padding-top: 16px;">
//               If you didn't cancel this order, please contact us immediately.
//             </p>
//           </div>
//         `,
//       });
//     } catch (emailErr) {
//       console.error('Cancellation email failed:', emailErr.message);
//     }

//     res.status(200).json({
//       success: true,
//       message: 'Order cancelled successfully',
//       data: order,
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };