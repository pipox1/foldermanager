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
      const { project_id, visible_folders } = body;

      if (!project_id || !Array.isArray(visible_folders)) {
        return res.status(400).json({ error: 'Datos inválidos' });
      }

      storage.saveFolderVisibility(parseInt(userId), parseInt(project_id), visible_folders);
      res.json({ success: true, message: 'Configuración guardada' });

    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Error guardando configuración' });
    }

  } else if (req.method === 'GET') {
    const { project_id } = req.query;
    if (!project_id) return res.status(400).json({ error: 'project_id requerido' });

    const visibility = storage.getFolderVisibility(parseInt(userId), parseInt(project_id));
    res.json({ 
      success: true, 
      visible_folders: visibility?.visible_folders || [] 
    });

  } else {
    res.status(405).json({ error: 'Método no permitido' });
  }
};
