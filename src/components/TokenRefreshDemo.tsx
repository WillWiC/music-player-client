import React, { useState } from 'react';
import { useAuth } from '../context/auth';
import { refreshSpotifyToken, refreshSpotifyTokenDetailed } from '../utils/tokenRefresh';
import { 
  Paper, 
  Typography, 
  Button, 
  Box, 
  Alert,
  Divider,
  Chip 
} from '@mui/material';
import { Refresh, Code, Functions } from '@mui/icons-material';

/**
 * Demo component for the Settings page showing all token refresh methods
 */
export const TokenRefreshDemo: React.FC = () => {
  const { refreshToken, refreshAccessTokenNow, isGuest } = useAuth();
  const [results, setResults] = useState<Array<{
    method: string;
    result: any;
    timestamp: string;
  }>>([]);

  const addResult = (method: string, result: any) => {
    const timestamp = new Date().toLocaleTimeString();
    setResults(prev => [{ method, result, timestamp }, ...prev.slice(0, 4)]);
  };

  const testContextSimple = async () => {
    console.log('Testing useAuth.refreshToken()...');
    const success = await refreshToken();
    addResult('Context Simple', { success });
  };

  const testContextAdvanced = async () => {
    console.log('Testing useAuth.refreshAccessTokenNow()...');
    const result = await refreshAccessTokenNow();
    addResult('Context Advanced', result);
  };

  const testUtilitySimple = async () => {
    console.log('Testing refreshSpotifyToken()...');
    const success = await refreshSpotifyToken();
    addResult('Utility Simple', { success });
  };

  const testUtilityAdvanced = async () => {
    console.log('Testing refreshSpotifyTokenDetailed()...');
    const result = await refreshSpotifyTokenDetailed();
    addResult('Utility Advanced', result);
  };

  if (isGuest) {
    return (
      <Paper sx={{ p: 3, bgcolor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', mt: 3 }}>
        <Alert severity="info" sx={{ bgcolor: 'rgba(33, 150, 243, 0.1)' }}>
          Token refresh demo is not available in guest mode. Please log in with Spotify to test these features.
        </Alert>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3, bgcolor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', mt: 3 }}>
      <Typography variant="h6" sx={{ color: 'white', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Code /> Token Refresh Demo
      </Typography>

      <Typography sx={{ color: 'rgba(255,255,255,0.7)', mb: 3, fontSize: '0.9rem' }}>
        Test all available token refresh methods. Each method uses the same underlying system but provides different interfaces.
      </Typography>

      {/* Test Buttons */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={testContextSimple}
          sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
        >
          Context Simple
        </Button>

        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={testContextAdvanced}
          sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
        >
          Context Advanced
        </Button>

        <Button
          variant="outlined"
          startIcon={<Functions />}
          onClick={testUtilitySimple}
          sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
        >
          Utility Simple
        </Button>

        <Button
          variant="outlined"
          startIcon={<Functions />}
          onClick={testUtilityAdvanced}
          sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
        >
          Utility Advanced
        </Button>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mb: 2 }} />

      {/* Results */}
      <Typography variant="subtitle2" sx={{ color: 'white', mb: 2 }}>
        Recent Test Results (newest first):
      </Typography>

      {results.length === 0 ? (
        <Alert severity="info" sx={{ bgcolor: 'rgba(33, 150, 243, 0.1)' }}>
          Click any button above to test token refresh methods. Results will appear here.
        </Alert>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {results.map((item, index) => (
            <Box 
              key={index}
              sx={{ 
                p: 2, 
                bgcolor: 'rgba(255,255,255,0.03)', 
                borderRadius: 1,
                border: '1px solid rgba(255,255,255,0.1)'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Chip 
                  label={item.method} 
                  size="small" 
                  variant="outlined"
                  sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
                />
                <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem' }}>
                  {item.timestamp}
                </Typography>
              </Box>
              
              <Typography 
                sx={{ 
                  color: 'white', 
                  fontFamily: 'monospace', 
                  fontSize: '0.8rem',
                  bgcolor: 'rgba(0,0,0,0.2)',
                  p: 1,
                  borderRadius: 1,
                  whiteSpace: 'pre-wrap'
                }}
              >
                {JSON.stringify(item.result, null, 2)}
              </Typography>
            </Box>
          ))}
        </Box>
      )}

      {/* Method Information */}
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 3 }} />
      
      <Typography variant="subtitle2" sx={{ color: 'white', mb: 2 }}>
        Method Descriptions:
      </Typography>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.8rem' }}>
          • <strong>Context Simple:</strong> <code>useAuth().refreshToken()</code> - Returns boolean
        </Typography>
        <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.8rem' }}>
          • <strong>Context Advanced:</strong> <code>useAuth().refreshAccessTokenNow()</code> - Returns detailed object
        </Typography>
        <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.8rem' }}>
          • <strong>Utility Simple:</strong> <code>refreshSpotifyToken()</code> - Standalone function, returns boolean
        </Typography>
        <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.8rem' }}>
          • <strong>Utility Advanced:</strong> <code>refreshSpotifyTokenDetailed()</code> - Standalone function, returns detailed object
        </Typography>
      </Box>
    </Paper>
  );
};

export default TokenRefreshDemo;
