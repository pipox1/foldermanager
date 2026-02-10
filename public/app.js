// Estado global
let currentUser = null;
let currentCompany = null;
let currentProject = null;
let allFolders = [];
let visibleFolderIds = [];

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
});

// Verificar autenticación
function checkAuth() {
  const userName = getCookie('user_name');
  
  if (userName) {
    currentUser = { name: decodeURIComponent(userName) };
    showMainScreen();
    loadCompanies();
  } else {
    showLoginScreen();
  }
}

// Pantallas
function showLoginScreen() {
  document.getElementById('login-screen').classList.remove('hidden');
  document.getElementById('main-screen').classList.add('hidden');
}

function showMainScreen() {
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('main-screen').classList.remove('hidden');
  
  document.getElementById('user-info').innerHTML = `
    <span>👤 ${currentUser.name}</span>
    <button onclick="logout()" class="btn btn-small btn-danger">Cerrar Sesión</button>
  `;
}

// Autenticación
function login() {
  window.location.href = '/api/auth';
}

function logout() {
  window.location.href = '/api/logout';
}

// Cargar compañías
async function loadCompanies() {
  try {
    const response = await fetch('/api/companies');
    const data = await response.json();
    
    if (data.success) {
      const select = document.getElementById('company-select');
      select.innerHTML = '<option value="">Selecciona una compañía...</option>';
      
      data.companies.forEach(company => {
        const option = document.createElement('option');
        option.value = company.id;
        option.textContent = company.name;
        select.appendChild(option);
      });
    }
  } catch (error) {
    console.error('Error cargando compañías:', error);
    alert('Error cargando compañías. Por favor, recarga la página.');
  }
}

// Cargar proyectos
async function loadProjects() {
  const companyId = document.getElementById('company-select').value;
  
  if (!companyId) {
    document.getElementById('project-select').innerHTML = '<option value="">Selecciona un proyecto...</option>';
    document.getElementById('folders-container').innerHTML = '';
    return;
  }

  currentCompany = companyId;

  try {
    const response = await fetch(`/api/projects?company_id=${companyId}`);
    const data = await response.json();
    
    if (data.success) {
      const select = document.getElementById('project-select');
      select.innerHTML = '<option value="">Selecciona un proyecto...</option>';
      
      data.projects.forEach(project => {
        const option = document.createElement('option');
        option.value = project.id;
        option.textContent = project.name;
        select.appendChild(option);
      });
    }
  } catch (error) {
    console.error('Error cargando proyectos:', error);
    alert('Error cargando proyectos');
  }
}

