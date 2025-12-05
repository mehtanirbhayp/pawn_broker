require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

// Import routes
const authRoutes = require('./routes/auth');
const companyRoutes = require('./routes/companies');
const loanRoutes = require('./routes/loans');
const receiptRoutes = require('./routes/receipts');
const masterSheetRoutes = require('./routes/masterSheet');
const runMigrations = require('./utils/migrations');
const authenticate = require('./middleware/authenticate');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/companies', authenticate, companyRoutes);
app.use('/api/loans', authenticate, loanRoutes);
app.use('/api/receipts', authenticate, receiptRoutes);
app.use('/api/master-sheet', authenticate, masterSheetRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Pawn Broker System is running' });
});

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

async function startServer() {
  try {
    await runMigrations();

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Pawn Broker System running on port ${PORT}`);
      console.log(`Access the system at:`);
      console.log(`  Local: http://localhost:${PORT}`);
      console.log(`  Network: http://192.168.29.246:${PORT}`);
      console.log(`\nShare this network URL with your client for remote access`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
