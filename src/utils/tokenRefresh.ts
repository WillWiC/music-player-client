/**
 * Utility functions for token refresh operations
 * These can be used anywhere in the app without needing React context
 */

/**
 * Simple function to refresh the access token
 * @returns Promise<boolean> - true if successful, false otherwise
 */
export const refreshAccessToken = async (): Promise<boolean> => {
  return await refreshSpotifyToken();
};

/**
 * Simple function to refresh the access token
 * @returns Promise<boolean> - true if successful, false otherwise
 */
export const refreshSpotifyToken = async (): Promise<boolean> => {
  try {
    const refreshToken = localStorage.getItem('spotify_refresh_token');
    
    if (!refreshToken) {
      console.warn('No refresh token found in localStorage');
      return false;
    }

    const server = import.meta.env.VITE_AUTH_SERVER_URL || 'http://localhost:3001';
    
    console.log('Refreshing Spotify access token...');
    
    const response = await fetch(`${server.replace(/\/$/, '')}/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ refresh_token: refreshToken })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('Token refresh failed:', response.status, errorData);
      
      // Clear invalid refresh token if it's expired/revoked
      if (response.status === 400) {
        localStorage.removeItem('spotify_refresh_token');
      }
      
      return false;
    }

    const data = await response.json();
    
    if (!data.access_token) {
      console.error('No access token in refresh response');
      return false;
    }

    // Update stored tokens
    localStorage.setItem('spotify_token', data.access_token);
    
    if (data.refresh_token) {
      localStorage.setItem('spotify_refresh_token', data.refresh_token);
      console.log('Updated refresh token');
    }
    
    if (data.expires_in) {
      const expiryTs = Date.now() + (data.expires_in * 1000);
      localStorage.setItem('spotify_token_expiry', String(expiryTs));
    }

    console.log('✅ Token refreshed successfully');
    return true;

  } catch (error) {
    console.error('Error refreshing token:', error);
    return false;
  }
};

/**
 * Advanced refresh function with detailed result
 */
export const refreshSpotifyTokenDetailed = async (): Promise<{
  success: boolean;
  error?: string;
  newToken?: string;
  expiresIn?: number;
}> => {
  try {
    const refreshToken = localStorage.getItem('spotify_refresh_token');
    
    if (!refreshToken) {
      return {
        success: false,
        error: 'No refresh token available. Please log in again.'
      };
    }

    const server = import.meta.env.VITE_AUTH_SERVER_URL || 'http://localhost:3001';
    
    console.log('Refreshing Spotify access token (detailed)...');
    
    const response = await fetch(`${server.replace(/\/$/, '')}/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ refresh_token: refreshToken })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      
      // Clear invalid refresh token if it's expired/revoked
      if (response.status === 400) {
        localStorage.removeItem('spotify_refresh_token');
        return {
          success: false,
          error: 'Refresh token expired. Please log in again.'
        };
      }
      
      return {
        success: false,
        error: `Token refresh failed: ${errorData.error || response.statusText}`
      };
    }

    const data = await response.json();
    
    if (!data.access_token) {
      return {
        success: false,
        error: 'Invalid response from server - no access token'
      };
    }

    // Update stored tokens
    localStorage.setItem('spotify_token', data.access_token);
    
    if (data.refresh_token) {
      localStorage.setItem('spotify_refresh_token', data.refresh_token);
    }
    
    if (data.expires_in) {
      const expiryTs = Date.now() + (data.expires_in * 1000);
      localStorage.setItem('spotify_token_expiry', String(expiryTs));
    }

    console.log('✅ Token refreshed successfully (detailed)');
    
    return {
      success: true,
      newToken: data.access_token,
      expiresIn: data.expires_in
    };

  } catch (error) {
    console.error('Error refreshing token (detailed):', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

/**
 * Check if the current access token is expired
 */
export const isAccessTokenExpired = (): boolean => {
  const expiry = localStorage.getItem('spotify_token_expiry');
  if (!expiry) return true;
  
  const expiryTime = parseInt(expiry, 10);
  const now = Date.now();
  
  // Consider token expired if it expires within the next 5 minutes
  return now >= (expiryTime - 5 * 60 * 1000);
};

/**
 * Get the current access token, refreshing if needed
 */
export const getValidAccessToken = async (): Promise<string | null> => {
  const currentToken = localStorage.getItem('spotify_token');
  
  if (!currentToken) {
    console.log('No access token found');
    return null;
  }
  
  if (!isAccessTokenExpired()) {
    return currentToken;
  }
  
  console.log('Access token expired, refreshing...');
  const refreshSuccess = await refreshSpotifyToken();
  
  if (refreshSuccess) {
    return localStorage.getItem('spotify_token');
  }
  
  return null;
};

/**
 * Utility to make authenticated Spotify API requests with automatic refresh
 */
export const makeSpotifyRequest = async (
  url: string, 
  options: RequestInit = {}
): Promise<Response | null> => {
  const token = await getValidAccessToken();
  
  if (!token) {
    console.error('No valid access token available');
    return null;
  }
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  
  // If we get 401, try refreshing once more
  if (response.status === 401) {
    console.log('Got 401, attempting token refresh...');
    const refreshSuccess = await refreshSpotifyToken();
    
    if (refreshSuccess) {
      const newToken = localStorage.getItem('spotify_token');
      if (newToken) {
        return fetch(url, {
          ...options,
          headers: {
            'Authorization': `Bearer ${newToken}`,
            'Content-Type': 'application/json',
            ...options.headers
          }
        });
      }
    }
  }
  
  return response;
};
