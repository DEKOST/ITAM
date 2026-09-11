export type EquipmentStatus = 'in_use' | 'in_reserve' | 'written_off' | 'in_repair';

export interface Category {
  id: string;
  name: string;
  description: string;
}

export interface EquipmentType {
  id: string;
  name: string;
  categoryId: string;
  hasSpecs?: boolean;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  middleName: string;
  email: string;
  subdivisionId: string | null;
  position: string;
}

export interface Subdivision {
  id: string;
  name: string;
  description: string;
  parentId: string | null;
}

export interface Room {
  id: string;
  name: string;
  building: string;
  floor: number;
  description: string;
}

export interface Equipment {
  id: string;
  name: string;
  serialNumber: string;
  inventoryNumber: string;
  typeId: string;
  status: EquipmentStatus;
  userId: string | null;
  roomId: string | null;
  purchaseDate: string;
  warrantyEnd: string;
  lastMaintenanceDate: string;
  nextMaintenanceDate: string;
  notes: string;
  qrCode: string;
  createdAt: string;
  // Технические характеристики (для ПК/Ноутбуков)
  cpu?: string;
  ram?: number; // в ГБ
  storageType?: 'SSD' | 'HDD' | 'M2' | '';
  storageSize?: number; // в ГБ
}

export interface MaintenanceLog {
  id: string;
  equipmentId: string;
  date: string;
  type: string;
  description: string;
  performedBy: string;
}

export const STATUS_LABELS: Record<EquipmentStatus, string> = {
  in_use: 'В эксплуатации',
  in_reserve: 'В резерве',
  written_off: 'Списан',
  in_repair: 'В ремонте',
};

export const STATUS_COLORS: Record<EquipmentStatus, string> = {
  in_use: 'bg-green-100 text-green-800',
  in_reserve: 'bg-blue-100 text-blue-800',
  written_off: 'bg-gray-100 text-gray-800',
  in_repair: 'bg-red-100 text-red-800',
};
