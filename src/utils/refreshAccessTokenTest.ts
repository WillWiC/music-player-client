// Simple test file to demonstrate the new refreshAccessToken function
import { refreshAccessToken } from '../utils/tokenRefresh';

// Utility function usage
export const testUtilityRefreshAccessToken = async () => {
  console.log('Testing utility refreshAccessToken()...');
  
  const success = await refreshAccessToken();
  
  if (success) {
    console.log('✅ Access token refreshed successfully!');
    return true;
  } else {
    console.log('❌ Access token refresh failed');
    return false;
  }
};

// Usage examples
export const examples = {
  // Simple utility call
  utility: async () => {
    const success = await refreshAccessToken();
    return success;
  },
  
  // Context usage example (code string)
  contextUsage: `
    import { useAuth } from '../context/auth';
    
    const MyComponent = () => {
      const { refreshAccessToken } = useAuth();
      
      const handleRefresh = async () => {
        const success = await refreshAccessToken();
        console.log('Refresh result:', success);
      };
      
      return <button onClick={handleRefresh}>Refresh Access Token</button>;
    };
  `
};