// Cargar carpetas
async function loadFolders() {
  const projectId = document.getElementById('project-select').value;
  
  if (!projectId || !currentCompany) {
    document.getElementById('folders-container').innerHTML = '';
    return;
  }

  currentProject = projectId;
  
  document.getElementById('folders-container').innerHTML = '<div class="loading">Cargando carpetas desde Procore</div>';

  try {
    // Cargar carpetas desde Procore
    const foldersResponse = await fetch(`/api/folders?project_id=${projectId}&company_id=${currentCompany}`);
    const foldersData = await foldersResponse.json();
    
    if (!foldersData.success) {
      throw new Error('Error obteniendo carpetas');
    }

    // Cargar configuración de visibilidad
    const visibilityResponse = await fetch(`/api/visibility?project_id=${projectId}`);
    const visibilityData = await visibilityResponse.json();
    
    allFolders = foldersData.folders;
    visibleFolderIds = visibilityData.visible_folders || [];
    
    // Si no hay configuración previa, mostrar todas las carpetas
    if (visibleFolderIds.length === 0) {
      visibleFolderIds = allFolders.map(f => f.id);
    }
    
    renderFolders();

  } catch (error) {
    console.error('Error cargando carpetas:', error);
    document.getElementById('folders-container').innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">❌</div>
        <p>Error cargando carpetas</p>
        <p style="font-size: 13px; margin-top: 10px;">${error.message}</p>
      </div>
    `;
  }
}

// Renderizar carpetas (solo las visibles)
function renderFolders() {
  const container = document.getElementById('folders-container');
  
  // Filtrar solo carpetas visibles
  const visibleFolders = allFolders.filter(folder => 
    visibleFolderIds.includes(folder.id)
  );
  
  if (allFolders.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📁</div>
        <p>No hay carpetas en este proyecto</p>
      </div>
    `;
    return;
  }

  if (visibleFolders.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">👁️</div>
        <p>No hay carpetas visibles</p>
        <button onclick="openSettings()" class="btn btn-primary" style="margin-top: 20px;">
          ⚙️ Configurar Carpetas Visibles
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = visibleFolders.map(folder => `
    <div class="folder-card ${folder.has_pending_response ? 'pending' : ''}">
      <div class="folder-header">
        <div class="folder-name" onclick="viewDocuments(${folder.id}, '${escapeHtml(folder.name)}')">
          📁 ${escapeHtml(folder.name)}
        </div>
        <span class="status-badge ${folder.has_pending_response ? 'pending' : 'ok'}">
          ${folder.has_pending_response ? '⚠️ Pendiente' : '✅ OK'}
        </span>
      </div>
      
      <div class="folder-actions">
        <label class="toggle-container">
          <input type="checkbox" 
                 ${folder.has_pending_response ? 'checked' : ''}
                 onchange="togglePending(${folder.id}, '${escapeHtml(folder.name)}', this.checked)">
          <span>Marcar respuesta pendiente</span>
        </label>
      </div>
      
      <div class="document-count" id="doc-count-${folder.id}">
        📄 Cargando...
      </div>
    </div>
  `).join('');

  // Cargar conteo de documentos para cada carpeta
  visibleFolders.forEach(folder => {
    loadDocumentCount(folder.id);
  });
}

// Contar documentos en una carpeta
async function loadDocumentCount(folderId) {
  try {
    const response = await fetch(`/api/documents?project_id=${currentProject}&folder_id=${folderId}&company_id=${currentCompany}`);
    const data = await response.json();
    
    if (data.success) {
      const countElement = document.getElementById(`doc-count-${folderId}`);
      if (countElement) {
        countElement.textContent = `📄 ${data.count} documento${data.count !== 1 ? 's' : ''}`;
      }
    }
  } catch (error) {
    console.error('Error contando documentos:', error);
    const countElement = document.getElementById(`doc-count-${folderId}`);
    if (countElement) {
      countElement.textContent = '📄 Error cargando';
    }
  }
}

// Ver documentos de una carpeta
async function viewDocuments(folderId, folderName) {
  document.getElementById('modal-title').textContent = `📁 ${folderName}`;
  document.getElementById('modal-body').innerHTML = '<div class="loading">Cargando documentos</div>';
  document.getElementById('documents-modal').classList.remove('hidden');

  try {
    const response = await fetch(`/api/documents?project_id=${currentProject}&folder_id=${folderId}&company_id=${currentCompany}`);
    const data = await response.json();
    
    if (data.success) {
      if (data.documents.length === 0) {
        document.getElementById('modal-body').innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon">📄</div>
            <p>No hay documentos en esta carpeta</p>
          </div>
        `;
      } else {
        document.getElementById('modal-body').innerHTML = data.documents.map(doc => `
          <div class="document-item">
            <div class="document-icon">📄</div>
            <div class="document-info">
              <div class="document-name">${escapeHtml(doc.name)}</div>
              <div class="document-meta">
                Creado: ${new Date(doc.created_at).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>
          </div>
        `).join('');
      }
    }
  } catch (error) {
    console.error('Error cargando documentos:', error);
    document.getElementById('modal-body').innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">❌</div>
        <p>Error cargando documentos</p>
      </div>
    `;
  }
}

// Cerrar modal de documentos
function closeDocumentsModal() {
  document.getElementById('documents-modal').classList.add('hidden');
}

// Abrir configuración de carpetas visibles
function openSettings() {
  if (!currentProject || allFolders.length === 0) {
    alert('Primero selecciona un proyecto con carpetas');
    return;
  }

  const settingsList = document.getElementById('settings-folders-list');
  
  settingsList.innerHTML = allFolders.map(folder => `
    <div class="settings-item">
      <input type="checkbox" 
             id="folder-visible-${folder.id}" 
             value="${folder.id}"
             ${visibleFolderIds.includes(folder.id) ? 'checked' : ''}>
      <label for="folder-visible-${folder.id}">
        📁 ${escapeHtml(folder.name)}
      </label>
    </div>
  `).join('');

  document.getElementById('settings-modal').classList.remove('hidden');
}

// Cerrar modal de configuración
function closeSettingsModal() {
  document.getElementById('settings-modal').classList.add('hidden');
}

// Guardar configuración de carpetas visibles
async function saveSettings() {
  const checkboxes = document.querySelectorAll('#settings-folders-list input[type="checkbox"]');
  const selectedFolders = [];
  
  checkboxes.forEach(checkbox => {
    if (checkbox.checked) {
      selectedFolders.push(parseInt(checkbox.value));
    }
  });

  if (selectedFolders.length === 0) {
    alert('Debes seleccionar al menos una carpeta para mostrar');
    return;
  }

  try {
    const response = await fetch('/api/visibility', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: currentProject,
        visible_folders: selectedFolders
      })
    });

    const data = await response.json();
    
    if (data.success) {
      visibleFolderIds = selectedFolders;
      closeSettingsModal();
      renderFolders();
    } else {
      alert('Error guardando configuración');
    }
  } catch (error) {
    console.error('Error guardando configuración:', error);
    alert('Error guardando configuración. Intenta de nuevo.');
  }
}

// Toggle estado pendiente de una carpeta
async function togglePending(folderId, folderName, isPending) {
  try {
    const response = await fetch('/api/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: currentProject,
        folder_id: folderId,
        folder_name: folderName,
        has_pending_response: isPending,
        notes: ''
      })
    });

    const data = await response.json();
    
    if (data.success) {
      // Actualizar estado local
      const folderIndex = allFolders.findIndex(f => f.id === folderId);
      if (folderIndex !== -1) {
        allFolders[folderIndex].has_pending_response = isPending;
        renderFolders();
      }
    } else {
      alert('Error actualizando estado');
    }
  } catch (error) {
    console.error('Error actualizando estado:', error);
    alert('Error actualizando estado. Intenta de nuevo.');
  }
}

// Refrescar carpetas
function refreshFolders() {
  if (currentProject && currentCompany) {
    loadFolders();
  } else {
    alert('Primero selecciona una compañía y un proyecto');
  }
}

// Utilidades
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Cerrar modales con ESC
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeDocumentsModal();
    closeSettingsModal();
  }
});
