import React from 'react';
import { useAuth } from '../context/auth';

/**
 * Example component showing how to use the token refresh functions
 */
export const RefreshTokenExample: React.FC = () => {
  const { refreshToken, refreshAccessTokenNow, token } = useAuth();

  // Simple refresh (returns boolean)
  const handleSimpleRefresh = async () => {
    console.log('Starting simple refresh...');
    const success = await refreshToken();
    
    if (success) {
      console.log('✅ Token refreshed successfully!');
      alert('Token refreshed successfully!');
    } else {
      console.log('❌ Token refresh failed');
      alert('Token refresh failed. Please log in again.');
    }
  };

  // Advanced refresh (returns detailed info)
  const handleAdvancedRefresh = async () => {
    console.log('Starting advanced refresh...');
    const result = await refreshAccessTokenNow();
    
    if (result.success) {
      console.log('✅ Token refreshed successfully!');
      console.log('New token:', result.newToken?.substring(0, 20) + '...');
      alert(`Token refreshed! New token: ${result.newToken?.substring(0, 20)}...`);
    } else {
      console.log('❌ Token refresh failed:', result.error);
      alert(`Token refresh failed: ${result.error}`);
    }
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '20px', borderRadius: '8px' }}>
      <h3>Token Refresh Functions</h3>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>Current Token:</strong> {token ? `${token.substring(0, 20)}...` : 'None'}
      </div>
      
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button 
          onClick={handleSimpleRefresh}
          style={{
            padding: '10px 15px',
            backgroundColor: '#1db954',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Simple Refresh (Boolean)
        </button>
        
        <button 
          onClick={handleAdvancedRefresh}
          style={{
            padding: '10px 15px',
            backgroundColor: '#1e3a8a',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Advanced Refresh (Detailed)
        </button>
      </div>
      
      <div style={{ marginTop: '15px', fontSize: '14px', color: '#666' }}>
        <p><strong>Simple Refresh:</strong> Returns <code>true/false</code></p>
        <p><strong>Advanced Refresh:</strong> Returns <code>{`{success, error?, newToken?}`}</code></p>
      </div>
    </div>
  );
};

// Hook for easy access to refresh functions
export const useTokenRefresh = () => {
  const { refreshToken, refreshAccessTokenNow } = useAuth();
  
  return {
    // Simple refresh - returns boolean
    refreshToken,
    
    // Advanced refresh - returns detailed result
    refreshAccessTokenNow,
    
    // Convenience function with try-catch
    refreshWithErrorHandling: async (): Promise<boolean> => {
      try {
        const result = await refreshAccessTokenNow();
        if (!result.success) {
          console.error('Token refresh failed:', result.error);
        }
        return result.success;
      } catch (error) {
        console.error('Token refresh error:', error);
        return false;
      }
    }
  };
};

export default RefreshTokenExample;
