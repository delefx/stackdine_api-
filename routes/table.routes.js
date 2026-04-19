const express = require('express');
const router = express.Router();
const {
  getAllTables,
  getTable,
  createTable,
  updateTable,
  deleteTable,
  assignTable,
  freeTable,
  getAvailableTables,
} = require('../controllers/table.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.get('/available', getAvailableTables);
router.get('/', protect, authorize('admin', 'staff'), getAllTables);
router.get('/:id', protect, authorize('admin', 'staff'), getTable);
router.post('/', protect, authorize('admin'), createTable);
router.put('/:id', protect, authorize('admin'), updateTable);
router.delete('/:id', protect, authorize('admin'), deleteTable);
router.patch('/:id/assign', protect, authorize('admin', 'staff'), assignTable);
router.patch('/:id/free', protect, authorize('admin', 'staff'), freeTable);

module.exports = router;