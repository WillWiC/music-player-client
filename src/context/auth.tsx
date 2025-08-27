import React, { createContext, useState, useEffect, useContext } from 'react';

type AuthContextType = {
  token: string | null;
  setToken: (t: string | null, expiresInSec?: number) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setTokenState] = useState<string | null>(() => {
    const t = localStorage.getItem('spotify_token');
    const exp = localStorage.getItem('spotify_token_expiry');
    if (t && exp) {
      const expiry = parseInt(exp, 10);
      if (Date.now() > expiry) {
        localStorage.removeItem('spotify_token');
        localStorage.removeItem('spotify_token_expiry');
        return null;
      }
      return t;
    }
    return t;
  });
  const [refreshToken, setRefreshToken] = useState<string | null>(() => localStorage.getItem('spotify_refresh_token'));
  const refreshTimeoutRef = React.useRef<number | null>(null);

  useEffect(() => {
    if (token) localStorage.setItem('spotify_token', token);
    else {
      localStorage.removeItem('spotify_token');
      localStorage.removeItem('spotify_token_expiry');
    }
  }, [token]);

  useEffect(() => {
    if (refreshToken) localStorage.setItem('spotify_refresh_token', refreshToken);
    else localStorage.removeItem('spotify_refresh_token');
  }, [refreshToken]);

  const scheduleRefresh = (expiresInSec?: number) => {
    // schedule a refresh 60s before expiry
    if (!expiresInSec) return;
    const ms = Math.max(0, expiresInSec * 1000 - 60000);
    if (refreshTimeoutRef.current) window.clearTimeout(refreshTimeoutRef.current);
    refreshTimeoutRef.current = window.setTimeout(() => {
      // call server to refresh
      const AUTH_SERVER = import.meta.env.VITE_AUTH_SERVER || 'http://localhost:3001';
      if (!refreshToken) return;
      fetch(`${AUTH_SERVER.replace(/\/$/, '')}/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      })
        .then(r => r.json())
        .then(data => {
          if (data.access_token) {
            setTokenState(data.access_token);
            if (data.expires_in) {
              const expiry = Date.now() + data.expires_in * 1000;
              localStorage.setItem('spotify_token_expiry', String(expiry));
              scheduleRefresh(data.expires_in);
            }
          }
        })
        .catch(() => {});
    }, ms);
  };

  const setToken = (t: string | null, expiresInSec?: number, refreshTokenArg?: string | null) => {
    setTokenState(t);
    if (t && expiresInSec) {
      const expiry = Date.now() + expiresInSec * 1000;
      localStorage.setItem('spotify_token_expiry', String(expiry));
      scheduleRefresh(expiresInSec);
    }
    if (refreshTokenArg) setRefreshToken(refreshTokenArg);
  };
  const logout = () => setTokenState(null);

  return (
    <AuthContext.Provider value={{ token, setToken, logout }}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
