/**
 * CAMPUS CARE - Item Controller
 * Handles CRUD operations, search, filters, and statistics for Lost & Found items
 */

const { pool } = require('../config/db');

/**
 * Format database row into an object supporting both
 * database schema fields and frontend camelCase properties.
 */
function formatItem(row) {
  if (!row) return null;
  return {
    id: row.id,
    user_id: row.user_id,
    type: row.type,
    item_name: row.item_name,
    name: row.item_name, // Dual support for frontend
    description: row.description || '',
    category: row.category,
    location: row.location,
    date: row.date,
    image: row.image || '',
    status: row.status || 'Reported',
    reporter_name: row.reporter_name || '',
    reporterName: row.reporter_name || '', // Dual support for frontend
    reporter_email: row.reporter_email || '',
    reporterEmail: row.reporter_email || '', // Dual support for frontend
    reporter_phone: row.reporter_phone || '',
    reporterPhone: row.reporter_phone || '', // Dual support for frontend
    reporter_role: row.reporter_role || 'Student',
    reporterRole: row.reporter_role || 'Student', // Dual support for frontend
    created_at: row.created_at,
    createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now()
  };
}

/**
 * Get all items with optional search & filters
 * GET /api/items
 * Query params: ?type=Lost|Found & category=... & location=... & search=... & reporterEmail=... & status=...
 */
const getItems = async (req, res) => {
  try {
    const { type, category, location, search, reporterEmail, reporter_email, email, status } = req.query;

    let query = 'SELECT * FROM items WHERE 1=1';
    const params = [];

    // Filter by type (Lost / Found)
    if (type && type.toLowerCase() !== 'all') {
      const formattedType = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
      query += ' AND type = ?';
      params.push(formattedType);
    }

    // Filter by category
    if (category && category.toLowerCase() !== 'all') {
      query += ' AND category = ?';
      params.push(category);
    }

    // Filter by location
    if (location && location.toLowerCase() !== 'all') {
      query += ' AND location LIKE ?';
      params.push(`%${location}%`);
    }

    // Filter by reporter email
    const filterEmail = reporterEmail || reporter_email || email;
    if (filterEmail) {
      query += ' AND LOWER(reporter_email) = LOWER(?)';
      params.push(filterEmail.trim());
    }

    // Filter by status
    if (status && status.toLowerCase() !== 'all') {
      query += ' AND status = ?';
      params.push(status);
    }

    // General search across item name, description, location, and category
    if (search && search.trim()) {
      const s = `%${search.trim()}%`;
      query += ' AND (item_name LIKE ? OR description LIKE ? OR location LIKE ? OR category LIKE ?)';
      params.push(s, s, s, s);
    }

    // Sort by latest
    query += ' ORDER BY created_at DESC';

    const [rows] = await pool.query(query, params);
    const items = rows.map(formatItem);

    return res.status(200).json({
      success: true,
      count: items.length,
      items,
      data: items
    });
  } catch (error) {
    console.error('Error in getItems:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve items. ' + error.message
    });
  }
};

/**
 * Get single item by ID
 * GET /api/items/:id
 */
const getItemById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM items WHERE id = ?', [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Item with ID ${id} not found`
      });
    }

    const item = formatItem(rows[0]);

    return res.status(200).json({
      success: true,
      item,
      data: item
    });
  } catch (error) {
    console.error('Error in getItemById:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve item details'
    });
  }
};

/**
 * Create a new Lost / Found item
 * POST /api/items
 */
