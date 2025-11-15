const express = require('express');
const Database = require('../utils/database');
const moment = require('moment');
const router = express.Router();

// Create new loan
router.post('/', async (req, res) => {
  try {
    const {
      serialNumber,
      companyId,
      customerName,
      fatherName,
      husbandName,
      address,
      occupation,
      cellNumber,
      loanAmount,
      itemWeight,
      itemDescription,
      itemType,
      loanDate,
      interestRate = 2.0
    } = req.body;

    // Validate required fields
    if (!serialNumber || !companyId || !customerName || !address || !loanAmount || !itemWeight || !itemDescription || !itemType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    if (!['gold', 'silver'].includes(itemType)) {
      return res.status(400).json({
        success: false,
        error: 'Item type must be gold or silver'
      });
    }

    const db = new Database();
    
    // Check if company exists and supports this item type
    const company = await db.get('SELECT * FROM companies WHERE id = ?', [companyId]);
    if (!company) {
      await db.close();
      return res.status(404).json({
        success: false,
        error: 'Company not found'
      });
    }

    if (company.type !== 'both' && company.type !== itemType) {
      await db.close();
      return res.status(400).json({
        success: false,
        error: `Company ${company.name} does not support ${itemType} loans`
      });
    }

    // Create or find customer
    let customerId;
    const existingCustomer = await db.get(
      'SELECT id FROM customers WHERE name = ? AND cell_number = ?',
      [customerName, cellNumber]
    );

    if (existingCustomer) {
      customerId = existingCustomer.id;
      // Update customer information
      await db.run(
        'UPDATE customers SET father_name = ?, husband_name = ?, address = ?, occupation = ? WHERE id = ?',
        [fatherName, husbandName, address, occupation, customerId]
      );
    } else {
      const customerResult = await db.run(
        'INSERT INTO customers (name, father_name, husband_name, address, occupation, cell_number) VALUES (?, ?, ?, ?, ?, ?)',
        [customerName, fatherName, husbandName, address, occupation, cellNumber]
      );
      customerId = customerResult.id;
    }

    const normalizedSerial = String(serialNumber).trim();
    if (!normalizedSerial) {
      await db.close();
      return res.status(400).json({
        success: false,
        error: 'Serial number cannot be empty'
      });
    }

    const existingSerial = await db.get(
      'SELECT id FROM loans WHERE company_id = ? AND serial_number = ?',
      [companyId, normalizedSerial]
    );

    if (existingSerial) {
      await db.close();
      return res.status(400).json({
        success: false,
        error: 'A loan with this serial number already exists for the selected company'
      });
    }

    // Create loan
    const loanDateFormatted = loanDate ? moment(loanDate).format('YYYY-MM-DD') : moment().format('YYYY-MM-DD');
    const loanResult = await db.run(
      `INSERT INTO loans (serial_number, company_id, customer_id, loan_amount, item_weight, 
       item_description, item_type, loan_date, interest_rate) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [normalizedSerial, companyId, customerId, loanAmount, itemWeight, itemDescription, itemType, loanDateFormatted, interestRate]
    );

    await db.close();

    res.status(201).json({
      success: true,
      data: {
        loanId: loanResult.id,
        serialNumber: normalizedSerial,
        customerId,
        message: 'Loan created successfully'
      }
    });
  } catch (error) {
    console.error('Error creating loan:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create loan'
    });
  }
});

// Get all loans with filters
router.get('/', async (req, res) => {
  try {
    const { companyId, status, itemType, search, page = 1, limit = 50 } = req.query;
    const db = new Database();
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    
    if (companyId) {
      whereClause += ' AND l.company_id = ?';
      params.push(companyId);
    }
    
    if (status) {
      whereClause += ' AND l.status = ?';
      params.push(status);
    }
    
    if (itemType) {
      whereClause += ' AND l.item_type = ?';
      params.push(itemType);
    }

    if (search && search.trim()) {
      const likeValue = `%${search.trim()}%`;
      whereClause += ' AND (l.serial_number LIKE ? OR cu.name LIKE ? OR cu.cell_number LIKE ?)';
      params.push(likeValue, likeValue, likeValue);
    }
    
    const offset = (page - 1) * limit;
    
    const loans = await db.query(`
      SELECT l.*, c.name as company_name, c.type as company_type,
             cu.name as customer_name, cu.father_name, cu.husband_name, 
             cu.address, cu.occupation, cu.cell_number
      FROM loans l
      JOIN companies c ON l.company_id = c.id
      JOIN customers cu ON l.customer_id = cu.id
      ${whereClause}
      ORDER BY l.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);
    
    // Get total count
    const totalResult = await db.get(`
      SELECT COUNT(*) as total
      FROM loans l
      JOIN customers cu ON l.customer_id = cu.id
      ${whereClause}
    `, params);
    
    await db.close();
    
    res.json({
      success: true,
      data: {
        loans,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalResult.total,
          pages: Math.ceil(totalResult.total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching loans:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch loans'
    });
  }
});

// Get loan by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = new Database();
    
    const loan = await db.get(`
      SELECT l.*, c.name as company_name, c.type as company_type,
             cu.name as customer_name, cu.father_name, cu.husband_name, 
             cu.address, cu.occupation, cu.cell_number
      FROM loans l
      JOIN companies c ON l.company_id = c.id
      JOIN customers cu ON l.customer_id = cu.id
      WHERE l.id = ?
    `, [id]);
    
    await db.close();
    
    if (!loan) {
      return res.status(404).json({
        success: false,
        error: 'Loan not found'
      });
    }
    
    res.json({
      success: true,
      data: loan
    });
  } catch (error) {
    console.error('Error fetching loan:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch loan'
    });
  }
});

