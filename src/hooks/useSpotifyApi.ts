import { useCallback } from 'react';
import { useAuth } from '../context/auth';

interface SpotifyApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  maxRetries?: number;
}

interface SpotifyApiResponse<T = any> {
  data: T | null;
  error: string | null;
  isLoading: boolean;
}

/**
 * Custom hook for making Spotify API requests with automatic token refresh
 */
export const useSpotifyApi = () => {
  const { token, refreshToken, isGuest } = useAuth();

  const makeRequest = useCallback(async <T = any>(
    url: string, 
    options: SpotifyApiOptions = {}
  ): Promise<SpotifyApiResponse<T>> => {
    // Return early if in guest mode or no token
    if (isGuest || !token) {
      return {
        data: null,
        error: 'No authentication token available',
        isLoading: false
      };
    }

    const {
      method = 'GET',
      headers = {},
      body,
      maxRetries = 1
    } = options;

    let attempt = 0;
    
    const executeRequest = async (authToken: string): Promise<SpotifyApiResponse<T>> => {
      try {
        const requestHeaders = {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
          ...headers
        };

        const requestOptions: RequestInit = {
          method,
          headers: requestHeaders,
        };

        if (body && method !== 'GET') {
          requestOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
        }

        console.log(`Making Spotify API request to: ${url}`);
        const response = await fetch(url, requestOptions);

        // Handle 401 Unauthorized - token expired or invalid
        if (response.status === 401 && attempt < maxRetries) {
          console.log('Token expired (401), attempting refresh...');
          attempt++;
          
          const refreshSuccess = await refreshToken();
          if (refreshSuccess) {
            // Get the new token from localStorage since the context might not have updated yet
            const newToken = localStorage.getItem('spotify_token');
            if (newToken && newToken !== authToken) {
              console.log('Token refreshed successfully, retrying request...');
              return executeRequest(newToken);
            }
          }
          
          console.log('Token refresh failed or no new token received');
          return {
            data: null,
            error: 'Authentication failed - please log in again',
            isLoading: false
          };
        }

        // Handle rate limiting (429)
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          const retryDelay = retryAfter ? parseInt(retryAfter) * 1000 : 1000;
          
          console.log(`Rate limited (429), waiting ${retryDelay}ms before retry...`);
          
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            attempt++;
            return executeRequest(authToken);
          }
          
          return {
            data: null,
            error: 'Rate limit exceeded - please try again later',
            isLoading: false
          };
        }

        // Handle other HTTP errors
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Spotify API error: ${response.status} - ${errorText}`);
          
          return {
            data: null,
            error: `API request failed: ${response.status} ${response.statusText}`,
            isLoading: false
          };
        }

        // Parse successful response
        const contentType = response.headers.get('content-type');
        let data: T;
        
        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
        } else {
          data = (await response.text()) as unknown as T;
        }

        console.log(`Spotify API request successful: ${url}`);
        return {
          data,
          error: null,
          isLoading: false
        };

      } catch (error) {
        console.error('Network error during Spotify API request:', error);
        
        // Handle network errors with potential retry
        if (attempt < maxRetries && (error as Error).name !== 'AbortError') {
          console.log(`Network error, retrying... (attempt ${attempt + 1}/${maxRetries + 1})`);
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
          attempt++;
          return executeRequest(authToken);
        }

        return {
          data: null,
          error: `Network error: ${(error as Error).message}`,
          isLoading: false
        };
      }
    };

    return executeRequest(token);
  }, [token, refreshToken, isGuest]);

  return { makeRequest };
};

/**
 * Utility function to check if a Spotify URL is valid
 */
export const isValidSpotifyUrl = (url: string): boolean => {
  return url.startsWith('https://api.spotify.com/v1/');
};

/**
 * Utility function to build Spotify API URLs with query parameters
 */
export const buildSpotifyUrl = (endpoint: string, params?: Record<string, string | number>): string => {
  const baseUrl = `https://api.spotify.com/v1/${endpoint.replace(/^\//, '')}`;
  
  if (!params || Object.keys(params).length === 0) {
    return baseUrl;
  }
  
  const queryString = Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
  
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
};

export default useSpotifyApi;
