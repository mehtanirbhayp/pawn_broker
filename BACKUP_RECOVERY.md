# Backup & Data Recovery Guide

## 📋 Overview

This document explains how to backup and recover your Pawn Broker database in case of system failure or data loss.

## ⚠️ IMPORTANT WARNING

**Your data is stored in a single SQLite file** (`database/pawn_broker.db`). If this file is lost or corrupted, all your data will be gone unless you have backups!

## 🔄 Automatic Backups

The system automatically creates backups:
- **Every 6 hours** during operation
- **Daily at 3:00 AM**
- Old backups older than 30 days are automatically deleted

Backups are stored in the `backups/` folder.

## 📦 Manual Backup Options

### Option 1: Using API (When System is Running)

Create a backup programmatically:

```bash
curl -X POST http://localhost:3000/api/backup/create
```

### Option 2: Using Command Line

Run the backup script directly:

```bash
npm run backup
```

Or manually:

```bash
node scripts/backupDatabase.js
```

### Option 3: Copy Database File Manually

1. Stop the server (if running)
2. Navigate to the project folder
3. Copy `database/pawn_broker.db` to a safe location (USB drive, cloud storage, etc.)

## 🔧 Recovering Data After System Crash

### Scenario 1: System Crashed but Database File Exists

If your system crashed but the database file still exists:

1. **Check database integrity:**
   ```bash
   sqlite3 database/pawn_broker.db "PRAGMA integrity_check;"
   ```

2. **If integrity check passes**, simply restart the server:
   ```bash
   npm start
   ```

3. **If integrity check fails**, restore from backup (see Scenario 2)

### Scenario 2: Database File is Lost or Corrupted

**You NEED backups for this scenario!**

#### Step 1: List Available Backups

```bash
curl http://localhost:3000/api/backup/list
```

Or check manually:
```bash
dir backups
```

#### Step 2: Stop the Server

If the server is running, stop it:
```bash
# Press Ctrl+C in the terminal where server is running
```

#### Step 3: Restore from Backup

**Method A: Using the restore script**

```javascript
// Create a file: restoreDatabase.js
const { restoreDatabase } = require('./scripts/backupDatabase');

// Replace this path with your actual backup file path
const backupPath = './backups/pawn_broker_backup_2024-01-15T03-00-00.db';

restoreDatabase(backupPath)
  .then(() => console.log('Database restored successfully!'))
  .catch(err => console.error('Restore failed:', err));
```

Run it:
```bash
node restoreDatabase.js
```

**Method B: Manual copy**

1. Open File Explorer
2. Navigate to `backups` folder
3. Find the most recent backup file
4. Copy it
5. Rename the copy to `pawn_broker.db`
6. Paste it into the `database` folder (overwrite the existing file)

#### Step 4: Restart the Server

```bash
npm start
```

### Scenario 3: Complete System Reinstall

If you need to reinstall everything:

1. **Install Node.js** (if not already installed)
2. **Download/Clone your project** to a new location
3. **Install dependencies:**
   ```bash
   npm install
   ```
4. **Copy your backup file** to `database/pawn_broker.db`
5. **Start the server:**
   ```bash
   npm start
   ```

## 🔐 Best Practices for Data Safety

### 1. Multiple Backup Locations

**NEVER store backups only on the same computer!**

Copy backups to:
- **USB Drive** (most reliable)
- **Cloud Storage** (Google Drive, Dropbox, OneDrive)
- **External Hard Drive**
- **Network Drive** (different computer on your network)

### 2. Regular Manual Backups

Even though automatic backups run, create manual backups before:
- Installing system updates
- Making major changes
- Before traveling/leaving
- At the end of each business day

### 3. Verify Backups

Periodically verify that backups work:

```bash
# Create a test restore
sqlite3 backups/pawn_broker_backup_LATEST.db "SELECT COUNT(*) FROM loans;"
```

### 4. Keep Multiple Backup Versions

Don't rely on a single backup. Keep:
- Today's backup
- Yesterday's backup
- Last week's backup
- Last month's backup

## 🚨 Emergency Recovery Checklist

If your system has crashed and you've lost data:

- [ ] Stop using the computer immediately
- [ ] Check if database file exists: `database/pawn_broker.db`
- [ ] Check `backups` folder for recent backups
- [ ] Look for backups on USB drives
- [ ] Check cloud storage for backups
- [ ] Contact IT support if needed
- [ ] Once recovered, create multiple copies of backups

## 📊 Backup Management API

### List All Backups

```bash
curl http://localhost:3000/api/backup/list
```

### Create Backup

```bash
curl -X POST http://localhost:3000/api/backup/create
```

### Restore from Backup

```bash
curl -X POST http://localhost:3000/api/backup/restore \
  -H "Content-Type: application/json" \
  -d '{"backupPath": "./backups/pawn_broker_backup_2024-01-15T03-00-00.db"}'
```

### Download Backup File

Open in browser:
```
http://localhost:3000/api/backup/download/pawn_broker_backup_2024-01-15T03-00-00.db
```

## 🔍 Verifying Data After Recovery

After restoring, verify your data:

```bash
# Open database
sqlite3 database/pawn_broker.db

# Run these queries:
SELECT COUNT(*) FROM companies;
SELECT COUNT(*) FROM customers;
SELECT COUNT(*) FROM loans;
SELECT COUNT(*) FROM receipts;

# Check latest loan
SELECT * FROM loans ORDER BY id DESC LIMIT 5;

# Exit
.quit
```

## 📞 Support

If you're unable to recover your data:

1. **Don't panic** - Check all backup locations
2. **Don't write to the disk** - Avoid installing new software
3. **Check Windows Shadow Copies** - Right-click database folder → Properties → Previous Versions
4. **Contact technical support** immediately

## ⏰ Backup Schedule Reminder

- ✓ Automatic: Every 6 hours + Daily at 3 AM
- ✓ Manual: Before major changes
- ✓ External: Copy to USB/Cloud at least once daily
- ✓ Verification: Test restore monthly

---

**Remember: Data loss can happen to anyone. Prevention is easier than recovery. Always maintain backups!**

