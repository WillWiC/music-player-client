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
  if (!refresh_token) return res.status(400).json({ error: 'refresh_token required' });

  const tokenUrl = 'https://accounts.spotify.com/api/token';
  const body = querystring.stringify({
    grant_type: 'refresh_token',
    refresh_token,
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
    // forward access_token and expires_in to client
    res.json({ access_token: data.access_token, expires_in: data.expires_in });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'refresh failed' });
  }
});

app.listen(PORT, () => console.log(`Auth server running on ${PORT}`));
