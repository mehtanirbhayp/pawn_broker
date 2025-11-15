# Setup Instructions - Backup System

## What Was Added

Your Pawn Broker system now has a complete backup and recovery solution:

1. ✅ **Automatic Backups** - Runs every 6 hours + daily at 3 AM
2. ✅ **Manual Backup** - Create backups on demand
3. ✅ **Backup API** - Manage backups via API calls
4. ✅ **Recovery Tools** - Easy restore from any backup
5. ✅ **Documentation** - Complete guides for all scenarios

## What You Need to Do Now

### Step 1: Install the New Package

The `node-cron` package has been installed automatically. You're all set!

### Step 2: Restart Your Server

```bash
npm start
```

When you start the server, you'll see:
```
✓ Backup scheduler started
  - Backup every 6 hours
  - Daily backup at 3:00 AM
```

### Step 3: Test the Backup System

1. **Create a manual backup:**
   ```bash
   npm run backup
   ```

2. **Or via API:**
   ```
   http://localhost:3000/api/backup/create
   ```

3. **Check the backups folder:**
   ```
   File Explorer → backups/
   ```
   You should see backup files like: `pawn_broker_backup_2024-01-15T03-00-00.db`

### Step 4: Set Up External Backup Storage

**CRITICAL**: Backups on your computer are not enough!

Do this TODAY:
1. Copy the latest backup file from `backups/` folder
2. Paste it to:
   - USB Drive (recommended)
   - Google Drive / Dropbox
   - External Hard Drive
   - Email to yourself

**Do this daily or weekly** depending on how much data you add.

## How Automatic Backups Work

- The server creates backups automatically in the background
- No action needed from you
- Backups are stored in `backups/` folder
- Old backups (>30 days) are deleted automatically

## If Your System Crashes

### Quick Recovery Steps:

1. **Check if backups exist:**
   ```
   File Explorer → backups/ → look for recent files
   ```

2. **If you have backups:**
   - Stop the server (if running)
   - Copy the most recent backup file
   - Rename it to `pawn_broker.db`
   - Paste it into `database/` folder
   - Restart server: `npm start`

3. **If no backups on computer:**
   - Check USB drive
   - Check cloud storage
   - Check Windows Previous Versions (right-click folder → Properties → Previous Versions)

## Where to Find More Help

- **Quick Reference**: `QUICK_BACKUP_GUIDE.txt`
- **Complete Guide**: `BACKUP_RECOVERY.md`
- **Updated README**: `README.md`

## Backup API Endpoints

You can use these from your frontend or via browser:

```
List backups:    GET  http://localhost:3000/api/backup/list
Create backup:   POST http://localhost:3000/api/backup/create
Restore backup:  POST http://localhost:3000/api/backup/restore
Download backup: GET  http://localhost:3000/api/backup/download/filename.db
```

## Important Reminders

⚠️ **Never rely only on automatic backups on the same computer!**

✓ Copy backups to external storage
✓ Keep multiple backup versions
✓ Test restore process monthly
✓ Create manual backup before major changes

---

**Your data is now protected! But remember: backups only work if you copy them to external storage.**

