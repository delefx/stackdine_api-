const express = require('express');
const router = express.Router();
const {
  getAllInventory,
  getInventoryItem,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  restockItem,
  getLowStockItems,
} = require('../controllers/inventory.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.get('/lowstock', protect, authorize('admin', 'staff'), getLowStockItems);
router.get('/', protect, authorize('admin', 'staff'), getAllInventory);
router.get('/:id', protect, authorize('admin', 'staff'), getInventoryItem);
router.post('/', protect, authorize('admin'), createInventoryItem);
router.put('/:id', protect, authorize('admin'), updateInventoryItem);
router.delete('/:id', protect, authorize('admin'), deleteInventoryItem);
router.patch('/:id/restock', protect, authorize('admin', 'staff'), restockItem);

module.exports = router;