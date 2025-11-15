const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, '..', 'database', 'pawn_broker.db');

function migrateSerialNumbers(db, finish) {
  const migrationSql = `
    BEGIN TRANSACTION;
    DROP TABLE IF EXISTS loans_new;
    CREATE TABLE IF NOT EXISTS loans_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      serial_number TEXT NOT NULL,
      company_id INTEGER NOT NULL,
      customer_id INTEGER NOT NULL,
      loan_amount DECIMAL(10,2) NOT NULL,
      item_weight DECIMAL(8,3) NOT NULL,
      item_description TEXT NOT NULL,
      item_type TEXT NOT NULL CHECK (item_type IN ('gold', 'silver')),
      loan_date DATE NOT NULL,
      interest_rate DECIMAL(5,2) DEFAULT 2.0,
      status TEXT DEFAULT 'active' CHECK (status IN ('active', 'delivered', 'defaulted')),
      delivered_date DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies (id),
      FOREIGN KEY (customer_id) REFERENCES customers (id)
    );
    INSERT INTO loans_new (
      id, serial_number, company_id, customer_id, loan_amount, item_weight,
      item_description, item_type, loan_date, interest_rate, status,
      delivered_date, created_at
    )
    SELECT
      id, serial_number, company_id, customer_id, loan_amount, item_weight,
      item_description, item_type, loan_date, interest_rate, status,
      delivered_date, created_at
    FROM loans;
    DROP TABLE loans;
    ALTER TABLE loans_new RENAME TO loans;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_loans_company_serial
      ON loans (company_id, serial_number);
    COMMIT;
  `;

  db.exec(migrationSql, (err) => {
    if (err) {
      db.exec('ROLLBACK;', () => finish(err));
    } else {
      finish();
    }
  });
}

function ensureCompositeIndex(db, finish) {
  db.run(
    'CREATE UNIQUE INDEX IF NOT EXISTS idx_loans_company_serial ON loans (company_id, serial_number)',
    (err) => finish(err)
  );
}

function ensureUsersTable(db, callback) {
  db.run(
    `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'admin',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `,
    (tableErr) => {
      if (tableErr) {
        return callback(tableErr);
      }

      db.get(
        'SELECT id FROM users WHERE username = ?',
        ['admin'],
        (selectErr, row) => {
          if (selectErr) {
            return callback(selectErr);
          }

          if (row) {
            return callback();
          }

          const passwordHash = bcrypt.hashSync('admin123', 10);
          db.run(
            'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
            ['admin', passwordHash, 'admin'],
            callback
          );
        }
      );
    }
  );
}

function runMigrations() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        reject(err);
      }
    });

    const finish = (error) => {
      db.close((closeErr) => {
        if (error) {
          reject(error);
        } else if (closeErr) {
          reject(closeErr);
        } else {
          resolve();
        }
      });
    };

    db.serialize(() => {
      ensureUsersTable(db, (userErr) => {
        if (userErr) {
          return finish(userErr);
        }

        db.get(
          "SELECT name, sql FROM sqlite_master WHERE type = 'table' AND name = 'loans'",
          (err, row) => {
            if (err) {
              return finish(err);
            }

            if (!row) {
              return finish();
            }

            const tableSql = row.sql || '';
            const hasUniqueSerial =
              /serial_number\s+TEXT\s+NOT\s+NULL\s+UNIQUE/i.test(tableSql);

            if (hasUniqueSerial) {
              migrateSerialNumbers(db, finish);
            } else {
              ensureCompositeIndex(db, finish);
            }
          }
        );
      });
    });
  });
}

module.exports = runMigrations;

