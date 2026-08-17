const { getIsDbConnected } = require('../config/db');
const { getGlobalRates } = require('../config/constants');
const { RateModel, UserModel, TransactionModel } = require('../models');

async function getOtpChannelCost(countryCode, channel) {
  const code = (countryCode || 'MY').toUpperCase();
  let rateRecord = null;
  const isDbConnected = getIsDbConnected();
  const globalRates = getGlobalRates();

  if (isDbConnected) {
    try {
      rateRecord = await RateModel.findOne({ code }).lean();
    } catch (e) {}
  }
  if (!rateRecord) {
    rateRecord = globalRates.find(r => r.code === code) || globalRates[0] || { whatsapp: 0.0075, telegram: 0.0035, sms: 0.0210 };
  }

  let finalChannel = 'WhatsApp VerifyWay';
  let deliveryTimeMs = 620;
  let unitCostNum = 0.0075;

  if (channel === 'sms') {
    finalChannel = 'SMS 360';
    deliveryTimeMs = 450;
    unitCostNum = (rateRecord.sms !== null && rateRecord.sms !== undefined) ? Number(rateRecord.sms) : 0.0210;
  } else if (channel === 'telegram') {
    finalChannel = 'Telegram Bot';
    deliveryTimeMs = 640;
    unitCostNum = (rateRecord.telegram !== null && rateRecord.telegram !== undefined) ? Number(rateRecord.telegram) : 0.0035;
  } else if (channel === 'voice') {
    finalChannel = 'Voice Flash Call';
    deliveryTimeMs = 2100;
    unitCostNum = 0.0240;
  } else if (channel === 'rcs') {
    finalChannel = 'RCS Messaging';
    deliveryTimeMs = 800;
    unitCostNum = 0.0090;
  } else if (channel === 'email') {
    finalChannel = 'Email OTP';
    deliveryTimeMs = 400;
    unitCostNum = 0.0010;
  } else {
    finalChannel = 'WhatsApp VerifyWay';
    deliveryTimeMs = 620;
    unitCostNum = (rateRecord.whatsapp !== null && rateRecord.whatsapp !== undefined) ? Number(rateRecord.whatsapp) : 0.0075;
  }

  return {
    finalChannel,
    deliveryTimeMs,
    unitCostNum,
    unitCost: `$${unitCostNum.toFixed(4)}`,
    rateRecord
  };
}

async function deductUserBalanceAndRecordTx({
  userId,
  amount,
  type = 'USAGE_OTP',
  category = 'WhatsApp OTP',
  description,
  referenceId,
  channel,
  recipient,
  status = 'DELIVERED'
}) {
  const isDbConnected = getIsDbConnected();
  if (!isDbConnected) {
    return { success: true, balanceAfter: 50.00 };
  }
  try {
    let user = null;
    if (userId && typeof userId === 'string' && userId.match(/^[0-9a-fA-F]{24}$/)) {
      user = await UserModel.findById(userId);
    }
    if (!user) {
      user = await UserModel.findOne({ role: 'USER' }) || await UserModel.findOne();
    }
    if (!user) {
      return { success: true, balanceAfter: 50.00 };
    }

    const curBalance = user.balanceUsd !== undefined ? user.balanceUsd : 50.00;
    if (amount > 0 && curBalance < amount) {
      return {
        success: false,
        error: `Insufficient account balance ($${curBalance.toFixed(4)}). Required for this OTP: $${amount.toFixed(4)}. Please top up your balance.`,
        currentBalance: curBalance,
        required: amount
      };
    }

    const updatedUser = await UserModel.findByIdAndUpdate(
      user._id,
      { $inc: { balanceUsd: -amount } },
      { new: true }
    );

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0];
    const txId = 'TX_' + (referenceId || Math.random().toString(36).substring(2, 11));

    let createdTx = null;
    try {
      createdTx = await TransactionModel.create({
        txId,
        userId: user._id.toString(),
        userName: user.name || user.email,
        userEmail: user.email,
        type,
        category,
        description: description || `${category} to ${recipient || 'recipient'}`,
        referenceId: referenceId || txId,
        channel: channel || category,
        recipient,
        amount: -amount,
        balanceBefore: curBalance,
        balanceAfter: updatedUser.balanceUsd,
        status,
        date: dateStr,
        time: timeStr
      });
    } catch (txErr) {
      console.error('Error logging transaction:', txErr.message);
    }

    return {
      success: true,
      transaction: createdTx,
      balanceBefore: curBalance,
      balanceAfter: updatedUser.balanceUsd,
      user: updatedUser
    };
  } catch (err) {
    console.error('Error in deductUserBalanceAndRecordTx:', err.message);
    return { success: true, balanceAfter: 50.00, error: err.message };
  }
}

async function creditUserBalanceAndRecordTx({
  userId,
  amount,
  type = 'TOPUP',
  method = 'Credit Card',
  referenceId,
  description
}) {
  const isDbConnected = getIsDbConnected();
  if (!isDbConnected) return null;
  try {
    let user = null;
    if (userId && typeof userId === 'string' && userId.match(/^[0-9a-fA-F]{24}$/)) {
      user = await UserModel.findById(userId);
    } else {
      user = await UserModel.findOne({ role: 'USER' }) || await UserModel.findOne();
    }
    if (!user) return null;

    const curBalance = user.balanceUsd !== undefined ? user.balanceUsd : 50.00;
    const updatedUser = await UserModel.findByIdAndUpdate(
      user._id,
      { $inc: { balanceUsd: amount } },
      { new: true }
    );

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0];
    const txId = 'TX_' + (referenceId || Math.random().toString(36).substring(2, 11));

    const tx = await TransactionModel.create({
      txId,
      userId: user._id.toString(),
      userName: user.name || user.email,
      userEmail: user.email,
      type,
      category: 'Balance Top-up',
      description: description || `Account Balance Recharge via ${method}`,
      referenceId: referenceId || txId,
      channel: method,
      recipient: user.email,
      amount: amount,
      balanceBefore: curBalance,
      balanceAfter: updatedUser.balanceUsd,
      status: 'PAID',
      date: dateStr,
      time: timeStr
    });

    return { transaction: tx, updatedUser };
  } catch (e) {
    console.error('Error crediting balance and recording tx:', e.message);
    return null;
  }
}

module.exports = {
  getOtpChannelCost,
  deductUserBalanceAndRecordTx,
  creditUserBalanceAndRecordTx
};
