/**
 * CAMPUS CARE - Item Routes
 * Defines endpoints for Lost & Found items CRUD, search, filter, and stats.
 * 
 * SECURITY ENFORCEMENT:
 * Administrative actions (such as DELETE /api/items/:id) are strictly protected
 * and restricted to ONLY the designated administrator account.
 */

const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');
const { requireAdmin } = require('../middleware/authMiddleware');

// GET /api/items/stats - Metrics count for cards
router.get('/stats', itemController.getItemStats);

// GET /api/items - Retrieve all items with search & filters (?type=Lost|Found, ?category=..., ?search=...)
router.get('/', itemController.getItems);

// GET /api/items/:id - Retrieve single item by ID
router.get('/:id', itemController.getItemById);

// POST /api/items - Create a new Lost / Found item
router.post('/', itemController.createItem);

// PUT /api/items/:id - Update an existing item by ID (Administrative status changes require admin)
router.put('/:id', itemController.updateItem);

// DELETE /api/items/:id - Delete an item by ID (Strictly restricted to single designated admin)
router.delete('/:id', requireAdmin, itemController.deleteItem);

module.exports = router;
