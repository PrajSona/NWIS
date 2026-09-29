import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { getWells, getHealth } from '../services/api';
import { getSocket } from '../services/socket';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [wells, setWells] = useState([]);
  const [activeWell, setActiveWell] = useState(null);
  const [health, setHealth] = useState(null);
  const [telemetry, setTelemetry] = useState(null);
  const [telemetryHistory, setTelemetryHistory] = useState([]);
  const [telemetryStatus, setTelemetryStatus] = useState({ running: false, state: 'NORMAL' });
  const [riskAlerts, setRiskAlerts] = useState([]);
  const [socketConnected, setSocketConnected] = useState(false);
  const maxHistoryRef = useRef(150);

  // Fetch wells on mount
  const fetchWells = useCallback(async () => {
    try {
      const res = await getWells();
      const allWells = res.data.wells || [];
      setWells(allWells);
      // Auto-select active well
      const active = allWells.find(w => w.status === 'active');
      if (active && !activeWell) {
        setActiveWell(active);
      }
    } catch (err) {
      console.error('Failed to fetch wells:', err.message);
    }
  }, []);

  // Fetch health
  const fetchHealth = useCallback(async () => {
    try {
      const res = await getHealth();
      setHealth(res.data);
    } catch (err) {
      setHealth({ status: 'unreachable', services: { backend: { connected: false } } });
    }
  }, []);

  useEffect(() => {
    fetchWells();
    fetchHealth();
    const healthInterval = setInterval(fetchHealth, 30000);
    return () => clearInterval(healthInterval);
  }, [fetchWells, fetchHealth]);

  // Socket.IO
  useEffect(() => {
    const socket = getSocket();

    socket.on('connect', () => setSocketConnected(true));
    socket.on('disconnect', () => setSocketConnected(false));

    socket.on('telemetry:update', (data) => {
      setTelemetry(data);
      setTelemetryHistory(prev => {
        const next = [...prev, data];
        if (next.length > maxHistoryRef.current) {
          return next.slice(next.length - maxHistoryRef.current);
        }
        return next;
      });
    });

    socket.on('telemetry:status', (data) => {
      setTelemetryStatus(data);
    });

    socket.on('risk:alert', (data) => {
      setRiskAlerts(prev => [data, ...prev].slice(0, 50));
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('telemetry:update');
      socket.off('telemetry:status');
      socket.off('risk:alert');
    };
  }, []);

  const value = {
    wells,
    activeWell,
    setActiveWell,
    health,
    telemetry,
    telemetryHistory,
    setTelemetryHistory,
    telemetryStatus,
    riskAlerts,
    setRiskAlerts,
    socketConnected,
    fetchWells,
    fetchHealth,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