const createItem = async (req, res) => {
  try {
    const {
      type,
      item_name,
      name,
      description,
      category,
      location,
      date,
      image,
      status,
      user_id,
      userId,
      reporter_name,
      reporterName,
      reporter_email,
      reporterEmail,
      reporter_phone,
      reporterPhone,
      reporter_role,
      reporterRole
    } = req.body;

    // Normalizing field names
    const finalType = type ? (type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()) : null;
    const finalName = (item_name || name || '').trim();
    const finalCategory = (category || '').trim();
    const finalLocation = (location || '').trim();
    const finalDate = (date || '').trim();
    const finalDescription = (description || '').trim();
    const finalStatus = status || 'Reported';
    const finalUserId = user_id || userId || null;
    const finalReporterName = (reporter_name || reporterName || '').trim();
    const finalReporterEmail = (reporter_email || reporterEmail || '').trim().toLowerCase();
    const finalReporterPhone = (reporter_phone || reporterPhone || '').trim();
    const finalReporterRole = reporter_role || reporterRole || 'Student';
    const finalImage = image || null;

    // 1. Basic Validation
    if (!finalType || (finalType !== 'Lost' && finalType !== 'Found')) {
      return res.status(400).json({
        success: false,
        message: 'Type must be either "Lost" or "Found"'
      });
    }

    if (!finalName) {
      return res.status(400).json({
        success: false,
        message: 'Item name is required'
      });
    }

    if (!finalCategory) {
      return res.status(400).json({
        success: false,
        message: 'Category is required'
      });
    }

    if (!finalLocation) {
      return res.status(400).json({
        success: false,
        message: 'Location is required'
      });
    }

    if (!finalDate) {
      return res.status(400).json({
        success: false,
        message: 'Date is required'
      });
    }

    // 2. Insert into MySQL
    const [result] = await pool.query(
      `INSERT INTO items 
      (user_id, type, item_name, description, category, location, date, image, status, reporter_name, reporter_email, reporter_phone, reporter_role)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        finalUserId,
        finalType,
        finalName,
        finalDescription,
        finalCategory,
        finalLocation,
        finalDate,
        finalImage,
        finalStatus,
        finalReporterName,
        finalReporterEmail,
        finalReporterPhone,
        finalReporterRole
      ]
    );

    const [newRows] = await pool.query('SELECT * FROM items WHERE id = ?', [result.insertId]);
    const createdItem = formatItem(newRows[0]);

    return res.status(201).json({
      success: true,
      message: `${finalType} item reported successfully`,
      item: createdItem
    });
  } catch (error) {
    console.error('Error in createItem:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create item. ' + error.message
    });
  }
};

/**
 * Update an existing item
 * PUT /api/items/:id
 */
const updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Administrative status authorization:
    // Only the single designated administrator can change an item status to 'Returned' or 'Verified'
    if (status !== undefined && (status === 'Returned' || status === 'Verified')) {
      const { getDesignatedAdminEmail, getRequesterEmail } = require('../middleware/authMiddleware');
      const designatedAdmin = getDesignatedAdminEmail();
      const requester = getRequesterEmail(req);

      if (!requester || requester !== designatedAdmin) {
        return res.status(403).json({
          success: false,
          error: 'Access Denied',
          message: `Only the designated administrator (${designatedAdmin}) can update item status to ${status}.`
        });
      }
    }

    // 1. Check if item exists
    const [existing] = await pool.query('SELECT * FROM items WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Item with ID ${id} not found`
      });
    }

    const current = existing[0];
    const {
      type,
      item_name,
      name,
      description,
      category,
      location,
      date,
      image,
      reporter_name,
      reporterName,
      reporter_email,
      reporterEmail,
      reporter_phone,
      reporterPhone,
      reporter_role,
      reporterRole
    } = req.body;

    const updatedType = type ? (type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()) : current.type;
    const updatedName = (item_name !== undefined ? item_name : (name !== undefined ? name : current.item_name));
    const updatedDescription = description !== undefined ? description : current.description;
    const updatedCategory = category !== undefined ? category : current.category;
    const updatedLocation = location !== undefined ? location : current.location;
    const updatedDate = date !== undefined ? date : current.date;
    const updatedImage = image !== undefined ? image : current.image;
    const updatedStatus = status !== undefined ? status : current.status;
    const updatedReporterName = (reporter_name !== undefined ? reporter_name : (reporterName !== undefined ? reporterName : current.reporter_name));
    const updatedReporterEmail = (reporter_email !== undefined ? reporter_email : (reporterEmail !== undefined ? reporterEmail : current.reporter_email));
    const updatedReporterPhone = (reporter_phone !== undefined ? reporter_phone : (reporterPhone !== undefined ? reporterPhone : current.reporter_phone));
    const updatedReporterRole = (reporter_role !== undefined ? reporter_role : (reporterRole !== undefined ? reporterRole : current.reporter_role));

    await pool.query(
      `UPDATE items 
       SET type = ?, item_name = ?, description = ?, category = ?, location = ?, date = ?, image = ?, status = ?, reporter_name = ?, reporter_email = ?, reporter_phone = ?, reporter_role = ?
       WHERE id = ?`,
      [
        updatedType,
        updatedName,
        updatedDescription,
        updatedCategory,
        updatedLocation,
        updatedDate,
        updatedImage,
        updatedStatus,
        updatedReporterName,
        updatedReporterEmail,
        updatedReporterPhone,
        updatedReporterRole,
        id
      ]
    );

    const [updatedRows] = await pool.query('SELECT * FROM items WHERE id = ?', [id]);
    const updatedItem = formatItem(updatedRows[0]);

    return res.status(200).json({
      success: true,
      message: 'Item updated successfully',
      item: updatedItem
    });
  } catch (error) {
    console.error('Error in updateItem:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update item'
    });
  }
};

/**
 * Delete an item
 * DELETE /api/items/:id
 * Strictly restricted to the single designated administrator.
 */
const deleteItem = async (req, res) => {
  try {
    const { id } = req.params;

    // Administrative deletion authorization:
    // Only the single designated administrator can delete items
    const { getDesignatedAdminEmail, getRequesterEmail } = require('../middleware/authMiddleware');
    const designatedAdmin = getDesignatedAdminEmail();
    const requester = getRequesterEmail(req);

    if (!requester || requester !== designatedAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Access Denied',
        message: `Only the designated administrator (${designatedAdmin}) is authorized to delete items.`
      });
    }

    // Check if item exists
    const [existing] = await pool.query('SELECT id FROM items WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Item with ID ${id} not found`
      });
    }

    await pool.query('DELETE FROM items WHERE id = ?', [id]);

    return res.status(200).json({
      success: true,
      message: 'Item deleted successfully'
    });
  } catch (error) {
    console.error('Error in deleteItem:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete item'
    });
  }
};

/**
 * Get aggregate metric statistics for lost & found items
 * GET /api/items/stats
 */
const getItemStats = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT type, status FROM items');

    const total = rows.length;
    const lost = rows.filter(i => i.type === 'Lost' && i.status !== 'Returned').length;
    const found = rows.filter(i => i.type === 'Found' && i.status !== 'Returned').length;
    const returned = rows.filter(i => i.status === 'Returned').length;
    const verified = rows.filter(i => i.status === 'Verified').length;
    const reported = rows.filter(i => i.status === 'Reported').length;

    return res.status(200).json({
      success: true,
      metrics: {
        total,
        lost,
        found,
        returned,
        verified,
        reported
      }
    });
  } catch (error) {
    console.error('Error in getItemStats:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve item metrics'
    });
  }
};

module.exports = {
  getItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
  getItemStats
};
