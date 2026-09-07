import { Equipment, Category, EquipmentType, User, Room, MaintenanceLog } from './types';

const STORAGE_KEYS = {
  equipment: 'itam_equipment',
  categories: 'itam_categories',
  equipmentTypes: 'itam_equipment_types',
  users: 'itam_users',
  rooms: 'itam_rooms',
  maintenanceLogs: 'itam_maintenance_logs',
};

function getItem<T>(key: string): T[] {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

function setItem<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

// Equipment
export const getEquipment = (): Equipment[] => getItem<Equipment>(STORAGE_KEYS.equipment);
export const setEquipment = (data: Equipment[]) => setItem(STORAGE_KEYS.equipment, data);
export const addEquipment = (item: Equipment) => {
  const items = getEquipment();
  items.push(item);
  setEquipment(items);
};
export const updateEquipment = (item: Equipment) => {
  const items = getEquipment().map(i => i.id === item.id ? item : i);
  setEquipment(items);
};
export const deleteEquipment = (id: string) => {
  setEquipment(getEquipment().filter(i => i.id !== id));
};

// Categories
export const getCategories = (): Category[] => getItem<Category>(STORAGE_KEYS.categories);
export const setCategories = (data: Category[]) => setItem(STORAGE_KEYS.categories, data);
export const addCategory = (item: Category) => {
  const items = getCategories();
  items.push(item);
  setCategories(items);
};
export const updateCategory = (item: Category) => {
  const items = getCategories().map(i => i.id === item.id ? item : i);
  setCategories(items);
};
export const deleteCategory = (id: string) => {
  setCategories(getCategories().filter(i => i.id !== id));
};

// Equipment Types
export const getEquipmentTypes = (): EquipmentType[] => getItem<EquipmentType>(STORAGE_KEYS.equipmentTypes);
export const setEquipmentTypes = (data: EquipmentType[]) => setItem(STORAGE_KEYS.equipmentTypes, data);
export const addEquipmentType = (item: EquipmentType) => {
  const items = getEquipmentTypes();
  items.push(item);
  setEquipmentTypes(items);
};
export const updateEquipmentType = (item: EquipmentType) => {
  const items = getEquipmentTypes().map(i => i.id === item.id ? item : i);
  setEquipmentTypes(items);
};
export const deleteEquipmentType = (id: string) => {
  setEquipmentTypes(getEquipmentTypes().filter(i => i.id !== id));
};

// Users
export const getUsers = (): User[] => getItem<User>(STORAGE_KEYS.users);
export const setUsers = (data: User[]) => setItem(STORAGE_KEYS.users, data);
export const addUser = (item: User) => {
  const items = getUsers();
  items.push(item);
  setUsers(items);
};
export const updateUser = (item: User) => {
  const items = getUsers().map(i => i.id === item.id ? item : i);
  setUsers(items);
};
export const deleteUser = (id: string) => {
  setUsers(getUsers().filter(i => i.id !== id));
};

// Rooms
export const getRooms = (): Room[] => getItem<Room>(STORAGE_KEYS.rooms);
export const setRooms = (data: Room[]) => setItem(STORAGE_KEYS.rooms, data);
export const addRoom = (item: Room) => {
  const items = getRooms();
  items.push(item);
  setRooms(items);
};
export const updateRoom = (item: Room) => {
  const items = getRooms().map(i => i.id === item.id ? item : i);
  setRooms(items);
};
export const deleteRoom = (id: string) => {
  setRooms(getRooms().filter(i => i.id !== id));
};

// Maintenance Logs
export const getMaintenanceLogs = (): MaintenanceLog[] => getItem<MaintenanceLog>(STORAGE_KEYS.maintenanceLogs);
export const setMaintenanceLogs = (data: MaintenanceLog[]) => setItem(STORAGE_KEYS.maintenanceLogs, data);
export const addMaintenanceLog = (item: MaintenanceLog) => {
  const items = getMaintenanceLogs();
  items.push(item);
  setMaintenanceLogs(items);
};

// Seed demo data
export function seedDemoData() {
  if (getCategories().length === 0) {
    const categories: Category[] = [
      { id: 'cat-1', name: 'Компьютеры', description: 'Настольные компьютеры и ноутбуки' },
      { id: 'cat-2', name: 'Периферия', description: 'Мониторы, клавиатуры, мыши' },
      { id: 'cat-3', name: 'Сетевое оборудование', description: 'Роутеры, свитчи, точки доступа' },
      { id: 'cat-4', name: 'Оргтехника', description: 'Принтеры, сканеры, МФУ' },
    ];
    setCategories(categories);
  }

  if (getEquipmentTypes().length === 0) {
    const types: EquipmentType[] = [
      { id: 'type-1', name: 'Ноутбук', categoryId: 'cat-1' },
      { id: 'type-2', name: 'Настольный ПК', categoryId: 'cat-1' },
      { id: 'type-3', name: 'Монитор', categoryId: 'cat-2' },
      { id: 'type-4', name: 'Клавиатура', categoryId: 'cat-2' },
      { id: 'type-5', name: 'Роутер', categoryId: 'cat-3' },
      { id: 'type-6', name: 'Принтер', categoryId: 'cat-4' },
    ];
    setEquipmentTypes(types);
  }

  if (getUsers().length === 0) {
    const users: User[] = [
      { id: 'user-1', firstName: 'Иван', lastName: 'Петров', email: 'petrov@company.ru', department: 'IT отдел', position: 'Системный администратор' },
      { id: 'user-2', firstName: 'Мария', lastName: 'Сидорова', email: 'sidorova@company.ru', department: 'Бухгалтерия', position: 'Главный бухгалтер' },
      { id: 'user-3', firstName: 'Алексей', lastName: 'Козлов', email: 'kozlov@company.ru', department: 'Отдел разработки', position: 'Разработчик' },
    ];
    setUsers(users);
  }

  if (getRooms().length === 0) {
    const rooms: Room[] = [
      { id: 'room-1', name: 'Серверная', building: 'Главный корпус', floor: 1, description: 'Основная серверная комната' },
      { id: 'room-2', name: 'Кабинет 201', building: 'Главный корпус', floor: 2, description: 'Отдел разработки' },
      { id: 'room-3', name: 'Кабинет 305', building: 'Главный корпус', floor: 3, description: 'Бухгалтерия' },
      { id: 'room-4', name: 'Склад', building: 'Главный корпус', floor: 0, description: 'Склад оборудования' },
    ];
    setRooms(rooms);
  }

  if (getEquipment().length === 0) {
    const equipment: Equipment[] = [
      {
        id: 'eq-1', name: 'ThinkPad X1 Carbon', serialNumber: 'SN-2024-001', inventoryNumber: 'INV-001',
        typeId: 'type-1', status: 'in_use', userId: 'user-3', roomId: 'room-2',
        purchaseDate: '2024-01-15', warrantyEnd: '2027-01-15',
        lastMaintenanceDate: '2024-06-01', nextMaintenanceDate: '2025-06-01',
        notes: 'Корпоративный ноутбук', qrCode: 'eq-1', createdAt: '2024-01-15'
      },
      {
        id: 'eq-2', name: 'Dell UltraSharp 27', serialNumber: 'SN-2024-002', inventoryNumber: 'INV-002',
        typeId: 'type-3', status: 'in_use', userId: 'user-3', roomId: 'room-2',
        purchaseDate: '2024-02-10', warrantyEnd: '2027-02-10',
        lastMaintenanceDate: '', nextMaintenanceDate: '',
        notes: '', qrCode: 'eq-2', createdAt: '2024-02-10'
      },
      {
        id: 'eq-3', name: 'HP LaserJet Pro', serialNumber: 'SN-2023-015', inventoryNumber: 'INV-003',
        typeId: 'type-6', status: 'in_repair', userId: null, roomId: 'room-3',
        purchaseDate: '2023-03-20', warrantyEnd: '2025-03-20',
        lastMaintenanceDate: '2024-11-01', nextMaintenanceDate: '2025-05-01',
        notes: 'Замена картриджа', qrCode: 'eq-3', createdAt: '2023-03-20'
      },
    ];
    setEquipment(equipment);
  }
}
