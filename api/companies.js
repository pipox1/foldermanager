const ProcoreClient = require('../lib/procore');
const storage = require('../lib/storage');

function getCookie(req, name) {
  const cookies = req.headers.cookie?.split(';').map(c => c.trim()) || [];
  const cookie = cookies.find(c => c.startsWith(`${name}=`));
  return cookie?.split('=')[1];
}

module.exports = async (req, res) => {
  const userId = getCookie(req, 'user_id');

  if (!userId) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  try {
    const user = storage.getUserById(parseInt(userId));
    if (!user) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    const procore = new ProcoreClient(user.access_token);
    const companies = await procore.getCompanies();

    res.json({ success: true, companies });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error obteniendo compañías' });
  }
};
