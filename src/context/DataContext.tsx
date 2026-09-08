import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Equipment, Category, EquipmentType, User, Room, MaintenanceLog } from '../types';
import * as api from '../api';

interface DataContextType {
  equipment: Equipment[];
  categories: Category[];
  equipmentTypes: EquipmentType[];
  users: User[];
  rooms: Room[];
  loading: boolean;
  error: string | null;
  refreshEquipment: () => Promise<void>;
  refreshCategories: () => Promise<void>;
  refreshEquipmentTypes: () => Promise<void>;
  refreshUsers: () => Promise<void>;
  refreshRooms: () => Promise<void>;
  refreshAll: () => Promise<void>;
  addEquipment: (item: Omit<Equipment, 'id' | 'qrCode' | 'createdAt'>) => Promise<Equipment>;
  updateEquipment: (id: string, data: Partial<Equipment>) => Promise<Equipment>;
  deleteEquipment: (id: string) => Promise<void>;
  changeEquipmentStatus: (id: string, status: string, comment?: string) => Promise<void>;
  moveEquipment: (id: string, data: { user_id?: string; room_id?: string; comment?: string }) => Promise<void>;
  addCategory: (item: Omit<Category, 'id'>) => Promise<Category>;
  updateCategory: (id: string, data: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  addEquipmentType: (item: Omit<EquipmentType, 'id'>) => Promise<EquipmentType>;
  updateEquipmentType: (id: string, data: Partial<EquipmentType>) => Promise<void>;
  deleteEquipmentType: (id: string) => Promise<void>;
  addUser: (item: Omit<User, 'id'>) => Promise<User>;
  updateUser: (id: string, data: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  addRoom: (item: Omit<Room, 'id'>) => Promise<Room>;
  updateRoom: (id: string, data: Partial<Room>) => Promise<void>;
  deleteRoom: (id: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [equipmentTypes, setEquipmentTypes] = useState<EquipmentType[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshEquipment = useCallback(async () => {
    try {
      const data = await api.getEquipment();
      setEquipment(data.map(mapEquipmentFromAPI));
    } catch (e: any) { setError(e.message); }
  }, []);

  const refreshCategories = useCallback(async () => {
    try {
      const data = await api.getCategories();
      setCategories(data.map(mapCategoryFromAPI));
    } catch (e: any) { setError(e.message); }
  }, []);

  const refreshEquipmentTypes = useCallback(async () => {
    try {
      const data = await api.getEquipmentTypes();
      setEquipmentTypes(data.map(mapTypeFromAPI));
    } catch (e: any) { setError(e.message); }
  }, []);

  const refreshUsers = useCallback(async () => {
    try {
      const data = await api.getUsers();
      setUsers(data.map(mapUserFromAPI));
    } catch (e: any) { setError(e.message); }
  }, []);

  const refreshRooms = useCallback(async () => {
    try {
      const data = await api.getRooms();
      setRooms(data.map(mapRoomFromAPI));
    } catch (e: any) { setError(e.message); }
  }, []);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([refreshEquipment(), refreshCategories(), refreshEquipmentTypes(), refreshUsers(), refreshRooms()]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [refreshEquipment, refreshCategories, refreshEquipmentTypes, refreshUsers, refreshRooms]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Equipment
  const addEquipment = async (item: Omit<Equipment, 'id' | 'qrCode' | 'createdAt'>) => {
    const data = await api.createEquipment(item);
    await refreshEquipment();
    return mapEquipmentFromAPI(data);
  };

  const updateEquipmentFn = async (id: string, data: Partial<Equipment>) => {
    const result = await api.updateEquipment(id, data);
    await refreshEquipment();
    return mapEquipmentFromAPI(result);
  };

  const deleteEquipmentFn = async (id: string) => {
    await api.deleteEquipment(id);
    await refreshEquipment();
  };

  const changeEquipmentStatus = async (id: string, status: string, comment?: string) => {
    await api.changeEquipmentStatus(id, status, comment);
    await refreshEquipment();
  };

  const moveEquipmentFn = async (id: string, data: { user_id?: string; room_id?: string; comment?: string }) => {
    await api.moveEquipment(id, data);
    await refreshEquipment();
  };

  // Categories
  const addCategory = async (item: Omit<Category, 'id'>) => {
    const data = await api.createCategory(item);
    await refreshCategories();
    return mapCategoryFromAPI(data);
  };

  const updateCategoryFn = async (id: string, data: Partial<Category>) => {
    await api.updateCategory(id, data);
    await refreshCategories();
  };

  const deleteCategoryFn = async (id: string) => {
    await api.deleteCategory(id);
    await refreshCategories();
  };

  // Types
  const addEquipmentType = async (item: Omit<EquipmentType, 'id'>) => {
    // Конвертируем camelCase в snake_case для API
    const apiData = {
      name: item.name,
      category_id: item.categoryId
    };
    const data = await api.createEquipmentType(apiData);
    await refreshEquipmentTypes();
    return mapTypeFromAPI(data);
  };

  const updateEquipmentTypeFn = async (id: string, data: Partial<EquipmentType>) => {
    // Конвертируем camelCase в snake_case для API
    const apiData: any = {};
    if (data.name !== undefined) apiData.name = data.name;
    if (data.categoryId !== undefined) apiData.category_id = data.categoryId;
    await api.updateEquipmentType(id, apiData);
    await refreshEquipmentTypes();
  };

  const deleteEquipmentTypeFn = async (id: string) => {
    await api.deleteEquipmentType(id);
    await refreshEquipmentTypes();
  };

  // Users
  const addUser = async (item: Omit<User, 'id'>) => {
    // Конвертируем camelCase в snake_case для API
    const apiData = {
      first_name: item.firstName,
      last_name: item.lastName,
      email: item.email || '',
      department: item.department || '',
      position: item.position || ''
    };
    const data = await api.createUser(apiData);
    await refreshUsers();
    return mapUserFromAPI(data);
  };

  const updateUserFn = async (id: string, data: Partial<User>) => {
    // Конвертируем camelCase в snake_case для API
    const apiData: any = {};
    if (data.firstName !== undefined) apiData.first_name = data.firstName;
    if (data.lastName !== undefined) apiData.last_name = data.lastName;
    if (data.email !== undefined) apiData.email = data.email;
    if (data.department !== undefined) apiData.department = data.department;
    if (data.position !== undefined) apiData.position = data.position;
    await api.updateUser(id, apiData);
    await refreshUsers();
  };

  const deleteUserFn = async (id: string) => {
    await api.deleteUser(id);
    await refreshUsers();
  };

  // Rooms
  const addRoom = async (item: Omit<Room, 'id'>) => {
    const data = await api.createRoom(item);
    await refreshRooms();
    return mapRoomFromAPI(data);
  };

  const updateRoomFn = async (id: string, data: Partial<Room>) => {
    await api.updateRoom(id, data);
    await refreshRooms();
  };

  const deleteRoomFn = async (id: string) => {
    await api.deleteRoom(id);
    await refreshRooms();
  };

  const value: DataContextType = {
    equipment, categories, equipmentTypes, users, rooms, loading, error,
    refreshEquipment, refreshCategories, refreshEquipmentTypes, refreshUsers, refreshRooms, refreshAll,
    addEquipment, updateEquipment: updateEquipmentFn, deleteEquipment: deleteEquipmentFn, changeEquipmentStatus, moveEquipment: moveEquipmentFn,
    addCategory, updateCategory: updateCategoryFn, deleteCategory: deleteCategoryFn,
    addEquipmentType, updateEquipmentType: updateEquipmentTypeFn, deleteEquipmentType: deleteEquipmentTypeFn,
    addUser, updateUser: updateUserFn, deleteUser: deleteUserFn,
    addRoom, updateRoom: updateRoomFn, deleteRoom: deleteRoomFn,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within DataProvider');
  return context;
}

// Маппинг из API формата в формат фронтенда
function mapEquipmentFromAPI(data: any): Equipment {
  return {
    id: data.id,
    name: data.name,
    serialNumber: data.serial_number || '',
    inventoryNumber: data.inventory_number || '',
    typeId: data.type_id,
    status: data.status,
    userId: data.user_id || null,
    roomId: data.room_id || null,
    purchaseDate: data.purchase_date || '',
    warrantyEnd: data.warranty_end || '',
    lastMaintenanceDate: data.last_maintenance_date || '',
    nextMaintenanceDate: data.next_maintenance_date || '',
    notes: data.notes || '',
    qrCode: data.qr_code,
    createdAt: data.created_at || '',
  };
}

function mapCategoryFromAPI(data: any): Category {
  return { id: data.id, name: data.name, description: data.description || '' };
}

function mapTypeFromAPI(data: any): EquipmentType {
  return { id: data.id, name: data.name, categoryId: data.category_id };
}

function mapUserFromAPI(data: any): User {
  return {
    id: data.id,
    firstName: data.first_name,
    lastName: data.last_name,
    email: data.email || '',
    department: data.department || '',
    position: data.position || '',
  };
}

function mapRoomFromAPI(data: any): Room {
  return {
    id: data.id,
    name: data.name,
    building: data.building || '',
    floor: data.floor || 0,
    description: data.description || '',
  };
}
