const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database', 'pawn_broker.db');
const backupDir = path.join(__dirname, '..', 'backups');

// Create backups directory if it doesn't exist
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

function backupDatabase() {
  return new Promise((resolve, reject) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const backupPath = path.join(backupDir, `pawn_broker_backup_${timestamp}.db`);
    
    console.log('Starting database backup...');
    console.log(`Source: ${dbPath}`);
    console.log(`Destination: ${backupPath}`);
    
    // Check if source database exists
    if (!fs.existsSync(dbPath)) {
      return reject(new Error('Source database file does not exist!'));
    }
    
    // Read the database file
    fs.readFile(dbPath, (err, data) => {
      if (err) {
        return reject(err);
      }
      
      // Write backup file
      fs.writeFile(backupPath, data, (writeErr) => {
        if (writeErr) {
          return reject(writeErr);
        }
        
        // Get file size
        const stats = fs.statSync(backupPath);
        const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
        
        console.log(`✓ Backup completed successfully!`);
        console.log(`  Size: ${fileSizeMB} MB`);
        console.log(`  Location: ${backupPath}`);
        
        // Clean up old backups (keep only last 30 days)
        cleanupOldBackups();
        
        resolve({
          success: true,
          backupPath: backupPath,
          size: stats.size,
          timestamp: timestamp
        });
      });
    });
  });
}

function cleanupOldBackups() {
  const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
  
  fs.readdir(backupDir, (err, files) => {
    if (err) {
      console.error('Error reading backup directory:', err);
      return;
    }
    
    const backupFiles = files.filter(file => file.startsWith('pawn_broker_backup_'));
    let deletedCount = 0;
    
    backupFiles.forEach(file => {
      const filePath = path.join(backupDir, file);
      const stats = fs.statSync(filePath);
      const age = Date.now() - stats.mtime.getTime();
      
      if (age > maxAge) {
        fs.unlinkSync(filePath);
        deletedCount++;
        console.log(`  Deleted old backup: ${file}`);
      }
    });
    
    if (deletedCount > 0) {
      console.log(`  Cleaned up ${deletedCount} old backup(s)`);
    }
  });
}

function listBackups() {
  return new Promise((resolve, reject) => {
    fs.readdir(backupDir, (err, files) => {
      if (err) {
        return reject(err);
      }
      
      const backupFiles = files
        .filter(file => file.startsWith('pawn_broker_backup_'))
        .map(file => {
          const filePath = path.join(backupDir, file);
          const stats = fs.statSync(filePath);
          return {
            filename: file,
            path: filePath,
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime
          };
        })
        .sort((a, b) => b.modified - a.modified);
      
      resolve(backupFiles);
    });
  });
}

function restoreDatabase(backupPath) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(backupPath)) {
      return reject(new Error('Backup file does not exist!'));
    }
    
    console.log('Starting database restore...');
    console.log(`Backup: ${backupPath}`);
    console.log(`Destination: ${dbPath}`);
    
    // Create a backup of current database before restoring
    const currentBackupPath = path.join(backupDir, `pawn_broker_pre_restore_${Date.now()}.db`);
    if (fs.existsSync(dbPath)) {
      fs.copyFileSync(dbPath, currentBackupPath);
      console.log(`✓ Current database backed up to: ${currentBackupPath}`);
    }
    
    // Read backup file
    fs.readFile(backupPath, (err, data) => {
      if (err) {
        return reject(err);
      }
      
      // Write to database location
      fs.writeFile(dbPath, data, (writeErr) => {
        if (writeErr) {
          return reject(writeErr);
        }
        
        console.log('✓ Database restored successfully!');
        resolve({ success: true });
      });
    });
  });
}

// If run directly, perform backup
if (require.main === module) {
  backupDatabase()
    .then(result => {
      console.log('\nBackup Summary:');
      console.log(JSON.stringify(result, null, 2));
      process.exit(0);
    })
    .catch(err => {
      console.error('Backup failed:', err.message);
      process.exit(1);
    });
}

module.exports = {
  backupDatabase,
  listBackups,
  restoreDatabase,
  cleanupOldBackups
};

