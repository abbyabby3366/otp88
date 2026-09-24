const mongoose = require('mongoose');
const { getIsDbConnected } = require('../config/db');
const { getGlobalRates, DEFAULT_CHANNEL_RATES } = require('../config/constants');
const { RateModel, UserModel, TransactionModel, EmailConfigModel } = require('../models');

const CHANNEL_META = {
  whatsapp: { label: 'WhatsApp', deliveryTimeMs: 620 },
  sms: { label: 'SMS', deliveryTimeMs: 450 },
  telegram: { label: 'Telegram', deliveryTimeMs: 640 },
  voice: { label: 'Voice', deliveryTimeMs: 2100 },
  rcs: { label: 'RCS', deliveryTimeMs: 800 },
  email: { label: 'Email', deliveryTimeMs: 480 }
};

/**
 * Resolves the per-OTP price (USD) for a channel and destination country.
 */
async function getOtpChannelCost(countryCode, channel) {
  const code = (countryCode || 'MY').toUpperCase();
  const ch = String(channel || 'whatsapp').toLowerCase();
  const meta = CHANNEL_META[ch] || CHANNEL_META.whatsapp;
  const isDbConnected = getIsDbConnected();

  let unitCostNum = DEFAULT_CHANNEL_RATES[ch] ?? DEFAULT_CHANNEL_RATES.whatsapp;

  if (ch === 'email') {
    if (isDbConnected) {
      try {
        const emailCfg = await EmailConfigModel.findOne({ key: 'email_resend_primary' }).lean();
        const parsed = parseFloat(emailCfg?.ratePerOtp);
        if (!isNaN(parsed)) unitCostNum = parsed;
      } catch (e) {
        console.warn('Email rate lookup failed, using default:', e.message);
      }
    }
  } else {
    let rateRecord = null;
    if (isDbConnected) {
      try {
        rateRecord = await RateModel.findOne({ code }).lean();
      } catch (e) {
        console.warn('Rate lookup failed, using in-memory rates:', e.message);
      }
    }
    if (!rateRecord) {
      const globalRates = getGlobalRates();
      rateRecord = globalRates.find(r => r.code === code) || globalRates[0] || null;
    }
    const value = rateRecord ? rateRecord[ch] : undefined;
    if (value !== null && value !== undefined && !isNaN(Number(value))) {
      unitCostNum = Number(value);
    }
  }

  return {
    channel: ch,
    finalChannel: meta.label,
    deliveryTimeMs: meta.deliveryTimeMs,
    unitCostNum,
    unitCost: `$${unitCostNum.toFixed(4)}`
  };
}

function nowParts() {
  const now = new Date();
  return {
    date: now.toISOString().split('T')[0],
    time: now.toTimeString().split(' ')[0]
  };
}

async function recordTransaction(user, fields) {
  const { date, time } = nowParts();
  try {
    return await TransactionModel.create({
      userId: user._id.toString(),
      userName: user.name || user.email,
      userEmail: user.email,
      date,
      time,
      ...fields
    });
  } catch (err) {
    console.error('Error recording transaction:', err.message);
    return null;
  }
}

/**
 * Atomically deducts `amount` from the user's balance and records a usage transaction.
 * The deduction only happens when the balance covers the amount, which closes the
 * check-then-write race. Never falls back to another account.
 *
 * Returns { success, transaction, balanceBefore, balanceAfter, user } or
 * { success: false, error, currentBalance, required, code }.
 */
