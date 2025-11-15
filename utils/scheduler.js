const cron = require('node-cron');
const { backupDatabase } = require('../scripts/backupDatabase');

class BackupScheduler {
  constructor() {
    this.isRunning = false;
  }

  start() {
    if (this.isRunning) {
      console.log('Backup scheduler is already running');
      return;
    }

    // Schedule backup every day at 3:00 AM
    // Schedule backup every 6 hours as a safety measure
    cron.schedule('0 */6 * * *', async () => {
      console.log('\n=== Scheduled Backup Started ===');
      try {
        await backupDatabase();
        console.log('=== Scheduled Backup Completed ===\n');
      } catch (error) {
        console.error('Scheduled backup failed:', error.message);
      }
    });

    // Also backup daily at 3 AM for additional safety
    cron.schedule('0 3 * * *', async () => {
      console.log('\n=== Daily Backup Started ===');
      try {
        await backupDatabase();
        console.log('=== Daily Backup Completed ===\n');
      } catch (error) {
        console.error('Daily backup failed:', error.message);
      }
    });

    this.isRunning = true;
    console.log('✓ Backup scheduler started');
    console.log('  - Backup every 6 hours');
    console.log('  - Daily backup at 3:00 AM');
  }

  stop() {
    this.isRunning = false;
    console.log('Backup scheduler stopped');
  }
}

module.exports = BackupScheduler;

