import { useState, useCallback, useEffect } from 'react';
import { apiJson } from '../api.js';

/**
 * Shared data for the console: carrier rates, the OTP log list, and (for admins)
 * the user directory plus its create / update / delete actions.
 */
export default function useConsoleData({ jwtToken, session, setSession, showToast, lang }) {
  const isAdmin = session?.role === 'ADMIN';
  const zh = lang === 'zh';

  const [ratesList, setRatesList] = useState([]);
  const [emailRate, setEmailRate] = useState(null);
  const [loadingRates, setLoadingRates] = useState(false);
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [usersList, setUsersList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [savingRates, setSavingRates] = useState(false);

  const fetchRates = useCallback(async () => {
    setLoadingRates(true);
    try {
      const { data } = await apiJson('/api/rates');
      if (data.success && Array.isArray(data.data)) {
        setRatesList(data.data);
        if (typeof data.emailRate === 'number') setEmailRate(data.emailRate);
      }
    } catch (e) {
      // keep the previous list
    } finally {
      setLoadingRates(false);
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    if (!jwtToken) return;
    setLoadingLogs(true);
    try {
      const { data } = await apiJson('/api/otp-logs');
      if (data.success && Array.isArray(data.logs)) setLogs(data.logs);
    } catch (e) {
      // keep the previous list
    } finally {
      setLoadingLogs(false);
    }
  }, [jwtToken]);

  const fetchUsers = useCallback(async () => {
    if (!jwtToken || !isAdmin) return;
    setLoadingUsers(true);
    try {
      const { data } = await apiJson('/api/admin/users');
      if (data.success && Array.isArray(data.users)) setUsersList(data.users);
    } catch (e) {
      // keep the previous list
    } finally {
      setLoadingUsers(false);
    }
  }, [jwtToken, isAdmin]);

  useEffect(() => { fetchRates(); }, [fetchRates]);

  useEffect(() => {
    if (jwtToken) {
      fetchLogs();
      fetchUsers();
    } else {
      setLogs([]);
      setUsersList([]);
    }
  }, [jwtToken, isAdmin, fetchLogs, fetchUsers]);

  // --- Admin: user directory actions ---
  const createUser = useCallback(async (payload) => {
    if (!payload?.email?.trim()) return false;
    try {
      const { data } = await apiJson('/api/admin/users', { method: 'POST', body: JSON.stringify(payload) });
      if (data.success) {
        showToast(zh ? `已创建用户: ${data.user.name}` : `User created: ${data.user.name}`);
        fetchUsers();
        return true;
      }
      showToast(data.error || 'Failed to create user', 'error');
    } catch (e) {
      showToast('Error creating user', 'error');
    }
    return false;
  }, [fetchUsers, showToast, zh]);

  const updateUser = useCallback(async (userId, updateData) => {
    try {
      const { data } = await apiJson(`/api/admin/users/${userId}`, { method: 'PUT', body: JSON.stringify(updateData) });
      if (data.success) {
        showToast(zh ? '用户资料已更新' : 'User updated');
        fetchUsers();
        if (session && data.user && session.id === userId) {
          setSession(prev => ({ ...prev, ...data.user, id: prev.id }));
        }
        return true;
      }
      showToast(data.error || 'Failed to update user', 'error');
    } catch (e) {
      showToast('Error updating user', 'error');
    }
    return false;
  }, [fetchUsers, session, setSession, showToast, zh]);

  const deleteUser = useCallback(async (userId) => {
    try {
      const { data } = await apiJson(`/api/admin/users/${userId}`, { method: 'DELETE' });
      if (data.success) {
        showToast(zh ? '用户已成功删除' : 'User deleted');
        fetchUsers();
        return true;
      }
      showToast(data.error || 'Failed to delete user', 'error');
    } catch (e) {
      showToast('Error deleting user', 'error');
    }
    return false;
  }, [fetchUsers, showToast, zh]);

  // --- Admin: carrier rates ---
  const saveRates = useCallback(async (payload) => {
    if (!jwtToken) return false;
    setSavingRates(true);
    try {
      const { data } = await apiJson('/api/admin/rates', { method: 'POST', body: JSON.stringify(payload) });
      if (data.success) {
        showToast(zh ? '费率已更新' : 'Carrier rates saved');
        if (Array.isArray(data.rates)) setRatesList(data.rates);
        fetchRates();
        return true;
      }
      showToast(data.error || 'Failed to update rates', 'error');
    } catch (e) {
      showToast('Error updating rates', 'error');
    } finally {
      setSavingRates(false);
    }
    return false;
  }, [jwtToken, fetchRates, showToast, zh]);

  return {
    ratesList, emailRate, loadingRates, fetchRates,
    logs, loadingLogs, fetchLogs,
    usersList, loadingUsers, fetchUsers,
    createUser, updateUser, deleteUser,
    saveRates, savingRates
  };
}
