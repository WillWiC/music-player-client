import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/auth';

// PKCE helper functions
const generateRandomString = (length: number) => {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return values.reduce((acc, x) => acc + possible[x % possible.length], "");
};

const sha256 = async (plain: string) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return window.crypto.subtle.digest('SHA-256', data);
};

const base64encode = (input: ArrayBuffer) => {
  return btoa(String.fromCharCode(...new Uint8Array(input)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
};

const Login: React.FC = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = React.useState(false);
  const AUTH_SERVER = import.meta.env.VITE_AUTH_SERVER;
  
  // Debug: Log environment variables
  console.log('Environment variables:', {
    AUTH_SERVER,
    CLIENT_ID: import.meta.env.VITE_SPOTIFY_CLIENT_ID,
    REDIRECT_URI: import.meta.env.VITE_REDIRECT_URI,
    hasToken: !!token,
  });

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (token) {
      console.log('User already has token, redirecting to dashboard...');
      navigate('/dashboard');
    }
  }, [token, navigate]);

  // Check for callback errors in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    const errorDescription = urlParams.get('error_description');
    
    if (error) {
      console.error('OAuth error in URL:', error, errorDescription);
      // Clear any stored code verifier on error
      localStorage.removeItem('code_verifier');
    }
  }, []);
  
  const handleLogin = async () => {
    if (isLoading) return; // Prevent multiple clicks
    
    console.log('Login button clicked');
    setIsLoading(true);
    
    try {
      if (AUTH_SERVER) {
        console.log('Using auth server:', AUTH_SERVER);
        // Use auth server
        window.location.href = `${AUTH_SERVER.replace(/\/$/, '')}/login`;
      } else {
        console.log('Using PKCE flow');
        
        // Clear any existing code verifier
        localStorage.removeItem('code_verifier');
        console.log('Cleared any existing code verifier');
        
        // Use Authorization Code with PKCE
        const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
        const REDIRECT_URI = import.meta.env.VITE_REDIRECT_URI ?? 'http://127.0.0.1:5173/callback';
        const AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize';
        
        if (!CLIENT_ID) {
          throw new Error('VITE_SPOTIFY_CLIENT_ID is not set');
        }
        
        console.log('OAuth config:', { CLIENT_ID, REDIRECT_URI });
        
        const SCOPES = [
          'user-read-private', 
          'user-read-email', 
          'playlist-read-private',
          'user-read-recently-played',
          'user-top-read',
          'user-read-playback-state',
          'user-modify-playback-state',
          'streaming'
        ].join(' ');

        // Generate PKCE parameters
        console.log('Generating PKCE parameters...');
        const codeVerifier = generateRandomString(64);
        const hashed = await sha256(codeVerifier);
        const codeChallenge = base64encode(hashed);
        
        console.log('PKCE generated:', { 
          codeVerifierLength: codeVerifier.length, 
          codeChallengeLength: codeChallenge.length 
        });
        
        // Store code verifier for later use
        localStorage.setItem('code_verifier', codeVerifier);
        console.log('Code verifier stored in localStorage');
        
        // Verify storage worked
        const storedVerifier = localStorage.getItem('code_verifier');
        if (storedVerifier !== codeVerifier) {
          throw new Error('Failed to store code verifier in localStorage');
        }
        console.log('✅ Code verifier storage verified');

        const params = new URLSearchParams({
          client_id: CLIENT_ID,
          response_type: 'code',
          redirect_uri: REDIRECT_URI,
          state: generateRandomString(16),
          scope: SCOPES,
          code_challenge_method: 'S256',
          code_challenge: codeChallenge,
        });

        const authUrl = `${AUTH_ENDPOINT}?${params.toString()}`;
        
        // Debug: Log the generated auth URL
        console.log('Generated auth URL:', authUrl);
        console.log('Redirecting to Spotify...');
        
        window.location.href = authUrl;
      }
    } catch (error) {
      console.error('Error during login setup:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dark-bg via-gray-900 to-black">
      <div className="music-card text-center max-w-md mx-4">
        {/* Spotify Icon */}
        <div className="w-16 h-16 bg-spotify-green rounded-full flex items-center justify-center mx-auto mb-6">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.5 14.424c-.18.295-.566.387-.86.205-2.36-1.442-5.328-1.769-8.828-.969a.75.75 0 01-.312-1.467c3.827-.876 7.082-.496 9.795 1.12.295.18.387.565.205.86zm1.232-2.74c-.226.367-.706.482-1.073.257-2.7-1.66-6.817-2.14-10.016-1.17a.958.958 0 11-.554-1.834c3.66-1.109 8.26-.573 11.386 1.34.366.225.482.706.257 1.072zm.106-2.856c-3.237-1.922-8.58-2.1-11.67-1.16a1.15 1.15 0 01-1.334-1.876c3.542-1.08 9.453-.872 13.243 1.34a1.15 1.15 0 01-1.24 1.936z" fill="currentColor" className="text-black"/>
          </svg>
        </div>

        <h1 className="text-3xl font-bold mb-3 text-white">Welcome to Spotify Lite</h1>
        <p className="mb-8 text-muted-dark text-lg">Experience your music like never before</p>
        
        <div className="space-y-4 mb-8">
          <div className="flex items-center gap-3 text-muted-dark">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Access your playlists</span>
          </div>
          <div className="flex items-center gap-3 text-muted-dark">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Control playback</span>
          </div>
          <div className="flex items-center gap-3 text-muted-dark">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Search millions of songs</span>
          </div>
        </div>

        <button 
          onClick={handleLogin} 
          disabled={isLoading}
          className={`btn-spotify w-full text-lg py-4 flex items-center justify-center gap-3 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
              Connecting...
            </>
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.5 14.424c-.18.295-.566.387-.86.205-2.36-1.442-5.328-1.769-8.828-.969a.75.75 0 01-.312-1.467c3.827-.876 7.082-.496 9.795 1.12.295.18.387.565.205.86zm1.232-2.74c-.226.367-.706.482-1.073.257-2.7-1.66-6.817-2.14-10.016-1.17a.958.958 0 11-.554-1.834c3.66-1.109 8.26-.573 11.386 1.34.366.225.482.706.257 1.072zm.106-2.856c-3.237-1.922-8.58-2.1-11.67-1.16a1.15 1.15 0 01-1.334-1.876c3.542-1.08 9.453-.872 13.243 1.34a1.15 1.15 0 01-1.24 1.936z" fill="currentColor"/>
              </svg>
              Continue with Spotify
            </>
          )}
        </button>
        
        <p className="text-xs text-muted-dark mt-6">
          By continuing, you agree to give this app access to your Spotify account
        </p>
      </div>
    </div>
  );
};

export default Login;
