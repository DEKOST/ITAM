// Автоматически определяем базовый URL API
// Для production используем относительный путь (работает через reverse proxy)
// Для разработки можно указать явно
const API_BASE = window.location.hostname === 'localhost' && window.location.port === '5173'
  ? 'http://localhost:3001/api'  // Режим разработки Vite
  : '/api';  // Production (через Apache/Nginx reverse proxy)

async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('itam_token');
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  // Если токен недействителен - перенаправляем на логин
  if (response.status === 401) {
    localStorage.removeItem('itam_token');
    window.location.hash = '#/login';
    throw new Error('Сессия истекла. Войдите снова.');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Ошибка запроса' }));
    throw new Error(error.error || 'Ошибка запроса');
  }
  
  return response.json();
}

// Equipment
export const getEquipment = (params?: Record<string, string>) => {
  const query = params ? '?' + new URLSearchParams(params).toString() : '';
  return fetchAPI(`/equipment${query}`);
};
export const getEquipmentById = (id: string) => fetchAPI(`/equipment/${id}`);
export const getEquipmentByQR = (code: string) => fetchAPI(`/equipment/qr/${code}`);
export const getEquipmentHistory = (id: string) => fetchAPI(`/equipment/${id}/history`);
export const createEquipment = (data: any) => fetchAPI('/equipment', { method: 'POST', body: JSON.stringify(data) });
export const updateEquipment = (id: string, data: any) => fetchAPI(`/equipment/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const changeEquipmentStatus = (id: string, status: string, comment?: string) => 
  fetchAPI(`/equipment/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, comment }) });
export const moveEquipment = (id: string, data: { user_id?: string | null; room_id?: string | null; comment?: string }) => 
  fetchAPI(`/equipment/${id}/move`, { method: 'PATCH', body: JSON.stringify(data) });
export const changeEquipmentName = (id: string, name: string, comment?: string) => 
  fetchAPI(`/equipment/${id}/name`, { method: 'PATCH', body: JSON.stringify({ name, comment }) });
export const deleteEquipment = (id: string) => fetchAPI(`/equipment/${id}`, { method: 'DELETE' });
export const getEquipmentStats = () => fetchAPI('/stats');

// Categories
export const getCategories = () => fetchAPI('/categories');
export const createCategory = (data: any) => fetchAPI('/categories', { method: 'POST', body: JSON.stringify(data) });
export const updateCategory = (id: string, data: any) => fetchAPI(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteCategory = (id: string) => fetchAPI(`/categories/${id}`, { method: 'DELETE' });

// Types
export const getEquipmentTypes = () => fetchAPI('/types');
export const createEquipmentType = (data: any) => fetchAPI('/types', { method: 'POST', body: JSON.stringify(data) });
export const updateEquipmentType = (id: string, data: any) => fetchAPI(`/types/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteEquipmentType = (id: string) => fetchAPI(`/types/${id}`, { method: 'DELETE' });

// Users (сотрудники)
export const getUsers = () => fetchAPI('/users');
export const getUserById = (id: string) => fetchAPI(`/users/${id}`);
export const createUser = (data: any) => fetchAPI('/users', { method: 'POST', body: JSON.stringify(data) });
export const updateUser = (id: string, data: any) => fetchAPI(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteUser = (id: string) => fetchAPI(`/users/${id}`, { method: 'DELETE' });

// Rooms
export const getRooms = () => fetchAPI('/rooms');
export const getRoomById = (id: string) => fetchAPI(`/rooms/${id}`);
export const createRoom = (data: any) => fetchAPI('/rooms', { method: 'POST', body: JSON.stringify(data) });
export const updateRoom = (id: string, data: any) => fetchAPI(`/rooms/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteRoom = (id: string) => fetchAPI(`/rooms/${id}`, { method: 'DELETE' });

// Subdivisions
export const getSubdivisions = () => fetchAPI('/subdivisions');
export const getSubdivisionById = (id: string) => fetchAPI(`/subdivisions/${id}`);
export const createSubdivision = (data: any) => fetchAPI('/subdivisions', { method: 'POST', body: JSON.stringify(data) });
export const updateSubdivision = (id: string, data: any) => fetchAPI(`/subdivisions/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteSubdivision = (id: string) => fetchAPI(`/subdivisions/${id}`, { method: 'DELETE' });

// Certificates (SSL)
export const getCertificates = () => fetchAPI('/certificates');
export const uploadCertificate = (formData: FormData) => {
  const token = localStorage.getItem('itam_token');
  return fetch(`${API_BASE}/certificates`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData,
  }).then(r => {
    if (!r.ok) throw new Error('Ошибка загрузки');
    return r.json();
  });
};
export const activateCertificate = (id: string) => fetchAPI(`/certificates/${id}/activate`, { method: 'POST' });
export const deactivateCertificate = (id: string) => fetchAPI(`/certificates/${id}/deactivate`, { method: 'POST' });
export const deleteCertificate = (id: string) => fetchAPI(`/certificates/${id}`, { method: 'DELETE' });
export const generateSelfSigned = (data: { domain: string; name?: string; days?: number }) => 
  fetchAPI('/certificates/generate-self-signed', { method: 'POST', body: JSON.stringify(data) });

// Auth Users (админ)
export const getAuthUsers = () => fetchAPI('/auth/users');
export const createAuthUser = (data: any) => fetchAPI('/auth/users', { method: 'POST', body: JSON.stringify(data) });
export const updateAuthUser = (id: string, data: any) => fetchAPI(`/auth/users/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteAuthUser = (id: string) => fetchAPI(`/auth/users/${id}`, { method: 'DELETE' });
export const getAuthLogs = (limit?: number) => fetchAPI(`/auth/logs${limit ? `?limit=${limit}` : ''}`);

// Backups
export const getBackups = () => fetchAPI('/backups');
export const createBackup = () => fetchAPI('/backups', { method: 'POST' });
export const restoreBackup = (filename: string) => fetchAPI('/backups/restore', { method: 'POST', body: JSON.stringify({ filename }) });
export const deleteBackup = (filename: string) => fetchAPI(`/backups/${filename}`, { method: 'DELETE' });



// Maintenance Types
export const getMaintenanceTypes = () => fetchAPI('/maintenance-types');
export const getMaintenanceTypeById = (id: string) => fetchAPI(`/maintenance-types/${id}`);
export const createMaintenanceType = (data: any) => fetchAPI('/maintenance-types', { method: 'POST', body: JSON.stringify(data) });
export const updateMaintenanceType = (id: string, data: any) => fetchAPI(`/maintenance-types/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteMaintenanceType = (id: string) => fetchAPI(`/maintenance-types/${id}`, { method: 'DELETE' });

// Maintenance Logs
export const getEquipmentMaintenance = (id: string) => fetchAPI(`/equipment/${id}/maintenance`);
export const getLastMaintenance = (id: string, typeId: string) => fetchAPI(`/equipment/${id}/maintenance/last/${typeId}`);
export const addMaintenance = (id: string, data: any) => fetchAPI(`/equipment/${id}/maintenance`, { method: 'POST', body: JSON.stringify(data) });
export const getNextMaintenance = (id: string) => fetchAPI(`/equipment/${id}/next-maintenance`);
