const storage = require('../lib/storage');

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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const webhookData = await parseBody(req);
    console.log('Webhook recibido:', webhookData);

    storage.saveWebhook({
      event_type: webhookData.resource_name || webhookData.event_type,
      project_id: webhookData.project_id,
      folder_id: webhookData.folder_id,
      document_id: webhookData.id || webhookData.resource_id,
      payload: webhookData
    });

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error procesando webhook' });
  }
};
