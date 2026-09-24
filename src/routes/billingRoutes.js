const express = require('express');
const router = express.Router();
const { getIsDbConnected } = require('../config/db');
const { UserModel, InvoiceModel, TransactionModel } = require('../models');
const { verifyJwtMiddleware, requireAdmin, loadAuthenticatedUser } = require('../middleware/auth');
const { validateBody, PATTERNS } = require('../middleware/validate');
const { creditUserBalanceAndRecordTx } = require('../services/balanceService');

const requireDb = (req, res, next) => {
  if (!getIsDbConnected()) {
    return res.status(503).json({ success: false, error: 'Billing is temporarily unavailable. Please try again shortly.' });
  }
  next();
};

// Invoices (users see their own, admins see everyone's)
router.get(['/api/billing/invoices', '/api/admin/invoices', '/api/admin/billing/invoices'], verifyJwtMiddleware, async (req, res) => {
  try {
    if (!getIsDbConnected()) return res.json({ success: true, invoices: [] });
    const query = req.user.role === 'ADMIN' ? {} : { userId: req.user.id };
    const invoices = await InvoiceModel.find(query).sort({ createdAt: -1 }).limit(100).lean();

    const userMap = {};
    if (req.user.role === 'ADMIN') {
      const users = await UserModel.find({}).select('name email _id').lean();
      users.forEach(u => { userMap[u._id.toString()] = { name: u.name, email: u.email }; });
    }

    const formatted = invoices.map(inv => ({
      id: inv.invoiceId,
      date: inv.date,
      amount: inv.amount,
      method: inv.method,
      status: inv.status,
      userId: inv.userId,
      userName: userMap[inv.userId]?.name || '',
      userEmail: userMap[inv.userId]?.email || ''
    }));
    res.json({ success: true, invoices: formatted });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, invoices: [] });
  }
});

// Transaction ledger
router.get(['/api/billing/transactions', '/api/admin/transactions', '/api/admin/billing/transactions'], verifyJwtMiddleware, async (req, res) => {
  try {
    if (!getIsDbConnected()) return res.json({ success: true, total: 0, transactions: [] });
    const { type, search } = req.query;
    const query = req.user.role === 'ADMIN' ? {} : { userId: req.user.id };
    if (type && type !== 'ALL') query.type = String(type).slice(0, 40);
    if (search) {
      const q = String(search).trim().slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = ['txId', 'referenceId', 'description', 'recipient', 'userName', 'userEmail']
        .map(field => ({ [field]: { $regex: q, $options: 'i' } }));
    }
    const txs = await TransactionModel.find(query).sort({ createdAt: -1 }).limit(200).lean();
    res.json({ success: true, total: txs.length, transactions: txs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, transactions: [] });
  }
});

