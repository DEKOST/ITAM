import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Equipment, Category, EquipmentType, User, Room, MaintenanceLog } from '../types';
import * as store from '../store';

interface DataContextType {
  equipment: Equipment[];
  categories: Category[];
  equipmentTypes: EquipmentType[];
  users: User[];
  rooms: Room[];
  maintenanceLogs: MaintenanceLog[];
  refreshData: () => void;
  addEquipment: (item: Equipment) => void;
  updateEquipment: (item: Equipment) => void;
  deleteEquipment: (id: string) => void;
  addCategory: (item: Category) => void;
  updateCategory: (item: Category) => void;
  deleteCategory: (id: string) => void;
  addEquipmentType: (item: EquipmentType) => void;
  updateEquipmentType: (item: EquipmentType) => void;
  deleteEquipmentType: (id: string) => void;
  addUser: (item: User) => void;
  updateUser: (item: User) => void;
  deleteUser: (id: string) => void;
  addRoom: (item: Room) => void;
  updateRoom: (item: Room) => void;
  deleteRoom: (id: string) => void;
  addMaintenanceLog: (item: MaintenanceLog) => void;
}

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [equipmentTypes, setEquipmentTypes] = useState<EquipmentType[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>([]);

  const refreshData = () => {
    setEquipment(store.getEquipment());
    setCategories(store.getCategories());
    setEquipmentTypes(store.getEquipmentTypes());
    setUsers(store.getUsers());
    setRooms(store.getRooms());
    setMaintenanceLogs(store.getMaintenanceLogs());
  };

  useEffect(() => {
    store.seedDemoData();
    refreshData();
  }, []);

  return (
    <DataContext.Provider value={{
      equipment, categories, equipmentTypes, users, rooms, maintenanceLogs, refreshData,
      addEquipment: (item) => { store.addEquipment(item); refreshData(); },
      updateEquipment: (item) => { store.updateEquipment(item); refreshData(); },
      deleteEquipment: (id) => { store.deleteEquipment(id); refreshData(); },
      addCategory: (item) => { store.addCategory(item); refreshData(); },
      updateCategory: (item) => { store.updateCategory(item); refreshData(); },
      deleteCategory: (id) => { store.deleteCategory(id); refreshData(); },
      addEquipmentType: (item) => { store.addEquipmentType(item); refreshData(); },
      updateEquipmentType: (item) => { store.updateEquipmentType(item); refreshData(); },
      deleteEquipmentType: (id) => { store.deleteEquipmentType(id); refreshData(); },
      addUser: (item) => { store.addUser(item); refreshData(); },
      updateUser: (item) => { store.updateUser(item); refreshData(); },
      deleteUser: (id) => { store.deleteUser(id); refreshData(); },
      addRoom: (item) => { store.addRoom(item); refreshData(); },
      updateRoom: (item) => { store.updateRoom(item); refreshData(); },
      deleteRoom: (id) => { store.deleteRoom(id); refreshData(); },
      addMaintenanceLog: (item) => { store.addMaintenanceLog(item); refreshData(); },
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within DataProvider');
  return context;
}
