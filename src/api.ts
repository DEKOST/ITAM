const API_BASE = 'http://localhost:3001/api';

async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
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
export const createEquipment = (data: any) => fetchAPI('/equipment', { method: 'POST', body: JSON.stringify(data) });
export const updateEquipment = (id: string, data: any) => fetchAPI(`/equipment/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const changeEquipmentStatus = (id: string, status: string, comment?: string) => 
  fetchAPI(`/equipment/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, comment }) });
export const moveEquipment = (id: string, data: { user_id?: string; room_id?: string; comment?: string }) => 
  fetchAPI(`/equipment/${id}/move`, { method: 'PATCH', body: JSON.stringify(data) });
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

// Users
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
