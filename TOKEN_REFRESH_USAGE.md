# Token Refresh Functions

This document explains how to use the token refresh functionality in the music player app.

## Available Methods

### 1. Using React Context (Recommended for Components)

```tsx
import { useAuth } from '../context/auth';

const MyComponent = () => {
  const { refreshToken, refreshAccessTokenNow } = useAuth();
  
  // Simple refresh (returns boolean)
  const handleRefresh = async () => {
    const success = await refreshToken();
    if (success) {
      console.log('Token refreshed!');
    }
  };
  
  // Advanced refresh (returns detailed info)
  const handleAdvancedRefresh = async () => {
    const result = await refreshAccessTokenNow();
    if (result.success) {
      console.log('New token:', result.newToken);
    } else {
      console.error('Error:', result.error);
    }
  };
};
```

### 2. Using Utility Functions (For Any JavaScript/TypeScript)

```tsx
import { 
  refreshSpotifyToken, 
  refreshSpotifyTokenDetailed,
  getValidAccessToken,
  makeSpotifyRequest 
} from '../utils/tokenRefresh';

// Simple refresh
const success = await refreshSpotifyToken();

// Detailed refresh
const result = await refreshSpotifyTokenDetailed();
if (result.success) {
  console.log('Token expires in:', result.expiresIn, 'seconds');
}

// Get valid token (auto-refreshes if needed)
const token = await getValidAccessToken();

// Make authenticated request (auto-refreshes if needed)
const response = await makeSpotifyRequest('https://api.spotify.com/v1/me');
```

### 3. Using the Custom Hook

```tsx
import { useTokenRefresh } from '../components/RefreshTokenExample';

const MyComponent = () => {
  const { refreshToken, refreshWithErrorHandling } = useTokenRefresh();
  
  const handleRefresh = async () => {
    const success = await refreshWithErrorHandling();
    // Includes built-in error handling
  };
};
```

## Function Reference

### Context Functions

| Function | Returns | Description |
|----------|---------|-------------|
| `refreshToken()` | `Promise<boolean>` | Simple refresh, returns success status |
| `refreshAccessTokenNow()` | `Promise<{success, error?, newToken?}>` | Detailed refresh with error info |

### Utility Functions

| Function | Returns | Description |
|----------|---------|-------------|
| `refreshSpotifyToken()` | `Promise<boolean>` | Standalone refresh function |
| `refreshSpotifyTokenDetailed()` | `Promise<{success, error?, newToken?, expiresIn?}>` | Detailed standalone refresh |
| `isAccessTokenExpired()` | `boolean` | Check if current token is expired |
| `getValidAccessToken()` | `Promise<string \| null>` | Get valid token, refresh if needed |
| `makeSpotifyRequest(url, options)` | `Promise<Response \| null>` | Make authenticated request with auto-refresh |

## Features

✅ **Race condition protection** - Multiple simultaneous refresh attempts are handled safely  
✅ **Automatic retry logic** - Handles network errors and server issues  
✅ **Token expiry checking** - Proactive refresh before token expires  
✅ **Error handling** - Detailed error messages and recovery  
✅ **Storage management** - Automatically updates localStorage  
✅ **Logging** - Comprehensive console logging for debugging  

## Examples

### Manual Refresh Button

```tsx
const RefreshButton = () => {
  const { refreshAccessTokenNow } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    const result = await refreshAccessTokenNow();
    
    if (result.success) {
      alert('Token refreshed successfully!');
    } else {
      alert(`Refresh failed: ${result.error}`);
    }
    
    setIsRefreshing(false);
  };
  
  return (
    <button onClick={handleRefresh} disabled={isRefreshing}>
      {isRefreshing ? 'Refreshing...' : 'Refresh Token'}
    </button>
  );
};
```

### API Service with Auto-Refresh

```tsx
class SpotifyService {
  static async getUser() {
    const response = await makeSpotifyRequest('https://api.spotify.com/v1/me');
    return response ? await response.json() : null;
  }
  
  static async getPlaylists() {
    const response = await makeSpotifyRequest('https://api.spotify.com/v1/me/playlists');
    return response ? await response.json() : null;
  }
}
```

### Error Handling

```tsx
const handleApiCall = async () => {
  try {
    const result = await refreshAccessTokenNow();
    
    if (!result.success) {
      if (result.error?.includes('log in again')) {
        // Redirect to login
        window.location.href = '/login';
      } else {
        // Show error message
        console.error('Refresh failed:', result.error);
      }
      return;
    }
    
    // Continue with API call
    console.log('Token refreshed, making API call...');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
};
```

## Notes

- The refresh token mutex prevents concurrent refresh attempts
- New refresh tokens from Spotify automatically replace old ones
- Expired/invalid refresh tokens are automatically cleared from storage
- All functions work in both authenticated and guest modes (guest mode returns appropriate errors)
- The server must be running on port 3001 (configurable via `VITE_AUTH_SERVER_URL`)
