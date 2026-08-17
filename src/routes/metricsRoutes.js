const express = require('express');
const router = express.Router();
const { UserModel, OtpLogModel, TransactionModel } = require('../models');
const { verifyJwtMiddleware } = require('../middleware/auth');

// Unified Live Metrics Endpoint (Calculated dynamically from MongoDB with Date Range support)
router.get(['/api/metrics', '/api/admin/metrics'], verifyJwtMiddleware, async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;
    let logQuery = {};
    let txQuery = { type: 'USAGE_OTP' };

    if (req.user && req.user.role !== 'ADMIN') {
      logQuery = { userId: req.user.id };
      txQuery.userId = req.user.id;
    }

    const now = new Date();
    const defaultStartOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    defaultStartOfMonth.setHours(0, 0, 0, 0);

    let rangeStart = defaultStartOfMonth;
    let rangeEnd = new Date();
    rangeEnd.setHours(23, 59, 59, 999);

    if (fromDate) {
      const pFrom = new Date(fromDate);
      if (!isNaN(pFrom.getTime())) {
        pFrom.setHours(0, 0, 0, 0);
        rangeStart = pFrom;
      }
    }

    if (toDate) {
      const pTo = new Date(toDate);
      if (!isNaN(pTo.getTime())) {
        pTo.setHours(23, 59, 59, 999);
        rangeEnd = pTo;
      }
    }

    const dateFilter = {
      $gte: rangeStart,
      $lte: rangeEnd
    };

    const monthlyLogQuery = {
      ...logQuery,
      $or: [
        { createdAt: dateFilter },
        { createdAt: { $exists: false } }
      ]
    };

    const userCount = await UserModel.countDocuments();
    const logCount = await OtpLogModel.countDocuments(logQuery);
    const monthlyLogCount = await OtpLogModel.countDocuments(monthlyLogQuery);
    const deliveredCount = await OtpLogModel.countDocuments({ ...logQuery, status: { $in: ['DELIVERED', 'SENT'] } });
    const successRate = logCount > 0 ? ((deliveredCount / logCount) * 100).toFixed(2) + '%' : '100.0%';

    // Calculate actual average delivery latency from real logs
    const recentLogs = await OtpLogModel.find(logQuery).sort({ createdAt: -1 }).limit(100).lean();
    let avgLatency = '0.55s';
    if (recentLogs.length > 0) {
      const latencies = recentLogs.map(l => {
        const m = (l.latency || '').match(/([0-9.]+)/);
        return m ? parseFloat(m[1]) : 0.6;
      });
      const sum = latencies.reduce((a, b) => a + b, 0);
      avgLatency = (sum / latencies.length).toFixed(2) + 's';
    }

    // Calculate actual spent total from Transaction Ledger or OTP Log costs for the selected date range
    const txRangeQuery = {
      ...txQuery,
      createdAt: dateFilter
    };
    const spentResult = await TransactionModel.aggregate([
      { $match: txRangeQuery },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    let totalSpent = spentResult.length > 0 ? Math.abs(spentResult[0].total) : 0;

    // Fallback: If transaction total is 0 but we have OTP logs in date range, sum the log costs
    if (totalSpent === 0 && monthlyLogCount > 0) {
      const logsWithCost = await OtpLogModel.find(monthlyLogQuery).lean();
      const calculatedSpent = logsWithCost.reduce((sum, l) => {
        const costVal = typeof l.cost === 'string' ? parseFloat(l.cost.replace('$', '')) : (parseFloat(l.cost) || 0);
        return sum + (isNaN(costVal) ? 0 : costVal);
      }, 0);
      if (calculatedSpent > 0) {
        totalSpent = calculatedSpent;
      }
    }

    // Get live user balance
    let liveBalance = 50.00;
    if (req.user && req.user.id) {
      const dbUser = await UserModel.findById(req.user.id).lean();
      if (dbUser && dbUser.balanceUsd !== undefined) liveBalance = dbUser.balanceUsd;
    }

    // Aggregate channel counts
    const channelStats = await OtpLogModel.aggregate([
      { $match: logQuery },
      { $group: { _id: '$channel', count: { $sum: 1 } } }
    ]);

    let channelBreakdown = {};
    if (logCount > 0 && channelStats.length > 0) {
      channelStats.forEach(cs => {
        const key = (cs._id || 'other').toLowerCase();
        channelBreakdown[key] = `${Math.round((cs.count / logCount) * 100)}%`;
      });
    } else {
      channelBreakdown = { whatsapp: '100%' };
    }

    const fmtDate = (d) => {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };

    res.json({
      success: true,
      metrics: {
        totalMonthlyOtps: monthlyLogCount,
        monthlyOtps: monthlyLogCount,
        totalOtps: logCount,
        fromDate: fmtDate(rangeStart),
        toDate: fmtDate(rangeEnd),
        totalTenants: userCount,
        balanceUsd: liveBalance,
        totalSpentUsd: totalSpent.toFixed(4),
        carrierSuccessRate: successRate,
        deliveryRate: successRate,
        avgLatency,
        channelBreakdown
      }
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

module.exports = router;
