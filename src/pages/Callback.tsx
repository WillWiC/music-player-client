import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/auth';

const Callback: React.FC = () => {
  const navigate = useNavigate();
  const { setToken } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      console.log('Callback page loaded, current URL:', window.location.href);
      
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const error = urlParams.get('error');

      console.log('URL params:', { code, error });

      if (error) {
        console.error('OAuth error:', error);
        navigate('/');
        return;
      }

      if (code) {
        try {
          console.log('Found authorization code, starting token exchange...');
          
          // Exchange authorization code for access token using PKCE
          const codeVerifier = localStorage.getItem('code_verifier');
          console.log('Code verifier from localStorage:', codeVerifier ? 'Found' : 'Missing');
          
          if (!codeVerifier) {
            throw new Error('No code verifier found');
          }

          const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
          const REDIRECT_URI = import.meta.env.VITE_REDIRECT_URI ?? 'http://127.0.0.1:5173/callback';

          console.log('Token exchange params:', { CLIENT_ID, REDIRECT_URI, code });

          const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              client_id: CLIENT_ID,
              grant_type: 'authorization_code',
              code: code,
              redirect_uri: REDIRECT_URI,
              code_verifier: codeVerifier,
            }),
          });

          console.log('Token response status:', response.status);

          if (!response.ok) {
            const errorText = await response.text();
            console.error('Token response error:', errorText);
            throw new Error(`Token exchange failed: ${response.status} - ${errorText}`);
          }

          const data = await response.json();
          console.log('Token exchange successful:', { 
            hasAccessToken: !!data.access_token, 
            hasRefreshToken: !!data.refresh_token,
            expiresIn: data.expires_in 
          });
          
          // Clean up code verifier
          localStorage.removeItem('code_verifier');
          
          // Set token in auth context
          (setToken as any)(data.access_token, data.expires_in, data.refresh_token);
          console.log('Token set in auth context, navigating to dashboard...');
          navigate('/dashboard');
        } catch (error) {
          console.error('Token exchange error:', error);
          navigate('/');
        }
      } else {
        console.log('No authorization code found, checking for implicit flow token...');
        
        // Fallback: check for implicit flow token in hash (legacy)
        const hash = window.location.hash;
        if (hash) {
          const params = new URLSearchParams(hash.replace('#', '?'));
          const token = params.get('access_token');
          const expires = params.get('expires_in');
          const refresh = params.get('refresh_token');
          
          console.log('Hash params:', { hasToken: !!token, expires, hasRefresh: !!refresh });
          
          if (token) {
            const expiresIn = expires ? parseInt(expires, 10) : undefined;
            (setToken as any)(token, expiresIn, refresh ?? null);
            console.log('Implicit flow token set, navigating to dashboard...');
            navigate('/dashboard');
            return;
          }
        }
        
        console.log('No token found, redirecting to login...');
        navigate('/');
      }
    };

    handleCallback();
  }, [navigate, setToken]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dark-bg via-gray-900 to-black">
      <div className="music-card text-center">
        <div className="w-16 h-16 border-4 border-spotify-green border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
        <h2 className="text-xl font-semibold text-white mb-2">Connecting to Spotify</h2>
        <p className="text-muted-dark">Please wait while we set up your account...</p>
      </div>
    </div>
  );
};

export default Callback;
