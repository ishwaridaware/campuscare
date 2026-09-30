/**
 * ==========================================================
 * CAMPUS CARE - Lost & Found Portal Backend Server
 * Technology: Node.js, Express.js, MySQL, REST APIs
 * College CEP Project
 * ==========================================================
 */

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// 1. Load Environment Variables
dotenv.config({ path: path.join(__dirname, '.env') });

const { initDB } = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const itemRoutes = require('./routes/itemRoutes');
const itemController = require('./controllers/itemController');

const app = express();
const PORT = process.env.PORT || 5000;

// 2. Middlewares
// Enable Cross-Origin Resource Sharing (CORS) for frontend interaction
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser with 25MB limit to allow base64 item photos
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// 3. API Routes
// Authentication endpoints (/api/register, /api/login)
app.use('/api', authRoutes);
app.use('/api/auth', authRoutes); // Bonus alias for flexibility

// Lost & Found Items endpoints (/api/items)
app.use('/api/items', itemRoutes);

// Metrics endpoint (/api/stats)
app.use('/api/stats', itemController.getItemStats);

// Root & Health Check Endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to Campus Care Lost & Found Portal API',
    endpoints: {
      auth: {
        register: 'POST /api/register',
        login: 'POST /api/login'
      },
      items: {
        getAll: 'GET /api/items',
        getFiltered: 'GET /api/items?type=Lost | GET /api/items?type=Found',
        getOne: 'GET /api/items/:id',
        create: 'POST /api/items',
        update: 'PUT /api/items/:id',
        delete: 'DELETE /api/items/:id',
        stats: 'GET /api/items/stats'
      }
    }
  });
});

app.get('/api', (req, res) => {
  res.redirect('/');
});

// 4. 404 Route Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`
  });
});

// 5. Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// 6. Start Server and Initialize Database
app.listen(PORT, async () => {
  console.log('====================================================');
  console.log(` Campus Care Backend Server running on port ${PORT}`);
  console.log(` API Base URL: http://localhost:${PORT}/api`);
  console.log('====================================================');

  // Initialize Database tables and sample seed data
  await initDB();
});
