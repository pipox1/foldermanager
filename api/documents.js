const ProcoreClient = require('../lib/procore');
const storage = require('../lib/storage');

function getCookie(req, name) {
  const cookies = req.headers.cookie?.split(';').map(c => c.trim()) || [];
  const cookie = cookies.find(c => c.startsWith(`${name}=`));
  return cookie?.split('=')[1];
}

module.exports = async (req, res) => {
  const userId = getCookie(req, 'user_id');
  const { project_id, folder_id, company_id } = req.query;

  if (!userId) return res.status(401).json({ error: 'No autenticado' });
  if (!project_id || !folder_id || !company_id) {
    return res.status(400).json({ error: 'Faltan parámetros' });
  }

  try {
    const user = storage.getUserById(parseInt(userId));
    if (!user) return res.status(401).json({ error: 'Usuario no encontrado' });

    const procore = new ProcoreClient(user.access_token);
    const documents = await procore.getDocuments(project_id, folder_id, company_id);

    res.json({ success: true, documents, count: documents.length });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error obteniendo documentos' });
  }
};
