import { useState, useCallback, useEffect } from 'react';
import { apiJson } from '../api.js';
import { firstOfMonthIso, todayIso } from '../utils/format.js';

/**
 * Dashboard metrics for the selected date range. Keeps the session balance in sync
 * with the server-side balance returned alongside the metrics.
 */
export default function useMetrics({ jwtToken, setSession }) {
  const [metrics, setMetrics] = useState(null);
  const [fromDate, setFromDate] = useState(firstOfMonthIso);
  const [toDate, setToDate] = useState(todayIso);
  const [loading, setLoading] = useState(false);

  const fetchMetrics = useCallback(async (fromD = fromDate, toD = toDate) => {
    if (!jwtToken) return;
    setLoading(true);
    try {
      const url = `/api/metrics?fromDate=${encodeURIComponent(fromD || '')}&toDate=${encodeURIComponent(toD || '')}`;
      const { ok, data } = await apiJson(url);
      if (ok && data.success && data.metrics) {
        setMetrics(data.metrics);
        if (data.metrics.balanceUsd !== null && data.metrics.balanceUsd !== undefined && setSession) {
          setSession(prev => {
            if (!prev || prev.balanceUsd === data.metrics.balanceUsd) return prev;
            return { ...prev, balanceUsd: data.metrics.balanceUsd };
          });
        }
      }
    } catch (e) {
      // Metrics are best-effort; the dashboard shows an empty state
    } finally {
      setLoading(false);
    }
  }, [jwtToken, fromDate, toDate, setSession]);

  const changeDateRange = useCallback((fromD, toD) => {
    setFromDate(fromD);
    setToDate(toD);
    fetchMetrics(fromD, toD);
  }, [fetchMetrics]);

  useEffect(() => {
    if (jwtToken) fetchMetrics();
    else setMetrics(null);
  }, [jwtToken]); // eslint-disable-line react-hooks/exhaustive-deps

  return { metrics, fromDate, toDate, loading, fetchMetrics, changeDateRange };
}