// Update loan status (deliver item)
router.patch('/:id/deliver', async (req, res) => {
  try {
    const { id } = req.params;
    const { deliveredDate } = req.body;
    
    const db = new Database();
    
    // Check if loan exists and is active
    const loan = await db.get('SELECT * FROM loans WHERE id = ? AND status = "active"', [id]);
    if (!loan) {
      await db.close();
      return res.status(404).json({
        success: false,
        error: 'Active loan not found'
      });
    }
    
    const deliveredDateFormatted = deliveredDate ? moment(deliveredDate).format('YYYY-MM-DD') : moment().format('YYYY-MM-DD');
    
    await db.run(
      'UPDATE loans SET status = "delivered", delivered_date = ? WHERE id = ?',
      [deliveredDateFormatted, id]
    );
    
    await db.close();
    
    res.json({
      success: true,
      message: 'Loan marked as delivered successfully'
    });
  } catch (error) {
    console.error('Error delivering loan:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to deliver loan'
    });
  }
});

// Update loan status (mark as defaulted)
router.patch('/:id/default', async (req, res) => {
  try {
    const { id } = req.params;
    
    const db = new Database();
    
    // Check if loan exists and is active
    const loan = await db.get('SELECT * FROM loans WHERE id = ? AND status = "active"', [id]);
    if (!loan) {
      await db.close();
      return res.status(404).json({
        success: false,
        error: 'Active loan not found'
      });
    }
    
    await db.run(
      'UPDATE loans SET status = "defaulted" WHERE id = ?',
      [id]
    );
    
    await db.close();
    
    res.json({
      success: true,
      message: 'Loan marked as defaulted successfully'
    });
  } catch (error) {
    console.error('Error defaulting loan:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark loan as defaulted'
    });
  }
});

// Delete loan permanently
router.delete('/:id', async (req, res) => {
  let db;
  let transactionStarted = false;

  try {
    const { id } = req.params;
    db = new Database();

    const loan = await db.get(
      'SELECT id FROM loans WHERE id = ?',
      [id]
    );

    if (!loan) {
      await db.close();
      return res.status(404).json({
        success: false,
        error: 'Loan not found'
      });
    }

    await db.run('BEGIN TRANSACTION');
    transactionStarted = true;

    await db.run('DELETE FROM receipts WHERE loan_id = ?', [id]);
    const deleteResult = await db.run('DELETE FROM loans WHERE id = ?', [id]);

    if (deleteResult.changes === 0) {
      await db.run('ROLLBACK');
      transactionStarted = false;
      await db.close();

      return res.status(404).json({
        success: false,
        error: 'Loan not found or already deleted'
      });
    }

    await db.run('COMMIT');
    transactionStarted = false;
    await db.close();

    res.json({
      success: true,
      message: 'Loan deleted permanently',
      deletedLoanId: Number(id)
    });
  } catch (error) {
    console.error('Error deleting loan:', error);

    if (db) {
      if (transactionStarted) {
        try {
          await db.run('ROLLBACK');
        } catch (rollbackError) {
          console.error('Failed to rollback transaction:', rollbackError);
        }
      }

      try {
        await db.close();
      } catch (closeError) {
        console.error('Failed to close database after delete error:', closeError);
      }
    }

    res.status(500).json({
      success: false,
      error: 'Failed to delete loan'
    });
  }
});

module.exports = router;

