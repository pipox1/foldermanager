const storage = require('../lib/storage');

function getCookie(req, name) {
  const cookies = req.headers.cookie?.split(';').map(c => c.trim()) || [];
  const cookie = cookies.find(c => c.startsWith(`${name}=`));
  return cookie?.split('=')[1];
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try { resolve(JSON.parse(body)); } 
      catch (e) { reject(e); }
    });
  });
}

module.exports = async (req, res) => {
  const userId = getCookie(req, 'user_id');
  if (!userId) return res.status(401).json({ error: 'No autenticado' });

  if (req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const { project_id, folder_id, folder_name, has_pending_response, notes } = body;

      if (!project_id || !folder_id || !folder_name) {
        return res.status(400).json({ error: 'Datos incompletos' });
      }

      storage.saveFolderStatus(parseInt(userId), parseInt(project_id), parseInt(folder_id), {
        folder_name,
        has_pending_response,
        notes
      });

      res.json({ success: true });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Error actualizando estado' });
    }
  } else if (req.method === 'GET') {
    const { project_id, folder_id } = req.query;
    if (!project_id) return res.status(400).json({ error: 'project_id requerido' });

    if (folder_id) {
      const status = storage.getFolderStatus(parseInt(userId), parseInt(project_id), parseInt(folder_id));
      res.json({ success: true, status });
    } else {
      const statuses = storage.getAllFolderStatuses(parseInt(userId), parseInt(project_id));
      res.json({ success: true, statuses });
    }
  } else {
    res.status(405).json({ error: 'Método no permitido' });
  }
};
