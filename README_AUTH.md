Authorization Code Flow server scaffold

1. Copy `.env.example` to `.env` and fill `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET`.

2. Start server (from project root):

```bash
npm run dev:server
```

3. Visit `http://localhost:3001/login` to start the Authorization Code flow. The server will exchange the code for tokens and redirect back to the client app with query parameters `access_token`, `refresh_token`, and `expires_in`.

Notes
- For production you should store refresh tokens securely and implement a refresh endpoint.
- This scaffold is intentionally small; extend and secure it for real deployments.
