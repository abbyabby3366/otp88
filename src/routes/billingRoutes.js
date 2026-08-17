const express = require('express');
const router = express.Router();
const { UserModel, InvoiceModel, TransactionModel } = require('../models');
const { verifyJwtMiddleware, requireAdmin } = require('../middleware/auth');

// Billing Invoices Endpoint (User & Admin)
router.get(['/api/billing/invoices', '/api/admin/invoices', '/api/admin/billing/invoices'], verifyJwtMiddleware, async (req, res) => {
  try {
    let query = {};
    if (req.user.role !== 'ADMIN') {
      query.userId = req.user.id;
    }
    const invoices = await InvoiceModel.find(query).sort({ createdAt: -1 }).limit(100).lean();

    let userMap = {};
    if (req.user.role === 'ADMIN') {
      const users = await UserModel.find({}).select('name email _id').lean();
      users.forEach(u => {
        userMap[u._id.toString()] = { name: u.name, email: u.email };
      });
    }

    const formatted = invoices.map(inv => ({
      id: inv.invoiceId,
      date: inv.date,
      amount: inv.amount,
      method: inv.method,
      status: inv.status,
      userId: inv.userId,
      userName: (inv.userId && userMap[inv.userId]) ? userMap[inv.userId].name : (inv.userId === 'usr_dev' ? 'dev_user' : 'User'),
      userEmail: (inv.userId && userMap[inv.userId]) ? userMap[inv.userId].email : ''
    }));
    res.json({ success: true, invoices: formatted });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, invoices: [] });
  }
});

