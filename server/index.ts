import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import querystring from 'querystring';

dotenv.config();

const app = express();
app.use(express.json());

// Basic CORS for dev: allow client redirect origin or all
app.use((req, res, next) => {
  const origin = process.env.CLIENT_APP_REDIRECT || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});
const PORT = process.env.PORT || 3001;

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID!;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET!;
const REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI || 'http://localhost:5173/callback';

// Step 1: Redirect user to Spotify authorize URL
app.get('/login', (req, res) => {
  const scope = [
    'user-read-private',
    'user-read-email',
    'playlist-read-private',
    'streaming',
    'user-read-playback-state',
    'user-modify-playback-state',
  ].join(' ');
  const params = querystring.stringify({
    response_type: 'code',
    client_id: CLIENT_ID,
    scope,
    redirect_uri: REDIRECT_URI,
  });
  res.redirect(`https://accounts.spotify.com/authorize?${params}`);
});

// Step 2: Spotify redirects back with ?code=...
app.get('/callback', async (req, res) => {
  const code = req.query.code as string;
  if (!code) return res.status(400).send('Missing code');

  const tokenUrl = 'https://accounts.spotify.com/api/token';
  const body = querystring.stringify({
    grant_type: 'authorization_code',
    code,
    redirect_uri: REDIRECT_URI,
  });

  const authHeader = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

  try {
    const tokenRes = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${authHeader}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });
    const data = await tokenRes.json();
    // data contains access_token, refresh_token, expires_in
    // For a client app, redirect back to client with tokens in query or set a cookie
    const redirectTo = (process.env.CLIENT_APP_REDIRECT || 'http://localhost:5173') +
      `?access_token=${encodeURIComponent(data.access_token)}&refresh_token=${encodeURIComponent(data.refresh_token)}&expires_in=${data.expires_in}`;
    res.redirect(redirectTo);
  } catch (err) {
    console.error(err);
    res.status(500).send('Token exchange failed');
  }
});

// Refresh endpoint: client sends refresh_token and server exchanges it for a new access token
app.post('/refresh', async (req, res) => {
  const refresh_token = req.body?.refresh_token;
  if (!refresh_token) {
    return res.status(400).json({ 
      error: 'refresh_token required',
      details: 'Missing refresh_token in request body'
    });
  }

  console.log('Refresh token request received:', {
    refresh_token_preview: `${refresh_token.substring(0, 10)}...`,
    client_id: CLIENT_ID ? 'Set' : 'Missing',
    client_secret: CLIENT_SECRET ? 'Set' : 'Missing'
  });

  // Validate that we have necessary environment variables
  if (!CLIENT_ID || !CLIENT_SECRET) {
    console.error('Missing CLIENT_ID or CLIENT_SECRET environment variables');
    return res.status(500).json({ 
      error: 'server_configuration_error',
      details: 'Missing required server configuration'
    });
  }

  const tokenUrl = 'https://accounts.spotify.com/api/token';
  const body = querystring.stringify({
    grant_type: 'refresh_token',
    refresh_token,
  });
  const authHeader = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

  try {
    console.log('Attempting to refresh token with Spotify...');
    const tokenRes = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${authHeader}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    console.log('Spotify response status:', tokenRes.status);

    if (!tokenRes.ok) {
      const errorText = await tokenRes.text();
      console.error(`Spotify token refresh failed: ${tokenRes.status} - ${errorText}`);
      
      // Handle specific Spotify errors
      if (tokenRes.status === 400) {
        return res.status(400).json({ 
          error: 'invalid_refresh_token',
          details: 'The refresh token is invalid or expired. Please log in again.',
          spotify_error: errorText
        });
      }
      
      throw new Error(`Spotify API error: ${tokenRes.status} - ${errorText}`);
    }

    const data = await tokenRes.json();
    console.log('Spotify refresh response:', {
      has_access_token: !!data.access_token,
      has_refresh_token: !!data.refresh_token,
      expires_in: data.expires_in,
      new_refresh_token_preview: data.refresh_token ? `${data.refresh_token.substring(0, 10)}...` : 'None'
    });
    
    // Validate response data
    if (!data.access_token) {
      console.error('Spotify response missing access_token:', data);
      return res.status(500).json({ 
        error: 'invalid_response',
        details: 'Spotify response missing access_token'
      });
    }

    console.log('Token refresh successful');
    
    // Send successful response with new tokens
    const response: any = {
      access_token: data.access_token,
      expires_in: data.expires_in || 3600, // Default to 1 hour if not provided
      token_type: data.token_type || 'Bearer'
    };

    // If Spotify provides a new refresh token, include it
    if (data.refresh_token) {
      response.refresh_token = data.refresh_token;
      console.log('Returning new refresh token to client');
    } else {
      console.log('Spotify did not provide new refresh token - client should keep existing one');
    }

    res.json(response);
    
  } catch (err) {
    console.error('Error during token refresh:', err);
    res.status(500).json({ 
      error: 'refresh_failed',
      details: 'Failed to refresh access token. Please try logging in again.',
      message: typeof err === 'object' && err !== null && 'message' in err ? (err as { message?: string }).message : String(err)
    });
  }
});

app.listen(PORT, () => console.log(`Auth server running on ${PORT}`));
