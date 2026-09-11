import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { useNavigate } from 'react-router-dom';
import * as api from '../api';

interface EquipmentTemplate {
  id: string;
  name: string;
  typeId: string;
  cpu?: string;
  ram?: number;
  storageType?: 'SSD' | 'HDD' | 'M2' | '';
  storageSize?: number;
  notes?: string;
}

export default function EquipmentTemplates() {
  const { equipmentTypes, categories, addEquipment } = useData();
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<EquipmentTemplate[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    typeId: '',
    cpu: '',
    ram: 0,
    storageType: '' as 'SSD' | 'HDD' | 'M2' | '',
    storageSize: 0,
    notes: ''
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = () => {
    const saved = localStorage.getItem('equipment_templates');
    if (saved) {
      setTemplates(JSON.parse(saved));
    }
  };

  const saveTemplates = (newTemplates: EquipmentTemplate[]) => {
    localStorage.setItem('equipment_templates', JSON.stringify(newTemplates));
    setTemplates(newTemplates);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const template: EquipmentTemplate = {
      id: editing || Date.now().toString(),
      ...form
    };

    let newTemplates;
    if (editing) {
      newTemplates = templates.map(t => t.id === editing ? template : t);
    } else {
      newTemplates = [...templates, template];
    }

    saveTemplates(newTemplates);
    setShowForm(false);
    setEditing(null);
    setForm({
      name: '',
      typeId: '',
      cpu: '',
      ram: 0,
      storageType: '',
      storageSize: 0,
      notes: ''
    });
  };

  const startEdit = (template: EquipmentTemplate) => {
    setForm({
      name: template.name,
      typeId: template.typeId,
      cpu: template.cpu || '',
      ram: template.ram || 0,
      storageType: template.storageType || '',
      storageSize: template.storageSize || 0,
      notes: template.notes || ''
    });
    setEditing(template.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (!confirm('Удалить шаблон?')) return;
    const newTemplates = templates.filter(t => t.id !== id);
    saveTemplates(newTemplates);
  };

  const handleCreateFromTemplate = async (template: EquipmentTemplate) => {
    try {
      const newEquipment = await addEquipment({
        name: template.name,
        typeId: template.typeId,
        status: 'in_reserve',
        cpu: template.cpu || '',
        ram: template.ram || 0,
        storageType: template.storageType || '',
        storageSize: template.storageSize || 0,
        notes: template.notes || `Создано из шаблона: ${template.name}`,
        userId: null,
        roomId: null,
        serialNumber: '',
        inventoryNumber: '',
        purchaseDate: '',
        warrantyEnd: '',
        lastMaintenanceDate: '',
        nextMaintenanceDate: '',
        qrCode: '',
        createdAt: ''
      } as any);
      navigate(`/equipment/${newEquipment.id}/edit`);
    } catch (err: any) {
      alert('❌ Ошибка: ' + err.message);
    }
  };

  const getTypeName = (typeId: string) => equipmentTypes.find(t => t.id === typeId)?.name || '—';
  const getCategoryName = (typeId: string) => {
    const type = equipmentTypes.find(t => t.id === typeId);
    if (!type) return '—';
    return categories.find(c => c.id === type.categoryId)?.name || '—';
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Шаблоны оборудования</h2>
        <button
          onClick={() => { setShowForm(!showForm); setEditing(null); setForm({ name: '', typeId: '', cpu: '', ram: 0, storageType: '', storageSize: 0, notes: '' }); }}
          className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          {showForm ? 'Скрыть форму' : '+ Добавить шаблон'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-4 sm:mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">{editing ? 'Редактировать шаблон' : 'Новый шаблон'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Название шаблона *</label>
              <input
                required
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Например: Стандартный ПК"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Тип оборудования *</label>
              <select
                required
                value={form.typeId}
                onChange={e => setForm({ ...form, typeId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Выберите тип</option>
                {equipmentTypes.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Процессор (ЦП)</label>
              <input
                value={form.cpu}
                onChange={e => setForm({ ...form, cpu: e.target.value })}
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
                onChange={e => setForm({ ...form, ram: parseInt(e.target.value) || 0 })}
                placeholder="Например: 16"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Тип хранилища</label>
              <select
                value={form.storageType}
                onChange={e => setForm({ ...form, storageType: e.target.value as 'SSD' | 'HDD' | 'M2' | '' })}
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
                onChange={e => setForm({ ...form, storageSize: parseInt(e.target.value) || 0 })}
                placeholder="Например: 512"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Заметки</label>
              <textarea
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                rows={3}
                placeholder="Дополнительная информация о шаблоне..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
              {editing ? 'Сохранить' : 'Создать'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">
              Отмена
            </button>
          </div>
        </form>
      )}

      {templates.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-gray-500">Нет шаблонов оборудования</p>
          <p className="text-sm text-gray-400 mt-2">Создайте шаблоны для быстрого добавления однотипного оборудования</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map(template => (
            <div key={template.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-800 truncate">{template.name}</h3>
                  <p className="text-xs text-gray-500">{getTypeName(template.typeId)} • {getCategoryName(template.typeId)}</p>
                </div>
                <div className="flex gap-1 ml-2">
                  <button onClick={() => startEdit(template)} className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg">✏️</button>
                  <button onClick={() => handleDelete(template.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">🗑️</button>
                </div>
              </div>
              
              <div className="space-y-1 text-xs text-gray-600 mb-3">
                {template.cpu && <p><span className="text-gray-400">ЦП:</span> {template.cpu}</p>}
                {template.ram && template.ram > 0 && <p><span className="text-gray-400">ОЗУ:</span> {template.ram} ГБ</p>}
                {template.storageType && <p><span className="text-gray-400">Хранилище:</span> {template.storageType}{template.storageSize ? ` ${template.storageSize} ГБ` : ''}</p>}
              </div>

              <button
                onClick={() => handleCreateFromTemplate(template)}
                className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                Создать оборудование
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
