import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { Equipment, EquipmentStatus, STATUS_LABELS } from '../types';
import { v4 as uuidv4 } from 'uuid';

export default function EquipmentForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { equipment, equipmentTypes, categories, users, rooms, addEquipment, updateEquipment } = useData();
  const isEdit = !!id;

  const [form, setForm] = useState<Omit<Equipment, 'id' | 'qrCode' | 'createdAt'>>({
    name: '', serialNumber: '', inventoryNumber: '', typeId: '', status: 'in_reserve',
    userId: '', roomId: '', purchaseDate: '', warrantyEnd: '',
    lastMaintenanceDate: '', nextMaintenanceDate: '', notes: '',
  });

  useEffect(() => {
    if (isEdit) {
      const eq = equipment.find(e => e.id === id);
      if (eq) {
        setForm({
          name: eq.name, serialNumber: eq.serialNumber, inventoryNumber: eq.inventoryNumber,
          typeId: eq.typeId, status: eq.status, userId: eq.userId || '', roomId: eq.roomId || '',
          purchaseDate: eq.purchaseDate, warrantyEnd: eq.warrantyEnd,
          lastMaintenanceDate: eq.lastMaintenanceDate, nextMaintenanceDate: eq.nextMaintenanceDate,
          notes: eq.notes,
        });
      }
    }
  }, [id, isEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEdit) {
      updateEquipment({ ...equipment.find(eq => eq.id === id)!, ...form, userId: form.userId || null, roomId: form.roomId || null });
    } else {
      const newId = uuidv4();
      addEquipment({ ...form, id: newId, qrCode: newId, userId: form.userId || null, roomId: form.roomId || null, createdAt: new Date().toISOString().split('T')[0] } as Equipment);
    }
    navigate('/equipment');
  };

  const groupedTypes = categories.map(cat => ({
    category: cat,
    types: equipmentTypes.filter(t => t.categoryId === cat.id),
  })).filter(g => g.types.length > 0);

  return (
    <div className="max-w-3xl">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">{isEdit ? 'Редактировать оборудование' : 'Новое оборудование'}</h2>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
        {/* Basic info */}
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Основная информация</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Название *</label>
              <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Серийный номер</label>
              <input value={form.serialNumber} onChange={e => setForm({...form, serialNumber: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Инвентарный номер *</label>
              <input required value={form.inventoryNumber} onChange={e => setForm({...form, inventoryNumber: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Тип оборудования *</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Статус</label>
              <select value={form.status} onChange={e => setForm({...form, status: e.target.value as EquipmentStatus})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Assignment */}
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Привязка</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Сотрудник</label>
              <select value={form.userId || ''} onChange={e => setForm({...form, userId: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Не назначен</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.lastName} {u.firstName}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Помещение</label>
              <select value={form.roomId || ''} onChange={e => setForm({...form, roomId: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Не указано</option>
                {rooms.map(r => <option key={r.id} value={r.id}>{r.name} ({r.building})</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Dates */}
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Даты</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Дата покупки</label>
              <input type="date" value={form.purchaseDate} onChange={e => setForm({...form, purchaseDate: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Конец гарантии</label>
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

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Заметки</label>
          <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div className="flex gap-3">
          <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            {isEdit ? 'Сохранить' : 'Создать'}
          </button>
          <button type="button" onClick={() => navigate('/equipment')} className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
            Отмена
          </button>
        </div>
      </form>
    </div>
  );
}
