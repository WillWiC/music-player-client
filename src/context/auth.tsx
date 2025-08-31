import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { User } from '../types/spotify';

interface AuthContextType {
  token: string | null;
  user: User | null;
  login: () => void;
  logout: () => void;
  clearAll: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export { AuthContext };

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // ref to hold refresh timer id so we can clear it on unmount / logout
  const refreshTimeoutRef = useRef<number | null>(null);

  // Fetch user data when token is available
  useEffect(() => {
    if (token) {
      console.log('Validating token and fetching user data...');
      fetch('https://api.spotify.com/v1/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(response => {
        if (!response.ok) {
          // Token is invalid, clear it
          console.log('Token is invalid, clearing auth data...');
          setToken(null);
          setUser(null);
          localStorage.removeItem('spotify_token');
          throw new Error('Invalid token');
        }
        return response.json();
      })
      .then(userData => {
        console.log('User data fetched successfully:', userData);
        setUser(userData);
        setIsLoading(false); // Set loading to false on success
      })
      .catch(error => {
        console.error('Error fetching user data:', error);
        // Clear invalid token
        setToken(null);
        setUser(null);
        localStorage.removeItem('spotify_token');
        setIsLoading(false); // Set loading to false on error
      });
    } else {
      console.log('No token, clearing user data...');
      setUser(null);
      setIsLoading(false); // Set loading to false when no token
    }
  }, [token]);

  // Clear refresh timer on unmount
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        window.clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    // Check for authorization code in URL (from Spotify OAuth redirect)
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const error = urlParams.get('error');
    const storedState = localStorage.getItem('spotify_auth_state');
    const codeVerifier = localStorage.getItem('spotify_code_verifier');

    console.log('Auth initialization:', { 
      hasCode: !!code, 
      hasState: !!state, 
      hasStoredState: !!storedState, 
      hasCodeVerifier: !!codeVerifier,
      error: error,
      stateMatch: state === storedState
    });

    if (error) {
      console.error('Spotify authorization error:', error);
      setIsLoading(false);
      return;
    }

    if (code && state && state === storedState && codeVerifier) {
      console.log('Found authorization code, exchanging for token...');
      // Exchange code for token
      exchangeCodeForToken(code, codeVerifier);
      
      // Clean up URL and localStorage
      window.history.replaceState({}, document.title, window.location.pathname);
      localStorage.removeItem('spotify_auth_state');
      localStorage.removeItem('spotify_code_verifier');
    } else if (code) {
      console.warn('Authorization code found but validation failed:', {
        hasState: !!state,
        stateMatch: state === storedState,
        hasCodeVerifier: !!codeVerifier
      });
      setIsLoading(false);
    } else {
      // Check for stored token
      const storedToken = localStorage.getItem('spotify_token');
      const storedRefresh = localStorage.getItem('spotify_refresh_token');
      const storedExpiry = localStorage.getItem('spotify_token_expiry');
      console.log('No authorization code, checking stored token:', { hasStoredToken: !!storedToken, hasStoredRefresh: !!storedRefresh, hasStoredExpiry: !!storedExpiry });
      if (storedToken) {
        // If we have an expiry, check if it's expired and attempt refresh if needed
        if (storedExpiry) {
          const expiryNum = parseInt(storedExpiry, 10);
          if (Date.now() > expiryNum) {
            // Token expired, try to refresh if we have a refresh token
            if (storedRefresh) {
              console.log('Stored token expired, attempting refresh...');
              refreshAccessToken(storedRefresh);
            } else {
              console.log('Stored token expired and no refresh token available, clearing token');
              setToken(null);
              setIsLoading(false);
            }
          } else {
            // Token still valid, use it and schedule refresh
            setToken(storedToken);
            scheduleTokenRefresh(Math.max(0, expiryNum - Date.now()));
            // token validation effect will fetch user and set loading false
          }
        } else {
          // no expiry information — just use stored token and schedule a refresh in ~1h
          setToken(storedToken);
          scheduleTokenRefresh(3600 * 1000);
        }
      } else {
        setIsLoading(false);
      }
    }
  }, []);

  // Helper function to generate random string
  const generateRandomString = (length: number) => {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const values = crypto.getRandomValues(new Uint8Array(length));
    return values.reduce((acc, x) => acc + possible[x % possible.length], '');
  };

  // Helper function to generate code challenge
  const generateCodeChallenge = async (codeVerifier: string) => {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(codeVerifier));
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  };

  // Exchange authorization code for access token
  const exchangeCodeForToken = async (code: string, codeVerifier: string) => {
    const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
    const REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI || window.location.origin;

    console.log('Exchanging code for token...', { CLIENT_ID: CLIENT_ID ? 'Set' : 'Missing', REDIRECT_URI });

    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
      code_verifier: codeVerifier,
    });

    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
      });

      console.log('Token exchange response status:', response.status);

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Token exchange failed:', errorData);
        throw new Error(`Failed to exchange code for token: ${response.status} ${errorData}`);
      }

      const data = await response.json();
      console.log('Token exchange successful:', { access_token: data.access_token ? 'Received' : 'Missing' });

      setToken(data.access_token);
      localStorage.setItem('spotify_token', data.access_token);

      // Store refresh token if provided
      if (data.refresh_token) {
        localStorage.setItem('spotify_refresh_token', data.refresh_token);
      }

      // Store expiry and schedule refresh
      const expiresIn = data.expires_in || 3600; // seconds
      const expiryTs = Date.now() + expiresIn * 1000;
      localStorage.setItem('spotify_token_expiry', String(expiryTs));
      // Schedule refresh a minute before expiry
      scheduleTokenRefresh(Math.max(0, expiresIn * 1000 - 60 * 1000));

      console.log('Token stored successfully');
    } catch (error) {
      console.error('Error exchanging code for token:', error);
      // Clear any stored auth data on error
      localStorage.removeItem('spotify_auth_state');
      localStorage.removeItem('spotify_code_verifier');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async () => {
    const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
    const REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI || window.location.origin;
    const SCOPES = [
      'user-read-private',
      'user-read-email',
      'user-read-playback-state',
      'user-modify-playback-state',
      'user-read-currently-playing',
      'user-read-recently-played',
      'user-top-read',
  // needed to read user's saved tracks and albums
  'user-library-read',
  // needed to read followed artists
  'user-follow-read',
      'playlist-read-private',
      'playlist-read-collaborative',
      'streaming'
    ].join(' ');

    // Generate PKCE parameters
    const codeVerifier = generateRandomString(64);
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    const state = generateRandomString(16);

    // Store state and code verifier for later verification
    localStorage.setItem('spotify_auth_state', state);
    localStorage.setItem('spotify_code_verifier', codeVerifier);

    const authUrl = `https://accounts.spotify.com/authorize?` +
      `client_id=${CLIENT_ID}&` +
      `response_type=code&` +
      `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
      `scope=${encodeURIComponent(SCOPES)}&` +
      `code_challenge_method=S256&` +
      `code_challenge=${codeChallenge}&` +
      `state=${state}`;

    window.location.href = authUrl;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('spotify_token');
    localStorage.removeItem('spotify_refresh_token');
    localStorage.removeItem('spotify_token_expiry');
    localStorage.removeItem('spotify_auth_state');
    localStorage.removeItem('spotify_code_verifier');
    if (refreshTimeoutRef.current) {
      window.clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }
  };

  const clearAll = () => {
    console.log('Clearing all auth data...');
    setToken(null);
    setUser(null);
    localStorage.removeItem('spotify_token');
    localStorage.removeItem('spotify_refresh_token');
    localStorage.removeItem('spotify_token_expiry');
    localStorage.removeItem('spotify_auth_state');
    localStorage.removeItem('spotify_code_verifier');
    if (refreshTimeoutRef.current) {
      window.clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }
    // Also clear any other possible stored data
    localStorage.clear();
  };

  // Schedule a token refresh in ms; will call server /refresh with stored refresh token
  const scheduleTokenRefresh = (ms: number) => {
    if (!ms || ms <= 0) return;
    if (refreshTimeoutRef.current) {
      window.clearTimeout(refreshTimeoutRef.current);
    }
    // Ensure we don't schedule extremely long timers; cap to 24h
    const toSchedule = Math.min(ms, 24 * 60 * 60 * 1000);
    refreshTimeoutRef.current = window.setTimeout(() => {
      const refreshToken = localStorage.getItem('spotify_refresh_token');
      if (refreshToken) {
        refreshAccessToken(refreshToken);
      }
    }, toSchedule) as unknown as number;
  };

  // Use server-side refresh endpoint to exchange refresh_token for new access_token
  const refreshAccessToken = async (refreshToken: string) => {
    try {
      const server = import.meta.env.VITE_AUTH_SERVER_URL || 'http://localhost:3001';
      const res = await fetch(`${server.replace(/\/$/, '')}/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      if (!res.ok) throw new Error('Refresh failed');
      const data = await res.json();
      if (data.access_token) {
        setToken(data.access_token);
        localStorage.setItem('spotify_token', data.access_token);
        if (data.expires_in) {
          const expiryTs = Date.now() + data.expires_in * 1000;
          localStorage.setItem('spotify_token_expiry', String(expiryTs));
          // schedule next refresh one minute before expiry
          scheduleTokenRefresh(Math.max(0, data.expires_in * 1000 - 60 * 1000));
        } else {
          // default to 1 hour
          scheduleTokenRefresh(3600 * 1000 - 60 * 1000);
        }
      }
    } catch (err) {
      console.error('Error refreshing access token:', err);
      // If refresh fails, clear token and require re-login
      setToken(null);
      setUser(null);
      localStorage.removeItem('spotify_token');
      localStorage.removeItem('spotify_token_expiry');
      // keep refresh token so user can try again, or clear depending on policy
    }
  };

  // Listen for manual token updates (e.g. settings page) so AuthProvider can pick them up
  useEffect(() => {
    const handler = () => {
      try {
        const storedToken = localStorage.getItem('spotify_token');
        const storedExpiry = localStorage.getItem('spotify_token_expiry');
        if (storedToken) {
          setToken(storedToken);
        }
        if (storedExpiry) {
          const expiryNum = parseInt(storedExpiry, 10);
          // schedule refresh one minute before expiry
          scheduleTokenRefresh(Math.max(0, expiryNum - Date.now() - 60 * 1000));
        }
      } catch (err) {
        // ignore
      }
    };
    window.addEventListener('spotify_token_updated', handler);
    return () => window.removeEventListener('spotify_token_updated', handler);
  }, []);

  const value = {
    token,
    user,
    login,
    logout,
    clearAll,
    isLoading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
