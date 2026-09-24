const express = require('express');
const router = express.Router();
const { getIsDbConnected } = require('../config/db');
const { UserModel, OtpLogModel, TransactionModel } = require('../models');
const { verifyJwtMiddleware, loadAuthenticatedUser } = require('../middleware/auth');

const fmtDate = (d) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

function parseRange(fromDate, toDate) {
  const now = new Date();
  let rangeStart = new Date(now.getFullYear(), now.getMonth(), 1);
  rangeStart.setHours(0, 0, 0, 0);
  let rangeEnd = new Date();
  rangeEnd.setHours(23, 59, 59, 999);

  if (fromDate) {
    const p = new Date(fromDate);
    if (!isNaN(p.getTime())) { p.setHours(0, 0, 0, 0); rangeStart = p; }
  }
  if (toDate) {
    const p = new Date(toDate);
    if (!isNaN(p.getTime())) { p.setHours(23, 59, 59, 999); rangeEnd = p; }
  }
  return { rangeStart, rangeEnd };
}

/**
 * Usage metrics for the dashboard. Values that cannot be computed (no traffic yet)
 * are returned as null so the UI can show an empty state instead of a made-up number.
 */
router.get(['/api/metrics', '/api/admin/metrics'], verifyJwtMiddleware, async (req, res) => {
  try {
    const { rangeStart, rangeEnd } = parseRange(req.query.fromDate, req.query.toDate);
    const empty = {
      totalMonthlyOtps: 0,
      monthlyOtps: 0,
      totalOtps: 0,
      fromDate: fmtDate(rangeStart),
      toDate: fmtDate(rangeEnd),
      totalTenants: 0,
      balanceUsd: null,
      totalSpentUsd: '0.0000',
      deliveryRate: null,
      carrierSuccessRate: null,
      avgLatency: null,
      channelBreakdown: {}
    };
    if (!getIsDbConnected()) return res.json({ success: true, metrics: empty });

    const isAdmin = req.user.role === 'ADMIN';
    const logQuery = isAdmin ? {} : { userId: req.user.id };
    const txQuery = isAdmin ? { type: 'USAGE_OTP' } : { type: 'USAGE_OTP', userId: req.user.id };
    const dateFilter = { $gte: rangeStart, $lte: rangeEnd };
    const rangeLogQuery = { ...logQuery, createdAt: dateFilter };

    const [userCount, logCount, rangeLogCount, statusAgg, latencyAgg, spentAgg, channelAgg, refundAgg] = await Promise.all([
      UserModel.countDocuments(),
      OtpLogModel.countDocuments(logQuery),
      OtpLogModel.countDocuments(rangeLogQuery),
      OtpLogModel.aggregate([{ $match: logQuery }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
      OtpLogModel.find(logQuery).sort({ createdAt: -1 }).limit(100).select('latency').lean(),
      TransactionModel.aggregate([{ $match: { ...txQuery, createdAt: dateFilter } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      OtpLogModel.aggregate([{ $match: logQuery }, { $group: { _id: '$channel', count: { $sum: 1 } } }]),
      TransactionModel.aggregate([{ $match: { ...txQuery, type: 'REFUND', createdAt: dateFilter } }, { $group: { _id: null, total: { $sum: '$amount' } } }])
    ]);

    // Delivery rate: delivered, read or sent (awaiting receipt) over everything that was attempted
    const statusCounts = Object.fromEntries(statusAgg.map(s => [String(s._id || '').toUpperCase(), s.count]));
    const okCount = (statusCounts.DELIVERED || 0) + (statusCounts.READ || 0) + (statusCounts.SENT || 0);
    const deliveryRate = logCount > 0 ? ((okCount / logCount) * 100).toFixed(2) + '%' : null;

    let avgLatency = null;
    if (latencyAgg.length > 0) {
      const values = latencyAgg
        .map(l => { const m = String(l.latency || '').match(/([0-9.]+)/); return m ? parseFloat(m[1]) : null; })
        .filter(v => v !== null && !isNaN(v));
      if (values.length > 0) avgLatency = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2) + 's';
    }

    const spent = spentAgg.length > 0 ? Math.abs(spentAgg[0].total) : 0;
    const refunded = refundAgg.length > 0 ? Math.abs(refundAgg[0].total) : 0;
    const totalSpent = Math.max(0, spent - refunded);

    let balanceUsd = null;
    const account = await loadAuthenticatedUser(req);
    if (account && account.balanceUsd !== undefined) balanceUsd = account.balanceUsd;

    const channelBreakdown = {};
    if (logCount > 0) {
      channelAgg.forEach(cs => {
        const key = String(cs._id || 'other').toLowerCase().replace(/[^a-z]/g, '') || 'other';
        channelBreakdown[key] = `${Math.round((cs.count / logCount) * 100)}%`;
      });
    }

    res.json({
      success: true,
      metrics: {
        ...empty,
        totalMonthlyOtps: rangeLogCount,
        monthlyOtps: rangeLogCount,
        totalOtps: logCount,
        totalTenants: userCount,
        balanceUsd,
        totalSpentUsd: totalSpent.toFixed(4),
        deliveryRate,
        carrierSuccessRate: deliveryRate,
        avgLatency,
        statusCounts,
        channelBreakdown
      }
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

module.exports = router;
