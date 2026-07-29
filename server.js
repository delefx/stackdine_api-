const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

dotenv.config();

connectDB();

// Register models
require('./models/Location.model');
require('./models/User.model');
require('./models/MenuItem.model');
require('./models/Order.model');
require('./models/Table.model');
require('./models/Reservation.model');
require('./models/Inventory.model');
require('./models/Bill.model');
require('./models/Customer.model');

const app = express();

const allowedOrigins = [
  process.env.FRONTEND_URL ? process.env.FRONTEND_URL.replace(/\/$/, '') : '',
  'https://stackdine-ui.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    const cleanOrigin = origin.replace(/\/$/, '');
    if (allowedOrigins.includes(cleanOrigin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/menu', require('./routes/menu.routes'));
app.use('/api/orders', require('./routes/order.routes'));
app.use('/api/tables', require('./routes/table.routes'));
app.use('/api/reservations', require('./routes/reservation.routes'));
app.use('/api/inventory', require('./routes/inventory.routes'));
app.use('/api/billing', require('./routes/billing.routes'));
app.use('/api/customers', require('./routes/customer.routes'));
app.use('/api/analytics', require('./routes/analytics.routes'));
app.use('/api/locations', require('./routes/location.routes'));

// 404 handler
app.use((req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
});

// Global error handler
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`StackDine server running on port ${PORT}`);
});