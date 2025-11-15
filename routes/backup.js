const express = require('express');
const router = express.Router();
const { backupDatabase, listBackups, restoreDatabase } = require('../scripts/backupDatabase');
const path = require('path');

// Create backup
router.post('/create', async (req, res) => {
  try {
    const result = await backupDatabase();
    res.json({
      success: true,
      message: 'Backup created successfully',
      ...result
    });
  } catch (error) {
    console.error('Backup error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// List all backups
router.get('/list', async (req, res) => {
  try {
    const backups = await listBackups();
    res.json({
      success: true,
      backups: backups,
      count: backups.length
    });
  } catch (error) {
    console.error('List backups error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Restore from backup
router.post('/restore', async (req, res) => {
  try {
    const { backupPath } = req.body;
    
    if (!backupPath) {
      return res.status(400).json({
        success: false,
        error: 'Backup path is required'
      });
    }
    
    const result = await restoreDatabase(backupPath);
    res.json({
      success: true,
      message: 'Database restored successfully',
      ...result
    });
  } catch (error) {
    console.error('Restore error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Download backup file
router.get('/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const backupPath = path.join(__dirname, '..', 'backups', filename);
  
  res.download(backupPath, (err) => {
    if (err) {
      console.error('Download error:', err);
      res.status(404).json({
        success: false,
        error: 'Backup file not found'
      });
    }
  });
});

module.exports = router;