async function deductUserBalanceAndRecordTx({
  userId,
  amount,
  type = 'USAGE_OTP',
  category = 'WhatsApp OTP',
  description,
  referenceId,
  channel,
  recipient,
  status = 'SENT'
}) {
  if (!getIsDbConnected()) {
    return { success: false, code: 'DB_UNAVAILABLE', error: 'Billing service unavailable. Please retry shortly.' };
  }
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return { success: false, code: 'NO_ACCOUNT', error: 'No billing account is linked to this request.' };
  }

  const numAmount = Number(amount) || 0;

  try {
    const updatedUser = await UserModel.findOneAndUpdate(
      { _id: userId, balanceUsd: { $gte: numAmount } },
      { $inc: { balanceUsd: -numAmount } },
      { new: true }
    );

    if (!updatedUser) {
      const user = await UserModel.findById(userId).lean();
      if (!user) {
        return { success: false, code: 'NO_ACCOUNT', error: 'Billing account not found.' };
      }
      const curBalance = user.balanceUsd ?? 0;
      return {
        success: false,
        code: 'INSUFFICIENT_BALANCE',
        error: `Insufficient account balance ($${curBalance.toFixed(4)}). Required for this OTP: $${numAmount.toFixed(4)}. Please top up your balance.`,
        currentBalance: curBalance,
        required: numAmount
      };
    }

    const balanceBefore = updatedUser.balanceUsd + numAmount;
    const txId = 'TX_' + (referenceId || Math.random().toString(36).substring(2, 11));
    const transaction = await recordTransaction(updatedUser, {
      txId,
      type,
      category,
      description: description || `${category} to ${recipient || 'recipient'}`,
      referenceId: referenceId || txId,
      channel: channel || category,
      recipient,
      amount: -numAmount,
      balanceBefore,
      balanceAfter: updatedUser.balanceUsd,
      status
    });

    return { success: true, transaction, balanceBefore, balanceAfter: updatedUser.balanceUsd, user: updatedUser };
  } catch (err) {
    console.error('Error in deductUserBalanceAndRecordTx:', err.message);
    return { success: false, code: 'BILLING_ERROR', error: 'Billing failed. Please retry.' };
  }
}

/**
 * Returns a previously deducted amount to the user (used when upstream delivery fails)
 * and records a REFUND transaction linked to the original reference.
 */
async function refundUserBalance({ userId, amount, referenceId, channel, recipient, reason }) {
  if (!getIsDbConnected() || !userId || !mongoose.Types.ObjectId.isValid(userId)) return null;
  const numAmount = Number(amount) || 0;
  if (numAmount <= 0) return null;
  try {
    const updatedUser = await UserModel.findByIdAndUpdate(userId, { $inc: { balanceUsd: numAmount } }, { new: true });
    if (!updatedUser) return null;
    const transaction = await recordTransaction(updatedUser, {
      txId: 'TX_REFUND_' + (referenceId || Math.random().toString(36).substring(2, 11)),
      type: 'REFUND',
      category: 'Delivery Refund',
      description: `Refund for failed ${channel || 'OTP'} to ${recipient || 'recipient'}${reason ? ` (${reason})` : ''}`,
      referenceId,
      channel: channel || 'REFUND',
      recipient,
      amount: numAmount,
      balanceBefore: updatedUser.balanceUsd - numAmount,
      balanceAfter: updatedUser.balanceUsd,
      status: 'REFUNDED'
    });
    return { transaction, balanceAfter: updatedUser.balanceUsd };
  } catch (err) {
    console.error('Error refunding balance:', err.message);
    return null;
  }
}

/**
 * Credits a user's balance (top-ups and admin credits) and records the transaction.
 */
async function creditUserBalanceAndRecordTx({
  userId,
  amount,
  type = 'TOPUP',
  method = 'Credit Card',
  referenceId,
  description
}) {
  if (!getIsDbConnected()) return null;
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) return null;
  const numAmount = Number(amount) || 0;
  if (numAmount <= 0) return null;
  try {
    const updatedUser = await UserModel.findByIdAndUpdate(userId, { $inc: { balanceUsd: numAmount } }, { new: true });
    if (!updatedUser) return null;
    const txId = 'TX_' + (referenceId || Math.random().toString(36).substring(2, 11));
    const transaction = await recordTransaction(updatedUser, {
      txId,
      type,
      category: 'Balance Top-up',
      description: description || `Account Balance Recharge via ${method}`,
      referenceId: referenceId || txId,
      channel: method,
      recipient: updatedUser.email,
      amount: numAmount,
      balanceBefore: updatedUser.balanceUsd - numAmount,
      balanceAfter: updatedUser.balanceUsd,
      status: 'PAID'
    });
    return { transaction, updatedUser };
  } catch (e) {
    console.error('Error crediting balance and recording tx:', e.message);
    return null;
  }
}

module.exports = {
  getOtpChannelCost,
  deductUserBalanceAndRecordTx,
  refundUserBalance,
  creditUserBalanceAndRecordTx
};
