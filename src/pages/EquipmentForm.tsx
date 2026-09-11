import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { EquipmentStatus, STATUS_LABELS } from '../types';
import AutocompleteInput from '../components/AutocompleteInput';

// Генерация уникального инвентарного номера в формате INV-XXXXXXXX
function generateInventoryNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `INV-${timestamp}${random}`;
}

// Конвертация ISO даты в формат YYYY-MM-DD для input type="date"
function isoToDateInput(isoDate: string): string {
  if (!isoDate) return '';
  try {
    const date = new Date(isoDate);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
  } catch {
    return '';
  }
}

// Конвертация даты из input type="date" (YYYY-MM-DD) в ISO формат
function dateInputToISO(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    return date.toISOString();
  } catch {
    return '';
  }
}

export default function EquipmentForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { equipment, equipmentTypes, categories, users, rooms, subdivisions, addEquipment, updateEquipment, addRoom, addUser, addSubdivision } = useData();
  const isEdit = !!id;
  const existing = id ? equipment.find(e => e.id === id) : null;
  
  // Состояние для модального окна создания помещения
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [newRoomForm, setNewRoomForm] = useState({ name: '', building: '', floor: 1, description: '' });
  
  // Состояние для модального окна создания сотрудника
  const [showUserModal, setShowUserModal] = useState(false);
  const [newUserForm, setNewUserForm] = useState({ firstName: '', lastName: '', middleName: '', email: '', subdivisionId: '', position: '' });
  
  // Состояние для модального окна создания подразделения
  const [showSubdivisionModal, setShowSubdivisionModal] = useState(false);
  const [newSubdivisionForm, setNewSubdivisionForm] = useState({ name: '', description: '', parentId: '' });

  // Инициализируем форму только один раз при монтировании
  const [form, setForm] = useState(() => {
    if (existing) {
      return {
        name: existing.name, serialNumber: existing.serialNumber, inventoryNumber: existing.inventoryNumber,
        typeId: existing.typeId, status: existing.status, userId: existing.userId || '', roomId: existing.roomId || '',
        purchaseDate: isoToDateInput(existing.purchaseDate), warrantyEnd: isoToDateInput(existing.warrantyEnd),
        lastMaintenanceDate: isoToDateInput(existing.lastMaintenanceDate), nextMaintenanceDate: isoToDateInput(existing.nextMaintenanceDate), notes: existing.notes,
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

  // Получаем уникальные значения для автодополнения
  const nameSuggestions = Array.from(new Set(equipment.map(e => e.name))).filter((n): n is string => !!n);
  const serialNumberSuggestions = Array.from(new Set(equipment.map(e => e.serialNumber))).filter((s): s is string => !!s);
  const cpuSuggestions = Array.from(new Set(equipment.map(e => e.cpu).filter((c): c is string => !!c)));

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
        purchaseDate: dateInputToISO(form.purchaseDate),
        warrantyEnd: dateInputToISO(form.warrantyEnd),
        lastMaintenanceDate: dateInputToISO(form.lastMaintenanceDate),
        nextMaintenanceDate: dateInputToISO(form.nextMaintenanceDate),
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

  const handleCreateRoom = async () => {
    if (!newRoomForm.name.trim()) {
      alert('Введите название помещения');
      return;
    }
    try {
      const newRoom = await addRoom(newRoomForm);
      setForm({ ...form, roomId: newRoom.id });
      setShowRoomModal(false);
      setNewRoomForm({ name: '', building: '', floor: 1, description: '' });
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateUser = async () => {
    if (!newUserForm.firstName.trim() || !newUserForm.lastName.trim()) {
      alert('Введите имя и фамилию сотрудника');
      return;
    }
    try {
      const newUser = await addUser(newUserForm);
      setForm({ ...form, userId: newUser.id });
      setShowUserModal(false);
      setNewUserForm({ firstName: '', lastName: '', middleName: '', email: '', subdivisionId: '', position: '' });
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateSubdivision = async () => {
    if (!newSubdivisionForm.name.trim()) {
      alert('Введите название подразделения');
      return;
    }
    try {
      const newSubdivision = await addSubdivision(newSubdivisionForm);
      setNewUserForm({ ...newUserForm, subdivisionId: newSubdivision.id });
      setShowSubdivisionModal(false);
      setNewSubdivisionForm({ name: '', description: '', parentId: '' });
    } catch (err: any) {
      alert(err.message);
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
            <AutocompleteInput
              label="Название *"
              value={form.name}
              onChange={value => setForm({...form, name: value})}
              suggestions={nameSuggestions}
              placeholder="Например: AOC 24B3HA2"
              required
            />
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
            <AutocompleteInput
              label="Серийный номер"
              value={form.serialNumber}
              onChange={value => setForm({...form, serialNumber: value})}
              suggestions={serialNumberSuggestions}
              placeholder="Начните вводить для поиска"
            />
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
              <div className="flex gap-2">
                <select value={form.userId} onChange={e => setForm({...form, userId: e.target.value})} className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Не назначен</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.lastName} {u.firstName} {u.middleName || ''}</option>)}
                </select>
                <button 
                  type="button"
                  onClick={() => setShowUserModal(true)}
                  className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
                  title="Создать нового сотрудника"
                >
                  +
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Помещение</label>
              <div className="flex gap-2">
                <select value={form.roomId} onChange={e => setForm({...form, roomId: e.target.value})} className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Не указано</option>
                  {rooms.map(r => <option key={r.id} value={r.id}>{r.name} ({r.building})</option>)}
                </select>
                <button 
                  type="button"
                  onClick={() => setShowRoomModal(true)}
                  className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
                  title="Создать новое помещение"
                >
                  +
                </button>
              </div>
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
                <AutocompleteInput
                  label="Процессор (ЦП)"
                  value={form.cpu}
                  onChange={value => setForm({...form, cpu: value})}
                  suggestions={cpuSuggestions}
                  placeholder="Начните вводить для поиска"
                />
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

      {/* Модальное окно создания помещения */}
      {showRoomModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Новое помещение</h3>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Название *</label>
                <input
                  type="text"
                  value={newRoomForm.name}
                  onChange={e => setNewRoomForm({...newRoomForm, name: e.target.value})}
                  placeholder="Например: Кабинет 301"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Здание *</label>
                <input
                  type="text"
                  value={newRoomForm.building}
                  onChange={e => setNewRoomForm({...newRoomForm, building: e.target.value})}
                  placeholder="Например: Главный корпус"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Этаж</label>
                <input
                  type="number"
                  value={newRoomForm.floor}
                  onChange={e => setNewRoomForm({...newRoomForm, floor: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
                <input
                  type="text"
                  value={newRoomForm.description}
                  onChange={e => setNewRoomForm({...newRoomForm, description: e.target.value})}
                  placeholder="Необязательно"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={handleCreateRoom} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">Создать</button>
              <button onClick={() => { setShowRoomModal(false); setNewRoomForm({ name: '', building: '', floor: 1, description: '' }); }} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">Отмена</button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно создания сотрудника */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Новый сотрудник</h3>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Фамилия *</label>
                <input
                  type="text"
                  value={newUserForm.lastName}
                  onChange={e => setNewUserForm({...newUserForm, lastName: e.target.value})}
                  placeholder="Например: Иванов"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Имя *</label>
                <input
                  type="text"
                  value={newUserForm.firstName}
                  onChange={e => setNewUserForm({...newUserForm, firstName: e.target.value})}
                  placeholder="Например: Иван"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Отчество</label>
                <input
                  type="text"
                  value={newUserForm.middleName}
                  onChange={e => setNewUserForm({...newUserForm, middleName: e.target.value})}
                  placeholder="Например: Иванович"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={newUserForm.email}
                  onChange={e => setNewUserForm({...newUserForm, email: e.target.value})}
                  placeholder="Например: ivanov@company.ru"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Подразделение</label>
                <div className="flex gap-2">
                  <select 
                    value={newUserForm.subdivisionId} 
                    onChange={e => setNewUserForm({...newUserForm, subdivisionId: e.target.value})}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Не указано</option>
                    {subdivisions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <button 
                    type="button"
                    onClick={() => setShowSubdivisionModal(true)}
                    className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
                    title="Создать новое подразделение"
                  >
                    +
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Должность</label>
                <input
                  type="text"
                  value={newUserForm.position}
                  onChange={e => setNewUserForm({...newUserForm, position: e.target.value})}
                  placeholder="Например: Системный администратор"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={handleCreateUser} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">Создать</button>
              <button onClick={() => { setShowUserModal(false); setNewUserForm({ firstName: '', lastName: '', middleName: '', email: '', subdivisionId: '', position: '' }); }} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">Отмена</button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно создания подразделения */}
      {showSubdivisionModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Новое подразделение</h3>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Название *</label>
                <input
                  type="text"
                  value={newSubdivisionForm.name}
                  onChange={e => setNewSubdivisionForm({...newSubdivisionForm, name: e.target.value})}
                  placeholder="Например: IT отдел"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Родительское подразделение</label>
                <select 
                  value={newSubdivisionForm.parentId} 
                  onChange={e => setNewSubdivisionForm({...newSubdivisionForm, parentId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Нет (корневое)</option>
                  {subdivisions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
                <textarea
                  value={newSubdivisionForm.description}
                  onChange={e => setNewSubdivisionForm({...newSubdivisionForm, description: e.target.value})}
                  placeholder="Необязательно"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={handleCreateSubdivision} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">Создать</button>
              <button onClick={() => { setShowSubdivisionModal(false); setNewSubdivisionForm({ name: '', description: '', parentId: '' }); }} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">Отмена</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
