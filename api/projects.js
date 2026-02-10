const ProcoreClient = require('../lib/procore');
const storage = require('../lib/storage');

function getCookie(req, name) {
  const cookies = req.headers.cookie?.split(';').map(c => c.trim()) || [];
  const cookie = cookies.find(c => c.startsWith(`${name}=`));
  return cookie?.split('=')[1];
}

module.exports = async (req, res) => {
  const userId = getCookie(req, 'user_id');
  const { company_id } = req.query;

  if (!userId) return res.status(401).json({ error: 'No autenticado' });
  if (!company_id) return res.status(400).json({ error: 'company_id requerido' });

  try {
    const user = storage.getUserById(parseInt(userId));
    if (!user) return res.status(401).json({ error: 'Usuario no encontrado' });

    user.company_id = parseInt(company_id);

    const procore = new ProcoreClient(user.access_token);
    const projects = await procore.getProjects(company_id);

    res.json({ success: true, projects });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error obteniendo proyectos' });
  }
};