// User & Admin Unified Transaction & Usage Ledger Endpoint
router.get(['/api/billing/transactions', '/api/admin/transactions', '/api/admin/billing/transactions'], verifyJwtMiddleware, async (req, res) => {
  try {
    const { type, search } = req.query;
    let query = {};
    if (req.user.role !== 'ADMIN') {
      query.userId = req.user.id;
    }
    if (type && type !== 'ALL') {
      query.type = type;
    }
    if (search) {
      const q = search.trim();
      query.$or = [
        { txId: { $regex: q, $options: 'i' } },
        { referenceId: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { recipient: { $regex: q, $options: 'i' } },
        { userName: { $regex: q, $options: 'i' } },
        { userEmail: { $regex: q, $options: 'i' } }
      ];
    }

    let txs = await TransactionModel.find(query).sort({ createdAt: -1 }).limit(200).lean();

    res.json({ success: true, total: txs.length, transactions: txs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, transactions: [] });
  }
});

// Admin Manual Balance Adjustment (Credit / Debit) for any User
router.post(['/api/admin/billing/topup', '/api/admin/billing/adjust-balance', '/api/admin/billing/adjust'], verifyJwtMiddleware, requireAdmin, async (req, res) => {
  const { userId, amount = 100, method = '', action = 'CREDIT' } = req.body;
  const numAmount = Math.abs(parseFloat(amount)) || 0;
  if (numAmount <= 0) {
    return res.status(400).json({ success: false, error: 'Please enter a valid amount greater than 0.' });
  }

  const isDebit = String(action).toUpperCase() === 'DEBIT';
  const deltaAmount = isDebit ? -numAmount : numAmount;
  const invoicePrefix = isDebit ? 'DBT-ADM-' : 'INV-ADM-';
  const invoiceId = invoicePrefix + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
  const dateStr = new Date().toISOString().split('T')[0];
  const refMethod = method && method.trim() ? method.trim() : (isDebit ? 'Admin Manual Debit' : 'Manual Admin Credit');

  try {
    let targetUser = null;
    if (userId && userId.match(/^[0-9a-fA-F]{24}$/)) {
      targetUser = await UserModel.findById(userId);
    } else {
      targetUser = await UserModel.findOne({ role: 'USER' });
    }

    if (!targetUser) {
      return res.status(404).json({ success: false, error: 'Target user not found.' });
    }

    const curBalance = targetUser.balanceUsd !== undefined ? targetUser.balanceUsd : 50.00;
    if (isDebit && curBalance < numAmount) {
      return res.status(400).json({
        success: false,
        error: `Insufficient balance: Cannot debit $${numAmount.toFixed(4)}. User only has $${curBalance.toFixed(4)}.`
      });
    }

    const updatedUser = await UserModel.findByIdAndUpdate(
      targetUser._id,
      { $inc: { balanceUsd: deltaAmount } },
      { new: true }
    );

    const inv = await InvoiceModel.create({
      userId: targetUser._id.toString(),
      invoiceId,
      date: dateStr,
      amount: `${isDebit ? '-' : ''}$${numAmount.toFixed(2)}`,
      method: refMethod,
      status: 'PAID'
    });

    // Record in Transaction Ledger
    try {
      await TransactionModel.create({
        txId: 'TX_' + invoiceId,
        userId: targetUser._id.toString(),
        userName: targetUser.name || targetUser.email,
        userEmail: targetUser.email,
        type: isDebit ? 'ADMIN_DEBIT' : 'ADMIN_CREDIT',
        category: isDebit ? 'Balance Debit' : 'Balance Top-up',
        description: isDebit
          ? `Admin Manual Debit (-$${numAmount.toFixed(2)}) via ${refMethod}`
          : `Admin Manual Credit (+$${numAmount.toFixed(2)}) via ${refMethod}`,
        referenceId: invoiceId,
        channel: refMethod,
        recipient: targetUser.email,
        amount: deltaAmount,
        balanceBefore: curBalance,
        balanceAfter: updatedUser.balanceUsd,
        status: 'PAID',
        date: dateStr,
        time: new Date().toTimeString().split(' ')[0]
      });
    } catch (txErr) {
      console.error('Error logging transaction:', txErr.message);
    }

    res.json({
      success: true,
      message: isDebit
        ? `Successfully debited $${numAmount.toFixed(2)} from ${targetUser.name || targetUser.email}! New balance: $${updatedUser.balanceUsd.toFixed(4)}`
        : `Successfully credited $${numAmount.toFixed(2)} to ${targetUser.name || targetUser.email}! New balance: $${updatedUser.balanceUsd.toFixed(4)}`,
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
});

// User Top-up
router.post('/api/billing/topup', verifyJwtMiddleware, async (req, res) => {
  const { amount = 100, method = 'Credit Card (Stripe)' } = req.body;
  const numAmount = parseFloat(amount) || 100;
  const invoiceId = 'INV-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
  const dateStr = new Date().toISOString().split('T')[0];

  try {
    let targetUser = null;
    if (req.user.id && req.user.id.match(/^[0-9a-fA-F]{24}$/)) {
      targetUser = await UserModel.findById(req.user.id);
    }
    if (!targetUser) {
      targetUser = await UserModel.findOne({ role: 'USER' }) || await UserModel.findOne();
    }

    const curBalance = targetUser ? (targetUser.balanceUsd || 50.00) : 50.00;

    const inv = await InvoiceModel.create({
      userId: targetUser ? targetUser._id.toString() : (req.user.id || 'usr_dev'),
      invoiceId,
      date: dateStr,
      amount: `$${numAmount.toFixed(2)}`,
      method,
      status: 'PAID'
    });

    let newBalance = curBalance + numAmount;
    if (targetUser) {
      const updatedUser = await UserModel.findByIdAndUpdate(
        targetUser._id,
        { $inc: { balanceUsd: numAmount } },
        { new: true }
      );
      if (updatedUser) newBalance = updatedUser.balanceUsd;
    }

    // Record in Transaction Ledger
    try {
      await TransactionModel.create({
        txId: 'TX_' + invoiceId,
        userId: targetUser ? targetUser._id.toString() : 'usr_dev',
        userName: targetUser ? (targetUser.name || targetUser.email) : 'User',
        userEmail: targetUser ? targetUser.email : 'user@example.com',
        type: 'TOPUP',
        category: 'Balance Top-up',
        description: `Account Top-up ($${numAmount.toFixed(2)}) via ${method}`,
        referenceId: invoiceId,
        channel: method,
        recipient: targetUser ? targetUser.email : 'user@example.com',
        amount: numAmount,
        balanceBefore: curBalance,
        balanceAfter: newBalance,
        status: 'PAID',
        date: dateStr,
        time: new Date().toTimeString().split(' ')[0]
      });
    } catch (txErr) {}

    res.json({
      success: true,
      message: `Payment of $${numAmount.toFixed(2)} recorded successfully via ${method}.`,
      invoice: {
        id: inv.invoiceId,
        date: inv.date,
        amount: inv.amount,
        method: inv.method,
        status: inv.status
      },
      newBalance
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
