const axios = require('axios');
const storage = require('../lib/storage');

module.exports = async (req, res) => {
  const { code } = req.query;

  if (!code) {
    const authURL = `https://login.procore.com/oauth/authorize?` +
      `client_id=${process.env.PROCORE_CLIENT_ID}&` +
      `response_type=code&` +
      `redirect_uri=${encodeURIComponent(process.env.PROCORE_REDIRECT_URI)}`;
    
    return res.redirect(authURL);
  }

  try {
    const tokenResponse = await axios.post('https://login.procore.com/oauth/token', {
      grant_type: 'authorization_code',
      client_id: process.env.PROCORE_CLIENT_ID,
      client_secret: process.env.PROCORE_CLIENT_SECRET,
      code: code,
      redirect_uri: process.env.PROCORE_REDIRECT_URI
    });

    const { access_token, refresh_token, expires_in } = tokenResponse.data;

    const userResponse = await axios.get('https://api.procore.com/rest/v1.0/me', {
      headers: { 'Authorization': `Bearer ${access_token}` }
    });

    const userData = userResponse.data;
    const tokenExpiresAt = Math.floor(Date.now() / 1000) + expires_in;

    const user = storage.saveUser({
      procore_user_id: userData.id,
      email: userData.login,
      name: userData.name,
      access_token: access_token,
      refresh_token: refresh_token,
      token_expires_at: tokenExpiresAt
    });

    res.setHeader('Set-Cookie', [
      `user_id=${user.id}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`,
      `user_name=${encodeURIComponent(user.name)}; Path=/; SameSite=Lax; Max-Age=2592000`
    ]);

    res.writeHead(302, { Location: '/' });
    res.end();

  } catch (error) {
    console.error('Error en autenticación:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Error en autenticación',
      details: error.response?.data || error.message 
    });
  }
};
