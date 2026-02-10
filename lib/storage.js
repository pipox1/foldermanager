class SimpleStorage {
  constructor() {
    this.users = new Map();
    this.folderStatuses = new Map();
    this.folderVisibility = new Map();
    this.webhooks = [];
  }

  saveUser(userData) {
    this.users.set(userData.procore_user_id, {
      id: userData.procore_user_id,
      email: userData.email,
      name: userData.name,
      access_token: userData.access_token,
      refresh_token: userData.refresh_token,
      token_expires_at: userData.token_expires_at,
      company_id: userData.company_id || null,
      created_at: Date.now()
    });
    return this.users.get(userData.procore_user_id);
  }

  getUserById(userId) {
    return this.users.get(parseInt(userId));
  }

  saveFolderStatus(userId, projectId, folderId, data) {
    const key = `${userId}-${projectId}-${folderId}`;
    this.folderStatuses.set(key, {
      user_id: userId,
      project_id: projectId,
      folder_id: folderId,
      folder_name: data.folder_name,
      has_pending_response: data.has_pending_response || false,
      notes: data.notes || '',
      updated_at: Date.now()
    });
    return this.folderStatuses.get(key);
  }

  getFolderStatus(userId, projectId, folderId) {
    const key = `${userId}-${projectId}-${folderId}`;
    return this.folderStatuses.get(key);
  }

  getAllFolderStatuses(userId, projectId) {
    const results = [];
    for (const [key, value] of this.folderStatuses.entries()) {
      if (value.user_id === userId && value.project_id === projectId) {
        results.push(value);
      }
    }
    return results;
  }

  saveFolderVisibility(userId, projectId, visibleFolders) {
    const key = `${userId}-${projectId}`;
    this.folderVisibility.set(key, {
      user_id: userId,
      project_id: projectId,
      visible_folders: visibleFolders,
      updated_at: Date.now()
    });
  }

  getFolderVisibility(userId, projectId) {
    const key = `${userId}-${projectId}`;
    return this.folderVisibility.get(key);
  }

  saveWebhook(data) {
    this.webhooks.push({
      id: this.webhooks.length + 1,
      ...data,
      created_at: Date.now(),
      processed: false
    });
  }

  getUnprocessedWebhooks() {
    return this.webhooks.filter(w => !w.processed);
  }
}

module.exports = new SimpleStorage();
