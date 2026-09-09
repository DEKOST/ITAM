import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { EquipmentStatus, STATUS_LABELS } from '../types';

// Генерация уникального инвентарного номера в формате INV-XXXXXXXX
function generateInventoryNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `INV-${timestamp}${random}`;
}

export default function EquipmentForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { equipment, equipmentTypes, categories, users, rooms, addEquipment, updateEquipment } = useData();
  const isEdit = !!id;
  const existing = id ? equipment.find(e => e.id === id) : null;

  // Инициализируем форму только один раз при монтировании
  const [form, setForm] = useState(() => {
    if (existing) {
      return {
        name: existing.name, serialNumber: existing.serialNumber, inventoryNumber: existing.inventoryNumber,
        typeId: existing.typeId, status: existing.status, userId: existing.userId || '', roomId: existing.roomId || '',
        purchaseDate: existing.purchaseDate, warrantyEnd: existing.warrantyEnd,
        lastMaintenanceDate: existing.lastMaintenanceDate, nextMaintenanceDate: existing.nextMaintenanceDate, notes: existing.notes,
        cpu: existing.cpu || '', ram: existing.ram || 0, storageType: existing.storageType || '', storageSize: existing.storageSize || 0
      };
    }
    return {
      name: '', serialNumber: '', inventoryNumber: generateInventoryNumber(), typeId: '',
      status: 'in_use' as EquipmentStatus, userId: '', roomId: '',
      purchaseDate: '', warrantyEnd: '', lastMaintenanceDate: '', nextMaintenanceDate: '', notes: '',
      cpu: '', ram: 0, storageType: '', storageSize: 0
    };
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = {
        name: form.name,
        serialNumber: form.serialNumber,
        inventoryNumber: form.inventoryNumber,
        typeId: form.typeId,
        status: form.status,
        userId: form.userId || null,
        roomId: form.roomId || null,
        purchaseDate: form.purchaseDate,
        warrantyEnd: form.warrantyEnd,
        lastMaintenanceDate: form.lastMaintenanceDate,
        nextMaintenanceDate: form.nextMaintenanceDate,
        notes: form.notes,
        cpu: form.cpu,
        ram: form.ram,
        storageType: form.storageType,
        storageSize: form.storageSize
      };
      if (isEdit && id) {
        await updateEquipment(id, data as any);
      } else {
        await addEquipment(data as any);
      }
      navigate('/equipment');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const groupedTypes = categories.map(cat => ({
    category: cat,
    types: equipmentTypes.filter(t => t.categoryId === cat.id)
  })).filter(g => g.types.length > 0);

  return (
    <div className="max-w-3xl">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">{isEdit ? 'Редактировать оборудование' : 'Новое оборудование'}</h2>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
        <div>
          <h3 className="text-md font-semibold text-gray-700 mb-3">Основная информация</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Название *</label>
              <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Тип *</label>
              <select required value={form.typeId} onChange={e => setForm({...form, typeId: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Выберите тип</option>
                {groupedTypes.map(g => (
                  <optgroup key={g.category.id} label={g.category.name}>
                    {g.types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </optgroup>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Серийный номер</label>
              <input value={form.serialNumber} onChange={e => setForm({...form, serialNumber: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Инвентарный номер</label>
              <input value={form.inventoryNumber} onChange={e => setForm({...form, inventoryNumber: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Статус</label>
              <select value={form.status} onChange={e => setForm({...form, status: e.target.value as EquipmentStatus})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-md font-semibold text-gray-700 mb-3">Привязка</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Сотрудник</label>
              <select value={form.userId} onChange={e => setForm({...form, userId: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Не назначен</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.lastName} {u.firstName} {u.middleName || ''}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Помещение</label>
              <select value={form.roomId} onChange={e => setForm({...form, roomId: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Не указано</option>
                {rooms.map(r => <option key={r.id} value={r.id}>{r.name} ({r.building})</option>)}
              </select>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-md font-semibold text-gray-700 mb-3">Даты</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Дата покупки</label>
              <input type="date" value={form.purchaseDate} onChange={e => setForm({...form, purchaseDate: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Гарантия до</label>
              <input type="date" value={form.warrantyEnd} onChange={e => setForm({...form, warrantyEnd: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Последнее ТО</label>
              <input type="date" value={form.lastMaintenanceDate} onChange={e => setForm({...form, lastMaintenanceDate: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Следующее ТО</label>
              <input type="date" value={form.nextMaintenanceDate} onChange={e => setForm({...form, nextMaintenanceDate: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        </div>

        {/* Технические характеристики - показываем только для типов с hasSpecs */}
        {(() => {
          const selectedType = equipmentTypes.find(t => t.id === form.typeId);
          if (!selectedType?.hasSpecs) return null;
          
          return (
            <div>
              <h3 className="text-md font-semibold text-gray-700 mb-3">Технические характеристики</h3>
              <p className="text-xs text-gray-500 mb-3">Заполняется для ПК и ноутбуков</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Процессор (ЦП)</label>
                  <input 
                    value={form.cpu} 
                    onChange={e => setForm({...form, cpu: e.target.value})} 
                    placeholder="Например: Intel Core i5-12400"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Оперативная память (ОЗУ), ГБ</label>
                  <input 
                    type="number"
                    min="0"
                    value={form.ram} 
                    onChange={e => setForm({...form, ram: parseInt(e.target.value) || 0})} 
                    placeholder="Например: 16"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Тип хранилища</label>
                  <select 
                    value={form.storageType} 
                    onChange={e => setForm({...form, storageType: e.target.value as any})} 
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Не указано</option>
                    <option value="SSD">SSD</option>
                    <option value="HDD">HDD</option>
                    <option value="M2">M.2 NVMe</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Объём хранилища, ГБ</label>
                  <input 
                    type="number"
                    min="0"
                    value={form.storageSize} 
                    onChange={e => setForm({...form, storageSize: parseInt(e.target.value) || 0})} 
                    placeholder="Например: 512"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  />
                </div>
              </div>
            </div>
          );
        })()}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Заметки</label>
          <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Сохранение...' : isEdit ? 'Сохранить' : 'Создать'}
          </button>
          <button type="button" onClick={() => navigate('/equipment')} className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">Отмена</button>
        </div>
      </form>
    </div>
  );
}
