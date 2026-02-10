const ProcoreClient = require('../lib/procore');
const storage = require('../lib/storage');

function getCookie(req, name) {
  const cookies = req.headers.cookie?.split(';').map(c => c.trim()) || [];
  const cookie = cookies.find(c => c.startsWith(`${name}=`));
  return cookie?.split('=')[1];
}

module.exports = async (req, res) => {
  const userId = getCookie(req, 'user_id');
  const { project_id, company_id } = req.query;

  if (!userId) return res.status(401).json({ error: 'No autenticado' });
  if (!project_id || !company_id) return res.status(400).json({ error: 'Faltan parámetros' });

  try {
    const user = storage.getUserById(parseInt(userId));
    if (!user) return res.status(401).json({ error: 'Usuario no encontrado' });

    const procore = new ProcoreClient(user.access_token);
    const folders = await procore.getFolders(project_id, company_id);

    const savedStatuses = storage.getAllFolderStatuses(parseInt(userId), parseInt(project_id));
    const statusMap = {};
    savedStatuses.forEach(status => {
      statusMap[status.folder_id] = status;
    });

    const foldersWithStatus = folders.map(folder => ({
      ...folder,
      has_pending_response: statusMap[folder.id]?.has_pending_response || false,
      notes: statusMap[folder.id]?.notes || ''
    }));

    res.json({ success: true, folders: foldersWithStatus });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error obteniendo carpetas' });
  }
};
