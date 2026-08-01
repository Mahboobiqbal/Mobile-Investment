require('dotenv').config();
const http = require('http');
const { exec } = require('child_process');

const PORT = 3456;
const REDIRECT_URI = `http://localhost:${PORT}/oauth2callback`;
const CLIENT_ID = process.env.GMAIL_CLIENT_ID;
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET;
const SCOPE = 'https://www.googleapis.com/auth/gmail.send';

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Missing GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET in .env');
  process.exit(1);
}

const authUrl =
  'https://accounts.google.com/o/oauth2/v2/auth' +
  `?client_id=${encodeURIComponent(CLIENT_ID)}` +
  `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
  '&response_type=code' +
  `&scope=${encodeURIComponent(SCOPE)}` +
  '&access_type=offline' +
  '&prompt=consent';

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  if (url.pathname !== '/oauth2callback') {
    res.writeHead(404).end('Not found');
    return;
  }
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');
  if (error) {
    res.writeHead(400).end('Authorization failed: ' + error);
    server.close();
    process.exit(1);
    return;
  }

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
      }).toString(),
    });
    const data = await tokenRes.json();
    if (!tokenRes.ok || !data.refresh_token) {
      throw new Error(JSON.stringify(data));
    }
    console.log('\n==================================================');
    console.log('GMAIL_REFRESH_TOKEN=' + data.refresh_token);
    console.log('==================================================');
    console.log('Paste the GMAIL_REFRESH_TOKEN value into backend/.env');
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<h3>Success! Refresh token generated. Close this tab.</h3>');
    server.close();
    process.exit(0);
  } catch (err) {
    console.error('Token exchange failed:', err.message);
    res.writeHead(500).end('Token exchange failed');
    server.close();
    process.exit(1);
  }
});

server.listen(PORT, () => {
  console.log('Opening browser for Google OAuth...');
  exec(`start "" "${authUrl}"`);
  console.log(`Waiting for authorization on http://localhost:${PORT}/oauth2callback`);
});
