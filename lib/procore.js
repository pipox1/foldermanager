const axios = require('axios');

class ProcoreClient {
  constructor(accessToken) {
    this.accessToken = accessToken;
    this.baseURL = 'https://api.procore.com/rest/v1.0';
    
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async getCompanies() {
    const response = await this.client.get('/companies');
    return response.data;
  }

  async getProjects(companyId) {
    const response = await this.client.get('/projects', {
      params: { company_id: companyId }
    });
    return response.data;
  }

  async getFolders(projectId, companyId) {
    const response = await this.client.get('/folders', {
      params: {
        project_id: projectId,
        company_id: companyId
      }
    });
    return response.data;
  }

  async getDocuments(projectId, folderId, companyId) {
    const response = await this.client.get('/documents', {
      params: {
        project_id: projectId,
        folder_id: folderId,
        company_id: companyId
      }
    });
    return response.data;
  }

  async getCurrentUser() {
    const response = await this.client.get('/me');
    return response.data;
  }
}

module.exports = ProcoreClient;
