#!/usr/bin/env node

/**
 * Setup script for Spotify Token Refresh System
 * Run this to verify your environment and configuration
 */

const fs = require('fs');
const path = require('path');

console.log('🔐 Spotify Token Refresh System Setup\n');

// Check for required files
const requiredFiles = [
  'src/context/auth.tsx',
  'src/hooks/useSpotifyApi.ts',
  'server/index.ts',
  'package.json'
];

console.log('📁 Checking required files...');
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
  }
});

// Check environment variables
console.log('\n🌍 Checking environment variables...');

const frontendEnvVars = [
  'VITE_SPOTIFY_CLIENT_ID',
  'VITE_SPOTIFY_REDIRECT_URI', 
  'VITE_AUTH_SERVER_URL'
];

const backendEnvVars = [
  'SPOTIFY_CLIENT_ID',
  'SPOTIFY_CLIENT_SECRET',
  'SPOTIFY_REDIRECT_URI',
  'PORT'
];

console.log('\nFrontend (.env):');
frontendEnvVars.forEach(varName => {
  const value = process.env[varName];
  console.log(`${value ? '✅' : '❌'} ${varName}${value ? ` = ${value}` : ' - NOT SET'}`);
});

console.log('\nBackend (server .env):');
backendEnvVars.forEach(varName => {
  const value = process.env[varName];
  console.log(`${value ? '✅' : '❌'} ${varName}${value ? ' = [HIDDEN]' : ' - NOT SET'}`);
});

// Check package.json scripts
console.log('\n📦 Checking npm scripts...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const requiredScripts = ['dev', 'dev:server', 'dev:all'];
  
  requiredScripts.forEach(script => {
    if (packageJson.scripts && packageJson.scripts[script]) {
      console.log(`✅ ${script}: ${packageJson.scripts[script]}`);
    } else {
      console.log(`❌ ${script} - MISSING`);
    }
  });
} catch (error) {
  console.log('❌ Could not read package.json');
}

// Generate sample .env files if they don't exist
console.log('\n📝 Environment file setup...');

const sampleFrontendEnv = `# Frontend Environment Variables
VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id_here
VITE_SPOTIFY_REDIRECT_URI=http://localhost:5173
VITE_AUTH_SERVER_URL=http://localhost:3001`;

const sampleBackendEnv = `# Backend Environment Variables  
SPOTIFY_CLIENT_ID=your_spotify_client_id_here
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret_here
SPOTIFY_REDIRECT_URI=http://localhost:5173
CLIENT_APP_REDIRECT=http://localhost:5173
PORT=3001`;

if (!fs.existsSync('.env')) {
  fs.writeFileSync('.env', sampleFrontendEnv);
  console.log('✅ Created .env file with sample frontend variables');
} else {
  console.log('ℹ️  .env file already exists');
}

if (!fs.existsSync('server/.env')) {
  if (!fs.existsSync('server')) fs.mkdirSync('server');
  fs.writeFileSync('server/.env', sampleBackendEnv);
  console.log('✅ Created server/.env file with sample backend variables');
} else {
  console.log('ℹ️  server/.env file already exists');
}

// Usage instructions
console.log(`
🚀 Getting Started:

1. Update your .env files with actual Spotify credentials:
   - Get Client ID & Secret from: https://developer.spotify.com/dashboard
   - Update .env and server/.env files

2. Install dependencies (if not already done):
   npm install

3. Start the development servers:
   npm run dev:all

4. Test the token refresh:
   - Login to your app
   - Wait ~55 minutes or trigger refresh manually
   - Check browser console for refresh logs

📖 Documentation:
   - Read TOKEN_REFRESH_IMPLEMENTATION.md for full details
   - Check MIGRATION_EXAMPLE.tsx for code examples

🔧 Troubleshooting:
   - Ensure both frontend and backend servers are running
   - Check CORS settings if running on different domains  
   - Verify Spotify redirect URIs match your config
   - Check browser console and server logs for errors

✨ Your token refresh system is ready to use!
`);