// Admin: credit or debit any user's balance
router.post(
  ['/api/admin/billing/topup', '/api/admin/billing/adjust-balance', '/api/admin/billing/adjust'],
  verifyJwtMiddleware,
  requireAdmin,
  requireDb,
  validateBody({
    userId: { required: true, pattern: PATTERNS.objectId, patternMessage: 'must be a valid user id' },
    amount: { required: true, type: 'number', min: 0.0001, max: 1000000 },
    method: { maxLength: 100 },
    action: { enum: ['CREDIT', 'DEBIT', 'credit', 'debit'] }
  }),
  async (req, res) => {
    const { userId, amount, method = '', action = 'CREDIT' } = req.body;
    const numAmount = Math.abs(amount);
    const isDebit = String(action).toUpperCase() === 'DEBIT';
    const deltaAmount = isDebit ? -numAmount : numAmount;
    const invoicePrefix = isDebit ? 'DBT-ADM-' : 'INV-ADM-';
    const invoiceId = invoicePrefix + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
    const dateStr = new Date().toISOString().split('T')[0];
    const refMethod = method || (isDebit ? 'Admin Manual Debit' : 'Admin Manual Credit');

    try {
      const targetUser = await UserModel.findById(userId);
      if (!targetUser) {
        return res.status(404).json({ success: false, error: 'Target user not found.' });
      }

      const curBalance = targetUser.balanceUsd ?? 0;
      if (isDebit && curBalance < numAmount) {
        return res.status(400).json({
          success: false,
          error: `Insufficient balance: cannot debit $${numAmount.toFixed(4)}. User only has $${curBalance.toFixed(4)}.`
        });
      }

      const updatedUser = await UserModel.findByIdAndUpdate(targetUser._id, { $inc: { balanceUsd: deltaAmount } }, { new: true });

      const inv = await InvoiceModel.create({
        userId: targetUser._id.toString(),
        invoiceId,
        date: dateStr,
        amount: `${isDebit ? '-' : ''}$${numAmount.toFixed(2)}`,
        method: refMethod,
        status: 'PAID'
      });

      await TransactionModel.create({
        txId: 'TX_' + invoiceId,
        userId: targetUser._id.toString(),
        userName: targetUser.name || targetUser.email,
        userEmail: targetUser.email,
        type: isDebit ? 'ADMIN_DEBIT' : 'ADMIN_CREDIT',
        category: isDebit ? 'Balance Debit' : 'Balance Top-up',
        description: `${isDebit ? 'Admin debit' : 'Admin credit'} of $${numAmount.toFixed(2)} via ${refMethod}`,
        referenceId: invoiceId,
        channel: refMethod,
        recipient: targetUser.email,
        amount: deltaAmount,
        balanceBefore: curBalance,
        balanceAfter: updatedUser.balanceUsd,
        status: 'PAID',
        date: dateStr,
        time: new Date().toTimeString().split(' ')[0]
      }).catch(txErr => console.error('Error logging transaction:', txErr.message));

      res.json({
        success: true,
        message: `${isDebit ? 'Debited' : 'Credited'} $${numAmount.toFixed(2)} ${isDebit ? 'from' : 'to'} ${targetUser.name || targetUser.email}. New balance: $${updatedUser.balanceUsd.toFixed(4)}`,
        invoice: {
          id: inv.invoiceId,
          date: inv.date,
          amount: inv.amount,
          method: inv.method,
          status: inv.status,
          userName: targetUser.name || targetUser.email,
          userEmail: targetUser.email
        },
        newBalance: updatedUser.balanceUsd
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// User top-up. Records the payment against the signed-in account only.
router.post(
  '/api/billing/topup',
  verifyJwtMiddleware,
  requireDb,
  validateBody({
    amount: { required: true, type: 'number', min: 1, max: 100000 },
    method: { maxLength: 100 }
  }),
  async (req, res) => {
    const { amount, method = 'Credit Card' } = req.body;
    const invoiceId = 'INV-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
    const dateStr = new Date().toISOString().split('T')[0];

    try {
      const targetUser = await loadAuthenticatedUser(req);
      if (!targetUser) {
        return res.status(404).json({ success: false, error: 'Account not found.' });
      }

      const inv = await InvoiceModel.create({
        userId: targetUser._id.toString(),
        invoiceId,
        date: dateStr,
        amount: `$${amount.toFixed(2)}`,
        method,
        status: 'PAID'
      });

      const credit = await creditUserBalanceAndRecordTx({
        userId: targetUser._id.toString(),
        amount,
        type: 'TOPUP',
        method,
        referenceId: invoiceId,
        description: `Account top-up of $${amount.toFixed(2)} via ${method}`
      });

      res.json({
        success: true,
        message: `Payment of $${amount.toFixed(2)} recorded via ${method}.`,
        invoice: { id: inv.invoiceId, date: inv.date, amount: inv.amount, method: inv.method, status: inv.status },
        newBalance: credit ? credit.updatedUser.balanceUsd : targetUser.balanceUsd
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

module.exports = router;
